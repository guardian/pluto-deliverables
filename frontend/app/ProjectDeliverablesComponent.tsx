import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import LocationLink from "./LocationLink";
import { Helmet } from "react-helmet";
import { Breadcrumb } from "pluto-headers";
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
  getProjectDeliverables,
  deleteProjectDeliverable,
} from "./api-service";
import MasterList from "./MasterList/MasterList";
import DeliverableRow from "./ProjectDeliverables/DeliverableRow";
import BeforeUnloadComponent from "react-beforeunload-component";
import { Check, CloudUpload } from "@material-ui/icons";
import UploaderMain from "./DeliverableUploader/UploaderMain";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import CloseIcon from "@material-ui/icons/Close";
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core/styles";
import CreateBundleDialogContent from "./CreateBundle/CreateBundleDialogContent";
import CustomDialogTitle from "./CustomDialogTitle";

interface HeaderTitles {
  label: string;
  key?: keyof Deliverable;
}

declare var deploymentRootPath: string;
declare var vidispineBaseUri: string;

const tableHeaderTitles: HeaderTitles[] = [
  { label: "Selector", key: "id" },
  { label: "Filename", key: "filename" },
  { label: "Version", key: "version" },
  { label: "Size", key: "size" },
  { label: "Duration", key: "duration" },
  { label: "Type", key: "type" },
  { label: "Last modified", key: "modified_dt" },
  { label: "Import progress", key: "job_id" },
  { label: "Action/status", key: "status" },
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

const ProjectDeliverablesComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  const history = useHistory();
  // @ts-ignore
  const { search } = useLocation();
  // @ts-ignore
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

  const [haveExistingBundle, setHaveExistingBundle] = useState(true);

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

      const projectDeliverables = await getProjectDeliverables(projectid);
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

  const loadRecord = async () => {
    setLoading(true);

    try {
      const projectDeliverables = await getProjectDeliverables(projectid);
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
      if(projectid=="-1") {
        return setParentBundleInfo({
          commission_id: -1,
          created: "2020-11-01T00:00:00Z",
          local_open_uri: "",
          local_path: "",
          name: "Invalid deliverables",
          pluto_core_project_id: -1,
          project_id: "-1"
        })
      } else {
        const response = await axios.get(`/api/bundle/byproject/${projectid}`);
        return setParentBundleInfo(response.data);
      }
    } catch (err) {
      if (err.response.status == 404) {
        console.log("bundle does not exist for project ", projectid);
        setHaveExistingBundle(false);
      } else {
        console.error("Could not load in parent bundle data: ", err);
        setCentralMessage("Could not load in parent bundle data");
      }
    }
  };

  const deleteSelectedDeliverables = async () => {
    try {
      await deleteProjectDeliverable(projectid, selectedIDs);
      setDeliverables(
        deliverables.filter(
          (deliverable) => !selectedIDs.includes(deliverable.id)
        )
      );
      setSelectedIDs([]);
    } catch (error) {
      console.error(`failed to delete deliverable`, error);
      setCentralMessage("Could not delete deliverable");
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
  }, []);

  useEffect(() => {
    const performLoad = async () => {
      await Promise.all([loadRecord(), loadParentBundle()]);
    };
    if (haveExistingBundle) {
      performLoad().catch((err) => {
        console.error("Could not load in bundle data: ", err);
      });
    }
  }, [haveExistingBundle]);

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

  const newBundleCreated = async () => {
    setHaveExistingBundle(true);
    setCentralMessage("");
    doRefresh();
  };

  return (
    <>
      {parentBundleInfo?.name ? (
        <Helmet>
          <title>[{parentBundleInfo.name}] – Deliverables</title>
        </Helmet>
      ) : null}
      <BeforeUnloadComponent
        blockRoute={blockRoute}
        ignoreChildrenLinks={true}
        alertMessage="One or more items are not ingesting. Are you sure you want to leave?"
      >
        <div>
          <Breadcrumb projectId={projectid} />
          {parentBundleInfo && projectid!="-1" ? (
            <LocationLink
              bundleInfo={parentBundleInfo}
              networkUploadSelected={() => setShowingUploader(true)}
            />
          ) : (
            ""
          )}
        </div>
        <span className={classes.buttonContainer}>
          <Button
            className={classes.buttons}
            variant="outlined"
            disabled={projectid==="-1"}
            onClick={() => doRefresh()}
          >
            Refresh
          </Button>
          <Button
            className={classes.buttons}
            variant="outlined"
            disabled={selectedIDs.length === 0 || projectid===-1}
            onClick={() => setOpenDialog(true)}
          >
            Delete
          </Button>
          <Typography className={classes.centralMessage}>
            {centralMessage}
          </Typography>
          <Button
            className={classes.addAssetButton}
            style={{ display: assetToAdd == "" ? "none" : "inherit" }}
            variant="outlined"
            disabled={assetToAdd == "" || adoptInProgress}
            onClick={doAdoptItem}
          >
            Add Item
          </Button>
          <TextField
            className={classes.adoptAssetInput}
            onChange={(evt) => setAssetToAdd(evt.target.value)}
            value={assetToAdd}
            label="paste Pluto master or asset ID"
            InputProps={{
              readOnly: adoptInProgress,
            }}
          />
        </span>
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
                  <DeliverableRow
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
        <hr />
        <Dialog
          open={openDialog}
          onClose={closeDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Delete Deliverable{selectedIDs.length > 1 ? "s" : ""}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete the deliverable
              {selectedIDs.length > 1 ? "s" : ""}{" "}
              {getSelectedDeliverables()
                .map(
                  (selectedDeliverable) => `"${selectedDeliverable.filename}"`
                )
                .join(", ")}
              ?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setOpenDialog(false);
                deleteSelectedDeliverables();
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showingUploader}
          onClose={() => {
            doRefresh().catch((err) => {
              console.error("Could not refresh: ", err);
              setCentralMessage(
                "There was an error, please click the Refresh button"
              );
            });
            setShowingUploader(false);
          }}
          aria-labelled-by="uploader-title"
          aria-describedby="uploader-desc"
        >
          <CustomDialogTitle id="customized-dialog-title" onClose={handleClose}>
            Upload deliverables to project bundle
          </CustomDialogTitle>
          <DialogContent>
            <UploaderMain
              projectId={projectid}
              dropFolder={parentBundleInfo ? parentBundleInfo.local_path : ""}
            />
          </DialogContent>
        </Dialog>

        {
          //if we have no existing bundle, then display a modal dialog prompting the user to create one
          haveExistingBundle ? undefined : (
            <Dialog
              open={!haveExistingBundle}
              onClose={() => history.goBack()}
              aria-labelled-by="create-bundle-title"
            >
              <CreateBundleDialogContent
                projectid={projectid}
                didComplete={newBundleCreated}
              />
            </Dialog>
          )
        }
      </BeforeUnloadComponent>
    </>
  );
};

export default ProjectDeliverablesComponent;
