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

interface OoovvuuSwitcherProps {
  projectId: string;
  assetId: string;
  content?: OovvuuMaster;
  didUpdate: (newContent: OovvuuMaster) => void;
}

const OoovvuuSwitcher: React.FC<OoovvuuSwitcherProps> = (props) => {
  const [showingDialog, setShowingDialog] = useState(false);

  const didChange = (evt: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setShowingDialog(true);
  };

  const saveUpdate = async (newState: boolean) => {
    try {
      const update: OovvuuMaster = {
        seen_on_channel: newState,
        etag: props.content?.etag ?? "",
      };
      const newRecord = props.content
        ? await updateOovvuuDeliverable(props.projectId, props.assetId, update)
        : await createOovvuuDeliverable(props.projectId, props.assetId, update);
      setShowingDialog(false);

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
    <>
      <Tooltip title="Indicate that this has been sent to Oovvuu.">
        <Switch
          onChange={didChange}
          checked={props.content?.seen_on_channel ?? false}
        />
      </Tooltip>
      {showingDialog ? (
        <Dialog open={showingDialog} onClose={() => setShowingDialog(false)}>
          <DialogTitle>Seen on Oovvuu</DialogTitle>
          <DialogContent>
            {props.content?.seen_on_channel ? (
              <>
                <DialogContentText>
                  We have already recorded this deliverable as being published
                  so this action will remove that status and note that it has
                  been taken down. Are you sure you want to continue?
                </DialogContentText>
                <DialogActions>
                  <Button
                    startIcon={<Cancel />}
                    variant="outlined"
                    onClick={() => setShowingDialog(false)}
                  >
                    No, go back
                  </Button>
                  <Button
                    startIcon={<DeleteOutlined />}
                    variant="contained"
                    color="secondary"
                    onClick={removePublishedStatus}
                  >
                    Yes, remove it
                  </Button>
                </DialogActions>
              </>
            ) : (
              <>
                <DialogContentText>
                  This will record this deliverable as being published to
                  Oovvuu. Are you sure that you want to continue?
                </DialogContentText>
                <DialogActions>
                  <Button
                    startIcon={<Cancel />}
                    variant="outlined"
                    onClick={() => setShowingDialog(false)}
                  >
                    No, go back
                  </Button>
                  <Button
                    startIcon={<DeleteOutlined />}
                    variant="contained"
                    color="secondary"
                    onClick={addPublishedStatus}
                  >
                    Yes, mark it
                  </Button>
                </DialogActions>
              </>
            )}
          </DialogContent>
        </Dialog>
      ) : undefined}
    </>
  );
};

export default OoovvuuSwitcher;
