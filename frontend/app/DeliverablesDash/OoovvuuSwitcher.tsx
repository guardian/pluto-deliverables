import React, { ChangeEvent, useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  Tooltip,
} from "@material-ui/core";
import { Cancel, DeleteOutlined } from "@material-ui/icons";
import {
  createOovvuuDeliverable,
  updateOovvuuDeliverable,
} from "../utils/master-api-service";
import {
  SystemNotifcationKind,
  SystemNotification,
  UserContext,
} from "pluto-headers";
import { formatISO } from "date-fns";
import axios from "axios";
import GenericSwitcher from "./GenericSwitcher";

interface OoovvuuSwitcherProps {
  projectId: string;
  assetId: string;
  content?: OovvuuMaster;
  didUpdate: (newContent: OovvuuMaster) => void;
}

const OoovvuuSwitcher: React.FC<OoovvuuSwitcherProps> = (props) => {
  const saveUpdate = async (newState: boolean) => {
    try {
      const update: OovvuuMaster = {
        seen_on_channel: newState,
        etag: props.content?.etag ?? "",
      };
      const newRecord = props.content
        ? await updateOovvuuDeliverable(props.projectId, props.assetId, update)
        : await createOovvuuDeliverable(props.projectId, props.assetId, update);

      try {
        await axios.post(
          `/api/asset/${props.assetId}/notes/new`,
          newState ? "Seen on Oovvuu" : "Removed from Oovvuu",
          { headers: { "Content-Type": "text/plain" } }
        );
        SystemNotification.open(
          SystemNotifcationKind.Info,
          "Recorded Oovvuu publication"
        );
      } catch (err) {
        console.error("Failure while making note for oovvuu: ", err);
        SystemNotification.open(
          SystemNotifcationKind.Error,
          `Could not make note: ${err}`
        );
      }

      props.didUpdate(newRecord);
    } catch (err) {
      console.error("Could not save oovvuu: ", err);
      SystemNotification.open(SystemNotifcationKind.Error, err.toString());
    }
  };

  const addPublishedStatus = () => {
    saveUpdate(true);
  };

  const removePublishedStatus = () => {
    saveUpdate(false);
  };

  return (
    <GenericSwitcher
      seenOnChannel={props.content?.seen_on_channel}
      channelName="Oovvuu"
      removePublishedStatus={removePublishedStatus}
      addPublishedStatus={addPublishedStatus}
    />
  );
};

export default OoovvuuSwitcher;
