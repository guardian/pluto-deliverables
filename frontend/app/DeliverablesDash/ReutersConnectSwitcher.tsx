import React from "react";
import {
  createOovvuuDeliverable,
  createReutersConnectDeliverable,
  updateOovvuuDeliverable,
  updateReutersConnectDeliverable,
} from "../utils/master-api-service";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import GenericSwitcher from "./GenericSwitcher";

interface ReutersConnectSwitcherProps {
  projectId: string;
  assetId: string;
  content?: ReutersConnectMaster;
  didUpdate: (newContent: ReutersConnectMaster) => void;
}

const ReutersConnectSwitcher: React.FC<ReutersConnectSwitcherProps> = (
  props
) => {
  const saveUpdate = async (newState: boolean) => {
    try {
      const update: ReutersConnectMaster = {
        seen_on_channel: newState,
        etag: props.content?.etag ?? "",
      };
      const newRecord = props.content
        ? await updateReutersConnectDeliverable(
            props.projectId,
            props.assetId,
            update
          )
        : await createReutersConnectDeliverable(
            props.projectId,
            props.assetId,
            update
          );

      try {
        await axios.post(
          `/api/asset/${props.assetId}/notes/new`,
          newState ? "Seen on Reuters Connect" : "Removed from Reuters Connect",
          { headers: { "Content-Type": "text/plain" } }
        );
        SystemNotification.open(
          SystemNotifcationKind.Info,
          "Recorded Reuters Connect publication"
        );
      } catch (err) {
        console.error("Failure while making note for Reuters Connect: ", err);
        SystemNotification.open(
          SystemNotifcationKind.Error,
          `Could not make note: ${err}`
        );
      }

      props.didUpdate(newRecord);
    } catch (err) {
      console.error("Could not save Reuters Connect: ", err);
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
      channelName="Reuters Connect"
      removePublishedStatus={removePublishedStatus}
      addPublishedStatus={addPublishedStatus}
    />
  );
};

export default ReutersConnectSwitcher;
