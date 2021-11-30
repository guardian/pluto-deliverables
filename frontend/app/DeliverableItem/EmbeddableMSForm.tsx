import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@material-ui/core";
import clsx from "clsx";
import mainstreamEnabled from "../static/mainstream_enabled.png";
import mainstreamDisabled from "../static/mainstream_disabled.png";
import { Add, DeleteOutline, Edit } from "@material-ui/icons";
import MainstreamMasterForm from "../Master/MainstreamMasterForm";
import { useStyles } from "./DeliverableItemStyles";
import { EmbeddableFormProps } from "./EmbeddableForm";
import {
  createMainstreamDeliverable,
  deleteMainstreamDeliverable,
  updateMainstreamDeliverable,
} from "../utils/master-api-service";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import DeleteIcon from "@material-ui/icons/Delete";

const EmbeddableMSForm: React.FC<EmbeddableFormProps<
  MainstreamMaster,
  YoutubeMaster
>> = (props) => {
  const classes = useStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const [showingForm, setShowingForm] = useState(false);
  const [didJustCreate, setDidJustCreate] = useState(false);

  const [requestDeleteActive, setRequestDeleteActive] = useState(false);

  useEffect(() => {
    if (props.content) {
      setShowingForm(true);
    } else {
      setShowingForm(false);
    }
    setDidJustCreate(false);
  }, [props.content]);

  const emptyRecord: MainstreamMaster = {
    mainstream_description: "",
    mainstream_rules_contains_adult_content: false,
    mainstream_tags: [],
    mainstream_title: "",
    publication_date: "",
    upload_status: "",
  };

  const saveRequested = async (update: MainstreamMaster) => {
    try {
      const newMaster = didJustCreate
        ? await createMainstreamDeliverable(
            props.bundleId,
            props.deliverableId,
            update
          )
        : await updateMainstreamDeliverable(
            props.bundleId,
            props.deliverableId,
            update
          );

      setIsEditing(false);
      setFormDirty(false);

      if (props.didUpdate) props.didUpdate(newMaster);
    } catch (err) {
      console.error("Could not save update to mainstream metadata: ", err);

      SystemNotification.open(SystemNotifcationKind.Error, err.toString());
    }
  };

  return (
    <>
      <Paper elevation={3} className={classes.basicMetadataBox}>
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">
              <img
                className={clsx(classes.inlineIcon, classes.sizedIcon)}
                src={props.content ? mainstreamEnabled : mainstreamDisabled}
              />
              Mainstream Media
            </Typography>
          </Grid>
          <Grid item>
            {showingForm ? (
              <Tooltip title="Permanently remove the mainstream metadata from this deliverable">
                <IconButton
                  onClick={() => setRequestDeleteActive(true)}
                  disabled={isEditing}
                >
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
            ) : undefined}
            <Tooltip title="Change the mainstream metadata displayed here">
              <IconButton
                onClick={() => {
                  if (!props.content) {
                    setDidJustCreate(true);
                  }
                  setShowingForm(true);
                  setIsEditing(true);
                }}
                disabled={isEditing}
              >
                {props.content ? <Edit /> : <Add />}
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        {showingForm ? (
          <MainstreamMasterForm
            isEditing={isEditing}
            master={props.content ?? emptyRecord}
            isReadOnly={false}
            isDirty={formDirty}
            saveRequested={saveRequested}
            copySource={props.copySource}
            editCancelled={() => {
              if (didJustCreate) {
                setDidJustCreate(false);
                setShowingForm(false);
              }
              setIsEditing(false);
            }}
          />
        ) : (
          <Typography variant="caption">
            No Mainstream data available for this item
          </Typography>
        )}
      </Paper>
      {requestDeleteActive ? (
        <Dialog
          open={requestDeleteActive}
          onClose={() => setRequestDeleteActive(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Remove mainstream metadata
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to remove the mainstream metadata from this
              deliverable? There is no undo.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setRequestDeleteActive(false);
                deleteMainstreamDeliverable(props.bundleId, props.deliverableId)
                  .then(() => {
                    SystemNotification.open(
                      SystemNotifcationKind.Info,
                      "Removed mainstream metadata"
                    );
                    props.didUpdate(undefined);
                  })
                  .catch((err) => {
                    console.error(
                      "Could not delete dailymotion metadata: ",
                      err
                    );
                    SystemNotification.open(
                      SystemNotifcationKind.Error,
                      err.toString()
                    );
                  });
              }}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              onClick={() => setRequestDeleteActive(false)}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      ) : undefined}
    </>
  );
};

export default EmbeddableMSForm;
