import React, { useEffect, useState } from "react";
import { Grid, IconButton, Paper, Typography } from "@material-ui/core";
import clsx from "clsx";
import mainstreamEnabled from "../static/mainstream_enabled.png";
import mainstreamDisabled from "../static/mainstream_disabled.png";
import { Add, Edit } from "@material-ui/icons";
import MainstreamMasterForm from "../Master/MainstreamMasterForm";
import { useStyles } from "./DeliverableItemStyles";
import { EmbeddableFormProps } from "./EmbeddableForm";
import {
  createMainstreamDeliverable,
  updateMainstreamDeliverable,
} from "../utils/master-api-service";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";

const EmbeddableMSForm: React.FC<EmbeddableFormProps<MainstreamMaster>> = (
  props
) => {
  const classes = useStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const [showingForm, setShowingForm] = useState(false);
  const [didJustCreate, setDidJustCreate] = useState(false);

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
      SystemNotification.open(
        SystemNotifcationKind.Error,
        "Could not update mainstream information"
      );
    }
  };

  return (
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
          <IconButton
            onClick={() => {
              if (!props.content) {
                setDidJustCreate(true);
              }
              setShowingForm(true);
              setIsEditing(true);
            }}
          >
            {props.content ? <Edit /> : <Add />}
          </IconButton>
        </Grid>
      </Grid>
      {showingForm ? (
        <MainstreamMasterForm
          isEditing={isEditing}
          master={props.content ?? emptyRecord}
          isReadOnly={false}
          isDirty={formDirty}
          saveRequested={saveRequested}
        />
      ) : (
        <Typography variant="caption">
          No Mainstream data available for this item
        </Typography>
      )}
    </Paper>
  );
};

export default EmbeddableMSForm;
