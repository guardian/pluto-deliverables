import React, { useEffect, useState } from "react";
import {Grid, IconButton, Link, Paper, Tooltip, Typography} from "@material-ui/core";
import clsx from "clsx";
import youtubeEnabled from "../static/youtube_enabled.png";
import youtubeDisabled from "../static/youtube_disabled.png";
import { Add, Edit } from "@material-ui/icons";
import { useStyles } from "./DeliverableItemStyles";
import YoutubeMaster from "../Master/YoutubeMaster";
import YoutubeMasterForm from "../Master/YoutubeMasterForm";
import {
  createYoutubeDeliverable,
  updateYoutubeDeliverable,
} from "../utils/master-api-service";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";

interface EmbeddableYTFormProps {
  youtubeMaster?: YoutubeMaster;
  deliverableId: string;
  bundleId: string;
  didUpdate: (newValue: YoutubeMaster) => void;
}

const EmbeddableYTForm: React.FC<EmbeddableYTFormProps> = (props) => {
  const classes = useStyles();
  const [editingYT, setEditingYT] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const [showingForm, setShowingForm] = useState(false);
  const [didJustCreate, setDidJustCreate] = useState(false);

  useEffect(() => {
    if (props.youtubeMaster) {
      setShowingForm(true);
    } else {
      setShowingForm(false);
    }
    setDidJustCreate(false);
  }, [props.youtubeMaster]);

  const emptyRecord: YoutubeMaster = {
    etag: "",
    publication_date: "",
    youtube_category: "",
    youtube_channel: "",
    youtube_description: "",
    youtube_id: "",
    youtube_tags: [],
    youtube_title: "",
  };

  const saveEdit = async (updated: YoutubeMaster) => {
    try {
      const newMaster = didJustCreate
        ? await createYoutubeDeliverable(
            props.bundleId,
            props.deliverableId,
            updated as CreateYoutubeMaster
          )
        : await updateYoutubeDeliverable(
            props.bundleId,
            props.deliverableId,
            updated
          );
      props.didUpdate(newMaster);
      setFormDirty(false);
      setEditingYT(false);
    } catch (err) {
      console.error("Could not save master: ", err);
      SystemNotification.open(
        SystemNotifcationKind.Error,
        "Unable to save this edit"
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
              src={props.youtubeMaster ? youtubeEnabled : youtubeDisabled}
            />
            Youtube
          </Typography>
        </Grid>
        <Grid item>
          <Tooltip title="You can't send to youtube from here">
            <span>
          <IconButton
            disabled={true}
            onClick={() => {
              if (!props.youtubeMaster) {
                setDidJustCreate(true);
              }
              setEditingYT(true);
              setShowingForm(true); //should be true anyway if we have data but no harm setting it again here
            }}
          >
            {props.youtubeMaster ? <Edit /> : <Add />}
          </IconButton>
              </span>
          </Tooltip>
        </Grid>
      </Grid>
      {showingForm ? (
        <YoutubeMasterForm
          master={props.youtubeMaster ?? emptyRecord}
          isReadOnly={false}
          isEditing={editingYT}
          isDirty={formDirty}
          saveRequested={saveEdit}
          editCancelled={() => {
            if (didJustCreate) {
              setShowingForm(false);
              setDidJustCreate(false);
              setEditingYT(false);
            } else {
              setEditingYT(false);
              setFormDirty(false);
            }
          }}
        />
      ) : (
          <Grid container direction="column">
            <Grid item>
        <Typography variant="caption">
          No YouTube data available for this item. This means that it has not been published to Youtube, which must be
          done through the media atom tool at <Link href="https://video.gutools.co.uk">https://video.gutools.co.uk</Link>
        </Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">
                Please email multimediatech at theguardian.com for more information
              </Typography>
            </Grid>
          </Grid>
      )}
    </Paper>
  );
};

export default EmbeddableYTForm;
