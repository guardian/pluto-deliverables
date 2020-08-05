import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  RouteComponentProps,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import DeliverableTypeSelector from "./DeliverableTypeSelector";

interface HeaderTitles {
  label: string;
  key?: keyof Deliverable;
}

declare var deploymentRootPath: string;

const tableHeaderTitles: HeaderTitles[] = [
  { label: "Selector", key: "id" },
  { label: "Filename", key: "filename" },
  { label: "Version", key: "version" },
  { label: "Size", key: "size" },
  { label: "Duration", key: "duration" },
  { label: "Type", key: "type" },
  { label: "Last modified", key: "modified_dt" },
  { label: "Action/status", key: "status" },
];

const useStyles = makeStyles({
  table: {
    maxWidth: "100%",
  },
  buttonContainer: {},
  buttons: {
    marginRight: "0.4rem",
    marginBottom: "0.625rem",
  },
  sectionHeader: {
    display: "inline",
    marginRight: "1em",
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
  },
});

const ProjectDeliverablesComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  const history = useHistory();
  const { search } = useLocation();
  const { projectid } = useParams();

  // React state
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastError, setLastError] = useState<object | null>(null);
  const [selectedIDs, setSelectedIDs] = useState<bigint[]>([]);
  const [typeOptions, setTypeOptions] = useState<DeliverableTypes>({});

  // Material-UI
  const classes = useStyles();

  const doRefresh = () => {};

  const loadRecord = async () => {
    await setLoading(true);

    try {
      const response = await axios.get(
        `/api/deliverables?project_id=${projectid}`
      );
      return Promise.all([setDeliverables(response.data), setLoading(false)]);
    } catch (err) {
      return Promise.all([setLastError(err), setLoading(false)]);
    }
  };

  const loadDelTypes = async () => {
    try {
      const response = await axios.get("/api/typeslist");
      return setTypeOptions(response.data);
    } catch (err) {
      console.error("Could not load in deliverable types: ", err);
    }
  };

  useEffect(() => {
    loadDelTypes();
    loadRecord();
  }, []);

  return (
    <>
      <Paper elevation={3}>
        <div>
          <h2 className={classes.sectionHeader}>Files</h2>
          <span>
            location: <a href="pluto:openfolder:fixme">/path/to/folder</a>
          </span>
        </div>
        <hr />
        <span className={classes.buttonContainer}>
          <Button
            className={classes.buttons}
            variant="outlined"
            onClick={() => doRefresh()}
          >
            Refresh
          </Button>
          <Button className={classes.buttons} variant="outlined">
            Delete
          </Button>
        </span>
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                {tableHeaderTitles.map((entry, idx) => (
                  <TableCell key={`r${idx}`}>{entry.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {deliverables.map((del, idx) => (
                <TableRow key={del.id.toString()}>
                  <TableCell>
                    <input
                      type="checkbox"
                      onChange={(evt) => {
                        console.log(
                          `checkbox ${del.id} changed: ${evt.target.checked}`
                        );
                        if (evt.target.checked) {
                          setSelectedIDs((prevContent) =>
                            prevContent.concat(del.id)
                          );
                        } else {
                          setSelectedIDs((prevContent) =>
                            prevContent.filter((value) => value !== del.id)
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{del.filename}</TableCell>
                  <TableCell>{del.version ?? "-"}</TableCell>
                  <TableCell>{del.size_string ?? "-"}</TableCell>
                  <TableCell>{del.duration ?? "-"}</TableCell>
                  <TableCell>
                    <DeliverableTypeSelector
                      content={typeOptions}
                      showTip={true}
                      value={del.type}
                      onChange={(newvalue) =>
                        console.log(`You selected ${newvalue}`)
                      }
                    />
                  </TableCell>
                  <TableCell>{del.modified_dt}</TableCell>
                  <TableCell>{del.status_string}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default ProjectDeliverablesComponent;
