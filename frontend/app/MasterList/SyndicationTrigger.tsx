import React from "react";
import { CircularProgress, Grid, IconButton, Tooltip } from "@material-ui/core";
import {
  AccessAlarmOutlined,
  BackupOutlined,
  CheckCircleOutline,
  Error,
} from "@material-ui/icons";
import axios from "axios";
import SystemNotification, {
  SystemNotificationKind,
} from "../SystemNotification";

interface SyndicationTriggerProps {
  uploadStatus: string | null;
  platform: string;
  projectId: number;
  assetId: bigint;
  sendInitiated: () => void;
}

interface SyndicationButtonProps {
  disabled: boolean;
  onClicked: () => void;
}

interface SyndicationIconProps {
  uploadStatus: string | null;
}

//constants representing the incoming uploadStatus values, from choices.py
const NOT_UPLOADING = "Not ready";
const WAITING_FOR_START = "Ready for Upload";
const IN_PROGRESS = "Uploading";
const FAILED = "Upload Failed";
const COMPLETE = "Upload Complete";

const SyndicationTriggerButton: React.FC<SyndicationButtonProps> = (props) => {
  return (
    <Tooltip title="Send to syndication partner">
      <IconButton disabled={props.disabled} onClick={props.onClicked}>
        <BackupOutlined />
      </IconButton>
    </Tooltip>
  );
};

const SyndicationTriggerIcon: React.FC<SyndicationIconProps> = (props) => {
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
          <CircularProgress />
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
          <CheckCircleOutline style={{ color: "green" }} />
        </Tooltip>
      );
    default:
      console.log("warning, got unknown upload_status ", props.uploadStatus);
      return null;
  }
};

const SyndicationTrigger: React.FC<SyndicationTriggerProps> = (props) => {
  const triggerUpload = async () => {
    try {
      await axios.post(
        `/api/bundle/${props.projectId}/asset/${props.assetId}/${props.platform}/send`
      );
      console.log("send initiated");
      props.sendInitiated();
      SystemNotification.open(
        SystemNotificationKind.Success,
        `Started ${props.platform} syndication`
      );
    } catch (err) {
      console.error("Could not start syndication: ", err);
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Could not start ${props.platform} syndication, see browser console for details`
      );
    }
  };

  return (
    <Grid container direction="row" alignItems="center">
      <Grid item>
        {props.uploadStatus == IN_PROGRESS ||
        props.uploadStatus == WAITING_FOR_START ? null : (
          <SyndicationTriggerButton
            disabled={props.uploadStatus == COMPLETE}
            onClicked={triggerUpload}
          />
        )}
      </Grid>
      <Grid item>
        <SyndicationTriggerIcon uploadStatus={props.uploadStatus} />
      </Grid>
    </Grid>
  );
};

export default SyndicationTrigger;
