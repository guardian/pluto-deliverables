import React, { useEffect, useState } from "react";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Tooltip,
  DialogTitle,
  Typography,
  TableCell,
  TableContainer,
  Table,
  TableRow,
  TableBody,
  DialogContentText,
  DialogActions,
  Button,
  Link,
} from "@material-ui/core";
import {
  AccessAlarmOutlined,
  BackupOutlined,
  CheckCircleOutline,
  Error,
} from "@material-ui/icons";
import axios from "axios";
import { SystemNotification, SystemNotifcationKind } from "pluto-headers";
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core/styles";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import CloseIcon from "@material-ui/icons/Close";
import moment from "moment";
import {
  getDeliverableDailymotion,
  getDeliverableMainstream,
} from "../utils/master-api-service";

interface SyndicationTriggerProps {
  uploadStatus: string | null;
  platform: string;
  projectId: number;
  assetId: bigint;
  sendInitiated: () => void;
  title: string | null;
  link: string | null;
}

interface SyndicationButtonProps {
  disabled: boolean;
  onClicked: () => void;
  link: string | null;
  platformName?: string;
}

interface SyndicationIconProps {
  uploadStatus: string | null;
  title: string | null;
  platform: string;
  projectId: number;
  assetId: bigint;
}

interface SyndicationDialogProps {
  openDialog: boolean;
  dialogHandler: () => void;
  title: string | null;
  platform: string;
  uploadStatus: string | null;
  projectId: number;
  assetId: bigint;
}

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

interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

interface ProgressIconProps {
  uploadStatus: string | null;
}

interface LogObject {
  timestamp: string;
  related_gnm_website: number | null;
  related_youtube: number | null;
  related_daily_motion: number | null;
  related_mainstream: number | null;
  sender: string;
  log_line: string;
}

//constants representing the incoming uploadStatus values, from choices.py
const NOT_UPLOADING = "Not ready";
const WAITING_FOR_START = "Ready for Upload";
const IN_PROGRESS = "Uploading";
const FAILED = "Upload Failed";
const COMPLETE = "Upload Complete";

