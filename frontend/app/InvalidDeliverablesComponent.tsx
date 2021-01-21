import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import LocationLink from "./LocationLink";
import { Helmet } from "react-helmet";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Input,
  TextField,
  Collapse,
  Tooltip,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import {
  RouteComponentProps,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import DeliverableTypeSelector from "./DeliverableTypeSelector";
import {
  getInvalidDeliverables,
} from "./api-service";
import MasterList from "./MasterList/MasterList";
import InvalidRow from "./InvalidRow";
import BeforeUnloadComponent from "react-beforeunload-component";
import { CloudUpload } from "@material-ui/icons";
import UploaderMain from "./DeliverableUploader/UploaderMain";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import CloseIcon from "@material-ui/icons/Close";
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core/styles";
import DayGraph from "./DayGraph";

interface HeaderTitles {
  label: string;
  key?: keyof Deliverable;
}

declare var deploymentRootPath: string;
declare var vidispineBaseUri: string;

const tableHeaderTitles: HeaderTitles[] = [
  { label: "File", key: "filename" },
  { label: "", key: "atom_id" },
  { label: "Last Modified", key: "modified_dt" },
  { label: "Type", key: "type" },
  { label: "Status", key: "status" },
  { label: "Go To", key: "job_id" },
];

const useStyles = makeStyles({
  table: {
    maxWidth: "100%",
  },
  buttonContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(10,10%)",
  },
  buttons: {
    marginRight: "0.4rem",
    marginBottom: "1.2rem",
    marginTop: "0.625rem",
  },
  adoptAssetInput: {
    gridColumnStart: -3,
    gridColumnEnd: -1,
    marginBottom: "1em",
    marginLeft: "0.2em",
  },
  addAssetButton: {
    gridColumnStart: -4,
    gridColumnEnd: -3,
    marginRight: "0.4rem",
    marginBottom: "1.2rem",
    marginTop: "0.625rem",
  },
  centralMessage: {
    gridColumnStart: 3,
    gridColumnEnd: 8,
    margin: "auto",
  },
  sectionHeader: {
    display: "inline",
    marginRight: "1em",
  },
  collapsableTableRow: {
    "& td": {
      paddingBottom: 0,
      paddingTop: 0,
    },

    "& .expandable-cell": {
      width: "100%",
    },
  },
  root: {
    "& > *": {
      borderBottom: "unset",
    },
  },
});

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });

export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

const CustomDialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const InvalidDeliverablesComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  const history = useHistory();
  const { search } = useLocation();
  const { projectid } = useParams();

  // React state
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIDs, setSelectedIDs] = useState<bigint[]>([]);
  const [typeOptions, setTypeOptions] = useState<DeliverableTypes>({});
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [parentBundleInfo, setParentBundleInfo] = useState<Project | undefined>(
    undefined
  );
  const [assetToAdd, setAssetToAdd] = useState<string>("");
  const [adoptInProgress, setAdoptInProgress] = useState<boolean>(false);
  const [centralMessage, setCentralMessage] = useState<string>("");
  const [blockRoute, setBlockRoute] = useState(false);

  const [showingUploader, setShowingUploader] = useState(false);

  // Material-UI
  const classes = useStyles();
  const doRefresh = async () => {
    try {
      const rescanResult = await axios({
        method: "POST",
        url: `/api/bundle/scan?project_id=${projectid}`,
        headers: {
          "X-CSRFToken": Cookies.get("csrftoken"),
        },
      });

      const projectDeliverables = await getInvalidDeliverables();
      setDeliverables(projectDeliverables);
      loadStartedStatus();
    } catch (err) {
      if (err.response) {
        //server returned a bad status code
        if (err.response.data.detail)
          return setCentralMessage(err.response.data.detail);
        else return setCentralMessage(`Error code ${err.response.status}`);
      } else if (err.request) {
        setCentralMessage(`Could not contact server: ${err.message}`);
      } else {
        setCentralMessage(err.message);
      }
    }
  };

  const loadRecord = async () => {
    setLoading(true);

    try {
      const projectDeliverables = await getInvalidDeliverables();
      setDeliverables(projectDeliverables);
      await loadStartedStatus();
    } catch (err) {
      if (err.response) {
        //server returned a bad status code
        if (err.response.data.detail)
          return setCentralMessage(err.response.data.detail);
        else return setCentralMessage(`Error code ${err.response.status}`);
      } else if (err.request) {
        setCentralMessage(`Could not contact server: ${err.message}`);
      } else {
        setCentralMessage(err.message);
      }
    }
  };

  const loadDelTypes = async () => {
    try {
      const response = await axios.get("/api/typeslist");
      return setTypeOptions(response.data);
    } catch (err) {
      console.error("Could not load in deliverable types: ", err);
      setCentralMessage("Could not load in deliverable types");
    }
  };

  const loadParentBundle = async () => {
    try {
      const response = await axios.get(`/api/bundle/byproject/${projectid}`);
      return setParentBundleInfo(response.data);
    } catch (err) {
      console.error("Could not load in parent bundle data: ", err);
      setCentralMessage("Could not load in parent bundle data");
    }
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  const doAdoptItem = async () => {
    setAdoptInProgress(true);
    setCentralMessage("");

    try {
      const result = await axios.post(
        `/api/bundle/adopt?project_id=${projectid}&vs_id=${assetToAdd}`,
        {},
        {
          headers: {
            "X-CSRFToken": Cookies.get("csrftoken"),
          },
        }
      );
      setCentralMessage(`Attached ${assetToAdd} succeessfully`);
      setAssetToAdd("");
      setAdoptInProgress(false);
      return loadRecord();
    } catch (error) {
      //TODO: improve error handling. the endpoint returns 409=>item already exists, 404=?item not found, 400=>invalid argument, 500=>server error.
      console.error("failed to perform adoption: ", error);
      setCentralMessage(
        `Could not attach ${assetToAdd}, please contact MultimediaTech`
      );
    }
  };

  const getSelectedDeliverables = (): Deliverable[] =>
    deliverables.filter((deliverable) => selectedIDs.includes(deliverable.id));

  useEffect(() => {
    loadDelTypes();
    loadRecord();
    loadParentBundle();
  }, []);

  const loadStartedStatus = async () => {
    try {
      const response = await axios.get(
        `/api/bundle/started?project_id=${projectid}`
      );
      if (response.data.ingests_started == true) {
        setBlockRoute(false);
      } else {
        setBlockRoute(true);
      }
    } catch (err) {
      console.error("Could not load if bundle has started ingesting: ", err);
    }
  };

  const handleClose = () => {
    setShowingUploader(false);
  };

  return (
    <>

        <Helmet>
          <title>Invalid Deliverables</title>
        </Helmet>

        <div>
          <h3 className={classes.sectionHeader}>Invalid Deliverables</h3>
        </div>
        <DayGraph />
        <Paper elevation={3}>
          <TableContainer>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  {tableHeaderTitles.map((entry, idx) => (
                    <TableCell key={`r${idx}`}>{entry.label}</TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {deliverables.map((del, idx) => (
                  <InvalidRow
                    key={del.id.toString()}
                    deliverable={del}
                    classes={classes}
                    typeOptions={typeOptions}
                    setCentralMessage={setCentralMessage}
                    onCheckedUpdated={(isChecked) =>
                      isChecked
                        ? setSelectedIDs((prevContent) =>
                            prevContent.concat(del.id)
                          )
                        : setSelectedIDs((prevContent) =>
                            prevContent.filter((value) => value !== del.id)
                          )
                    }
                    parentBundleInfo={parentBundleInfo}
                    onNeedsUpdate={() => loadRecord()}
                    vidispineBaseUri={vidispineBaseUri}
                    openJob={(jobId: string) => {
                      const w = window.open(`/vs-jobs/job/${jobId}`, "_blank");
                      if (w) w.focus();
                    }}
                    project_id={projectid}
                    onSyndicationStarted={() => {}}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

    </>
  );
};

export default InvalidDeliverablesComponent;
