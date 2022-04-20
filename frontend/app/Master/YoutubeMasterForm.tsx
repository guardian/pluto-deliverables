import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { Cancel, Launch, SaveAlt } from "@material-ui/icons";
import ChipInput from "../Form/ChipInput";
import { MasterFormProps } from "./MasterForm";
import { formStyles } from "./MetadataStyles";
import axios from "axios";

const YoutubeMasterForm: React.FC<MasterFormProps<YoutubeMaster, void>> = (
  props
) => {
  const { isEditing, master, isReadOnly, isDirty, saveRequested } = props;

  const classes = formStyles();

  const [currentTags, setCurrentTags] = useState<string[]>([]);
  useEffect(() => {
    setCurrentTags(master.youtube_tags);
  }, [master]);

  const [ytID, setYtID] = useState<string>("");
  useEffect(() => {
    setYtID(master.youtube_id);
  }, [master]);

  const [title, setTitle] = useState("");
  useEffect(() => {
    setTitle(master.youtube_title);
  }, [master]);

  const [description, setDescription] = useState("");
  useEffect(() => {
    setDescription(master.youtube_description);
  }, [master]);

  const cancelEdit = () => {
    setCurrentTags(master.youtube_tags);
    setYtID(master.youtube_id);
    if (props.editCancelled) props.editCancelled();
  };

  const saveEdit = () => {
    const update: YoutubeMaster = {
      publication_date: master.publication_date,
      youtube_description: description,
      youtube_id: ytID,
      youtube_tags: currentTags,
      youtube_title: title,
    };
    saveRequested(update);
  };

  const [youTubeCategory, setYouTubeCategory] = useState("");
  const [youTubeChannel, setYouTubeChannel] = useState("");

  const getYouTubeCategory = async (
    categoryId: string | undefined
  ): Promise<string> => {
    try {
      const { status, data } = await axios.get(
        `/deliverables/api/youtube/category/${categoryId}`
      );

      if (status === 200) {
        setYouTubeCategory(data.title);
        return data.title;
      } else {
        if (categoryId) {
          setYouTubeCategory(categoryId);
        }
        throw new Error(`Could not find category title.`);
      }
    } catch (error) {
      if (categoryId) {
        setYouTubeCategory(categoryId);
      }
      console.error(error);
      return Promise.reject(`Could not find category title.`);
    }
  };

  const getYouTubeChannel = async (
    channelId: string | undefined
  ): Promise<string> => {
    try {
      const { status, data } = await axios.get(
        `/deliverables/api/youtube/channel/${channelId}`
      );

      if (status === 200) {
        setYouTubeChannel(data.title);
        return data.title;
      } else {
        if (channelId) {
          setYouTubeChannel(channelId);
        }
        throw new Error(`Could not find channel title.`);
      }
    } catch (error) {
      if (channelId) {
        setYouTubeCategory(channelId);
      }
      console.error(error);
      return Promise.reject(`Could not find channel title.`);
    }
  };

  useEffect(() => {
    if (master.youtube_category) {
      getYouTubeCategory(master.youtube_category);
    }
    if (master.youtube_channel) {
      getYouTubeChannel(master.youtube_channel);
    }
  }, [master]);

  return (
    <ul className={classes.listContainer}>
      <li className={classes.listItem}>
        <TextField
          id="yt-publication-date"
          label="Publication Date"
          value={master.publication_date || ""}
          disabled
        />
      </li>
      <li className={classes.listItem}>
        <div className="metadata-info">
          <Typography variant="subtitle1">Youtube category</Typography>
          <p className="subtitle-small" id="yt-category">
            {youTubeCategory}
          </p>
        </div>
      </li>
      <li className={classes.listItem}>
        <div className="metadata-info">
          <Typography variant="subtitle1">Youtube channel</Typography>
          <p className="subtitle-small" id="yt-channel">
            {youTubeChannel}
          </p>
        </div>
      </li>

      <li className={classes.listItem}>
        <Grid direction="row" container>
          <Grid item className={classes.expandable}>
            <TextField
              label="Youtube ID"
              id="yt-id"
              value={ytID}
              onChange={(evt) => setYtID(evt.target.value)}
              error={!isReadOnly && isDirty && !master.youtube_id}
              helperText={
                !isReadOnly && isDirty && !master.youtube_id
                  ? "Youtube ID is required"
                  : ""
              }
              className={classes.root}
              required={!isEditing}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item style={{ flex: "0 0 48px" }}>
            <Tooltip title={`https://youtube.com/watch?v=${master.youtube_id}`}>
              <IconButton
                onClick={() => {
                  window.open(
                    `https://youtube.com/watch?v=${master.youtube_id}`,
                    "_blank"
                  );
                }}
              >
                <Launch />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </li>

      <li className={classes.listItem}>
        <TextField
          label="Youtube title"
          value={title}
          id="yt-title"
          error={isDirty && !title}
          onChange={(evt) => setTitle(evt.target.value)}
          helperText={isDirty ? `Youtube title is required` : ""}
          required={!props.isReadOnly}
          disabled={!isEditing}
          className={classes.root}
        />
      </li>

      <li className={classes.listItem}>
        <TextField
          label="Youtube description"
          multiline
          rows={4}
          id="yt-description"
          variant="outlined"
          value={description}
          className={classes.root}
          onChange={(evt) => setDescription(evt.target.value)}
          disabled={!isEditing}
        />
      </li>

      <li className={classes.listItem}>
        <ChipInput
          label={"Tags"}
          value={currentTags}
          onChange={(newValue) => setCurrentTags(newValue)}
          disabled={!isEditing}
        />
      </li>

      <li className={classes.listItem}>
        {isEditing ? (
          <Grid direction="row" justifyContent="space-between" container>
            <Grid item>
              <Button startIcon={<Cancel />} onClick={cancelEdit}>
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <Button
                startIcon={<SaveAlt />}
                onClick={saveEdit}
                variant="contained"
              >
                Save
              </Button>
            </Grid>
          </Grid>
        ) : undefined}
      </li>
    </ul>
  );
};

export default YoutubeMasterForm;
