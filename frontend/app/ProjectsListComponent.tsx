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
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  RouteComponentProps,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import HelpIcon from "@material-ui/icons/Help";
import BundleInfoComponent from "./BundleList/BundleInfoComponent";

interface HeaderTitles {
  label: string;
  key?: keyof Project;
}

declare var deploymentRootPath: string;

const tableHeaderTitles: HeaderTitles[] = [
  { label: "Project title", key: "name" },
  { label: "Project ID", key: "project_id" },
  { label: "Created", key: "created" },
  { label: "Open" },
];

interface ProjectsListProps {}

interface ProjectsListState {
  loading?: boolean;
  lastError?: object | null;
  projectsList?: Array<object>;
}

const useStyles = makeStyles({
  table: {
    maxWidth: "100%",
  },
  infoIcon: {
    display: "flex",
    marginLeft: "auto",
    marginBottom: "0.625rem",
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
const pageSizeOptions = [25, 50, 100];

/*

 */
type SortDirection = "asc" | "desc";

const ActionIcons: React.FC<{ id: string }> = (props) => (
  <span className="icons">
    <IconButton href={`${deploymentRootPath}project/${props.id}`}>
      <EditIcon />
    </IconButton>
  </span>
);

const ProjectsListComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  const history = useHistory();
  const { search } = useLocation();

  // React state
  const [order, setOrder] = useState<SortDirection>("asc");
  const [orderBy, setOrderBy] = useState<keyof Project>("name");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastError, setLastError] = useState<object | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  // Material-UI
  const classes = useStyles();

  const fetchProjectsOnPage = async () => {
    await setLoading(true);

    try {
      const server_response = await axios.get("/api/bundle");
      return Promise.all([
        setProjects(server_response.data),
        setLoading(false),
        setLastError(null),
      ]);
    } catch (error) {
      return Promise.all([setLastError(error), setLoading(false)]);
    }
  };

  useEffect(() => {
    fetchProjectsOnPage();
  }, []); //empty array => call on component startup not modify

  const closeDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <h2>Deliverables</h2>
      <Tooltip
        className={classes.infoIcon}
        title="How do I create deliverables?"
      >
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            setOpenDialog(true);
          }}
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
      <Paper elevation={3}>
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                {tableHeaderTitles.map((title, idx) => (
                  <TableCell key={title.label ?? idx}>{title.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell><BundleInfoComponent bundleName={entry.name} projectId={entry.pluto_core_project_id} commissionId={entry.commission_id}/></TableCell>
                  <TableCell>{entry.pluto_core_project_id}</TableCell>
                  <TableCell>{entry.created}</TableCell>
                  <TableCell>
                    <ActionIcons id={entry.pluto_core_project_id.toString()} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog
        open={openDialog}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            All deliverables must be associated with the project that created
            them. In order to create deliverables, click{" "}
            <a href="/pluto-core/project/">Projects</a> and find the project you
            want to create deliverables for. Then, in the lower half of the
            project screen click the button marked "Create Deliverables" or
            "View Deliverables". This will create and open a deliverables list
            which you can add to directly.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default ProjectsListComponent;