const SyndicationTriggerButton: React.FC<SyndicationButtonProps> = (props) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const closeDialog = () => {
    setOpenDialog(false);
  };

  const platformName = props.platformName ?? "syndication";

  return (
    <>
      <Tooltip
        title={
          props.disabled
            ? `You must add ${platformName} details before starting to upload`
            : "Send to syndication partner"
        }
      >
        {props.disabled ? (
          <IconButton
            id="syndication-trigger"
            onClick={(event) => {
              event.stopPropagation();
              setOpenDialog(true);
            }}
          >
            <BackupOutlined />
          </IconButton>
        ) : (
          <IconButton onClick={props.onClicked} id="syndication-trigger">
            <BackupOutlined />
          </IconButton>
        )}
      </Tooltip>
      <Dialog
        open={openDialog}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This file has already been uploaded
            {props.link ? (
              <>
                {" "}
                to{" "}
                <Link href={props.link} target="_blank">
                  {props.link}
                </Link>
              </>
            ) : null}
            . Sending it again will cause it to be duplicated. Are you really
            sure that you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              props.onClicked();
              closeDialog();
            }}
          >
            Continue
          </Button>
          <Button onClick={closeDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ProgressIcon: React.FC<ProgressIconProps> = (props) => {
  switch (props.uploadStatus) {
    case null:
      return null;
    case NOT_UPLOADING:
      return null;
    case WAITING_FOR_START:
      return (
        <Tooltip title="Waiting for start...">
          <AccessAlarmOutlined />
        </Tooltip>
      );
    case IN_PROGRESS:
      return (
        <Tooltip title="Output is ongoing...">
          <CircularProgress style={{ width: "20px", height: "20px" }} />
        </Tooltip>
      );
    case FAILED:
      return (
        <Tooltip title="Output failed">
          <Error style={{ color: "red" }} />
        </Tooltip>
      );
    case COMPLETE:
      return (
        <Tooltip title="Output success">
          <CheckCircleOutline style={{ color: "green", height: "19px" }} />
        </Tooltip>
      );
    default:
      console.log("Warning, got unknown upload_status ", props.uploadStatus);
      return null;
  }
};

const SyndicationDialog: React.FC<SyndicationDialogProps> = (props) => {
  const [openDialog, setOpenDialog] = useState<boolean>(props.openDialog);
  const [logMessages, setLogMessages] = useState<LogObject[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(
    props.uploadStatus
  );

  const getLogData = async (): Promise<LogObject[]> => {
    try {
      const { status, data } = await axios.get(
        `/api/bundle/${props.projectId}/asset/${props.assetId}/${props.platform}/logs?full`
      );

      if (status === 200) {
        return data.logs;
      }
      throw "Could not load log messages.";
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const doRefresh = async () => {
    try {
      const logData = await getLogData();
      setLogMessages(logData);
    } catch (error) {
      console.error(error);
    }
  };

  const getUploadStatus = async () => {
    try {
      if (props.platform == "dailymotion") {
        const master: DailymotionMaster = await getDeliverableDailymotion(
          props.projectId.toString(),
          props.assetId.toString()
        );
        return master.upload_status;
      } else if (props.platform == "mainstream") {
        const master: MainstreamMaster = await getDeliverableMainstream(
          props.projectId.toString(),
          props.assetId.toString()
        );
        return master.upload_status;
      }
    } catch (error) {
      console.error(error);
    }
    return "Unknown";
  };

  const doRefreshUploadStatus = async () => {
    try {
      const uploadStatus = await getUploadStatus();
      setUploadStatus(uploadStatus);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setOpenDialog(props.openDialog);
  }, [props.openDialog]);

  useEffect(() => {
    doRefresh();
    setInterval(doRefresh, 10000);
    setInterval(doRefreshUploadStatus, 10000);
  }, []);

  const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
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

  return (
    <Dialog
      open={openDialog}
      onClose={props.dialogHandler}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="customized-dialog-title" onClose={props.dialogHandler}>
        {props.title} /{" "}
        {`${props.platform.charAt(0).toUpperCase()}${props.platform.slice(1)}`}
        <div style={{ float: "right", marginRight: "60px", marginTop: "4px" }}>
          <ProgressIcon uploadStatus={uploadStatus} />
        </div>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableBody>
              {logMessages
                ? logMessages.map((item, index) => (
                    <TableRow>
                      <TableCell>
                        {moment(item.timestamp).format("D/M/YYYY H:mm")}
                      </TableCell>
                      <TableCell>{item.log_line}</TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

const SyndicationTriggerIcon: React.FC<SyndicationIconProps> = (props) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const dialogHandler = () => {
    setOpenDialog(false);
  };
  switch (props.uploadStatus) {
    case null:
      return null;
    case NOT_UPLOADING:
      return null;
    case WAITING_FOR_START:
      return (
        <>
          <Tooltip title="Waiting for start... - Click to show full log">
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                setOpenDialog(true);
              }}
            >
              <AccessAlarmOutlined />
            </IconButton>
          </Tooltip>
          <SyndicationDialog
            openDialog={openDialog}
            dialogHandler={dialogHandler}
            title={props.title}
            platform={props.platform}
            uploadStatus={props.uploadStatus}
            projectId={props.projectId}
            assetId={props.assetId}
          />
        </>
      );
    case IN_PROGRESS:
      return (
        <>
          <Tooltip title="Output is ongoing... - Click to show full log">
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                setOpenDialog(true);
              }}
            >
              <CircularProgress style={{ width: "20px", height: "20px" }} />
            </IconButton>
          </Tooltip>
          <SyndicationDialog
            openDialog={openDialog}
            dialogHandler={dialogHandler}
            title={props.title}
            platform={props.platform}
            uploadStatus={props.uploadStatus}
            projectId={props.projectId}
            assetId={props.assetId}
          />
        </>
      );
    case FAILED:
      return (
        <>
          <Tooltip title="Output failed - Click to show full log">
            <IconButton
              id="output-failed-logs"
              onClick={(event) => {
                event.stopPropagation();
                setOpenDialog(true);
              }}
            >
              <Error style={{ color: "red" }} />
            </IconButton>
          </Tooltip>
          <SyndicationDialog
            openDialog={openDialog}
            dialogHandler={dialogHandler}
            title={props.title}
            platform={props.platform}
            uploadStatus={props.uploadStatus}
            projectId={props.projectId}
            assetId={props.assetId}
          />
        </>
      );
    case COMPLETE:
      return (
        <>
          <Tooltip title="Output success - Click to show full log">
            <IconButton
              id="output-complete-logs"
              onClick={(event) => {
                event.stopPropagation();
                setOpenDialog(true);
              }}
            >
              <CheckCircleOutline style={{ color: "green", height: "19px" }} />
            </IconButton>
          </Tooltip>
          <SyndicationDialog
            openDialog={openDialog}
            dialogHandler={dialogHandler}
            title={props.title}
            platform={props.platform}
            uploadStatus={props.uploadStatus}
            projectId={props.projectId}
            assetId={props.assetId}
          />
        </>
      );
    default:
      console.log("warning, got unknown upload_status ", props.uploadStatus);
      return null;
  }
};

const SyndicationTrigger: React.FC<SyndicationTriggerProps> = (props) => {
  const triggerUpload = async () => {
    try {
      let bundleNumber: number = props.projectId;
      if (props.projectId == -1) {
        bundleNumber = 0;
      }
      await axios.post(
        `/api/bundle/${bundleNumber}/asset/${props.assetId}/${props.platform}/send`
      );
      console.log("send initiated");
      props.sendInitiated();
      SystemNotification.open(
        SystemNotifcationKind.Success,
        `Started ${props.platform} syndication`
      );
    } catch (err) {
      console.error("Could not start syndication: ", err);
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Could not start ${props.platform} syndication, see browser console for details`
      );
    }
  };

  return (
    <>
      {props.uploadStatus == IN_PROGRESS ||
      props.uploadStatus == WAITING_FOR_START ? null : (
        <SyndicationTriggerButton
          disabled={
            props.uploadStatus == COMPLETE ||
            (props.title == null && props.uploadStatus == null)
          }
          onClicked={triggerUpload}
          link={props.link}
          platformName={props.platform}
        />
      )}
      <SyndicationTriggerIcon
        uploadStatus={props.uploadStatus}
        title={props.title}
        platform={props.platform}
        projectId={props.projectId}
        assetId={props.assetId}
      />
    </>
  );
};

export default SyndicationTrigger;
