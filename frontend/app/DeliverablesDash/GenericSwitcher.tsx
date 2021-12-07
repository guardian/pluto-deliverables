import React, { useState } from "react";
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

interface GenericSwitcherProps {
  seenOnChannel?: boolean;
  channelName: string;
  removePublishedStatus: () => void;
  addPublishedStatus: () => void;
}

const GenericSwitcher: React.FC<GenericSwitcherProps> = (props) => {
  const {
    channelName,
    seenOnChannel,
    removePublishedStatus,
    addPublishedStatus,
  } = props;

  const [showingDialog, setShowingDialog] = useState(false);

  return (
    <>
      <Tooltip title={`Indicate that this has been sent to ${channelName}`}>
        <Switch
          onChange={() => setShowingDialog(true)}
          checked={props.seenOnChannel ?? false}
        />
      </Tooltip>
      {showingDialog ? (
        <Dialog open={showingDialog} onClose={() => setShowingDialog(false)}>
          <DialogTitle>Seen on {channelName}</DialogTitle>
          <DialogContent>
            {seenOnChannel ? (
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
                    onClick={() => {
                      removePublishedStatus();
                      setShowingDialog(false);
                    }}
                  >
                    Yes, remove it
                  </Button>
                </DialogActions>
              </>
            ) : (
              <>
                <DialogContentText>
                  This will record this deliverable as being published to{" "}
                  {channelName}. Are you sure that you want to continue?
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
                    onClick={() => {
                      addPublishedStatus();
                      setShowingDialog(false);
                    }}
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

export default GenericSwitcher;
