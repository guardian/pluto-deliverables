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
import { Add, DeleteOutline, Edit } from "@material-ui/icons";
import dailymotionEnabled from "../static/dailymotion_enabled.jpg";
import dailymotionDisabled from "../static/dailymotion_disabled.jpg";
import { useStyles } from "./DeliverableItemStyles";
import { EmbeddableFormProps } from "./EmbeddableForm";
import {
  createDailymotionDeliverable,
  deleteDailymotionDeliverable,
  updateDailymotionDeliverable,
} from "../utils/master-api-service";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import DeleteIcon from "@material-ui/icons/Delete";
import DailyMotionMasterForm from "../Master/DailyMotionMasterForm";

const EmbeddableDMForm: React.FC<EmbeddableFormProps<
  DailymotionMaster,
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

  const emptyRecord: DailymotionMaster = {
    daily_motion_category: "",
    daily_motion_contains_adult_content: false,
    daily_motion_description: "",
    daily_motion_no_mobile_access: false,
    daily_motion_tags: [],
    daily_motion_title: "",
    daily_motion_url: "",
    publication_date: "",
    upload_status: "",
  };

  const saveRequested = async (update: DailymotionMaster) => {
    try {
      const newMaster = didJustCreate
        ? await createDailymotionDeliverable(
            props.bundleId.toString(),
            props.deliverableId.toString(),
            update
          )
        : await updateDailymotionDeliverable(
            props.bundleId.toString(),
            props.deliverableId.toString(),
            update
          );

      setIsEditing(false);
      setFormDirty(false);

      if (props.didUpdate) props.didUpdate(newMaster);
    } catch (err) {
      console.error("Could not save update to dailymotion metadata: ", err);

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
                src={props.content ? dailymotionEnabled : dailymotionDisabled}
              />
              Daily Motion
            </Typography>
          </Grid>
          <Grid item>
            {showingForm ? (
              <Tooltip title="Permanently remove the daily motion metadata from this deliverable">
                <IconButton
                  onClick={() => setRequestDeleteActive(true)}
                  disabled={isEditing}
                >
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
            ) : undefined}
            <Tooltip title="Change the daily motion metadata displayed here">
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
          <DailyMotionMasterForm
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
            No Daily Motion data available for this item
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
            Remove Daily Motion metadata
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to remove the Daily Motion metadata from
              this deliverable? There is no undo.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setRequestDeleteActive(false);
                deleteDailymotionDeliverable(
                  props.bundleId.toString(),
                  props.deliverableId.toString()
                )
                  .then(() => {
                    SystemNotification.open(
                      SystemNotifcationKind.Info,
                      "Removed Daily Motion metadata"
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

export default EmbeddableDMForm;
