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
import CommonMaster from "./CommonMaster";
import ChipInput from "../Form/ChipInput";
import { makeStyles } from "@material-ui/core/styles";

interface YoutubeMasterFormProps {
  isEditing: boolean;
  master: YoutubeMaster;
  isReadOnly: boolean;
  isDirty: boolean;
  // fieldChanged: (
  //   event: React.ChangeEvent<
  //     | HTMLTextAreaElement
  //     | HTMLInputElement
  //     | HTMLSelectElement
  //     | { name?: string; value: any }
  //   >,
  //   field: keyof YoutubeMaster
  // ) => void;
  // onCommonMasterChanged: (evt: any, field: string) => void;
  saveRequested: (updated: YoutubeMaster) => void;
  editCancelled?: () => void;
}

const useStyles = makeStyles((theme) => ({
    root: {
       width: "100%"
    },
  listContainer: {
    listStyle: "none",
    paddingLeft: 0,
      margin: 0,
  },
  listItem: {
    marginBottom: theme.spacing(1),
  },
}));

const YoutubeMasterForm: React.FC<YoutubeMasterFormProps> = (props) => {
  const { isEditing, master, isReadOnly, isDirty, saveRequested } = props;

  const classes = useStyles();

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

  return (
    <ul className={classes.listContainer}>
      <li className={classes.listItem}>
        <TextField
          label="Publication Date"
          value={master.publication_date || ""}
          disabled
        />
      </li>
      <li className={classes.listItem}>
        <div className="metadata-info">
          <Typography variant="subtitle1">Youtube category</Typography>
          <p className="subtitle-small">{master.youtube_category}</p>
        </div>
      </li>
      <li className={classes.listItem}>
        <div className="metadata-info">
          <Typography variant="subtitle1">Youtube channel</Typography>
          <p className="subtitle-small">{master.youtube_channel}</p>
        </div>
      </li>

      <li className={classes.listItem}>
        <Grid direction="row" container>
          <Grid item>
            <TextField
              label="Youtube ID"
              value={ytID}
              onChange={(evt) => setYtID(evt.target.value)}
              error={!isReadOnly && isDirty && !master.youtube_id}
              helperText={
                !isReadOnly && isDirty && !master.youtube_id
                  ? "Youtube ID is required"
                  : ""
              }
              required={!isReadOnly}
              disabled={isReadOnly}
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
          error={isDirty && !title}
          onChange={(evt) => setTitle(evt.target.value)}
          helperText={isDirty ? `Youtube title is required` : ""}
          required={!props.isReadOnly}
          disabled={isReadOnly}
        />
      </li>

      <li className={classes.listItem}>
        <TextField
          label="Youtube description"
          multiline
          rows={4}
          variant="outlined"
          value={description}
          onChange={(evt) => setDescription(evt.target.value)}
          disabled={isReadOnly}
        />
      </li>

      <li className={classes.listItem}>
        <ChipInput
          label={"Tags"}
          value={currentTags}
          onChange={(newValue) => setCurrentTags(newValue)}
          disabled={isReadOnly}
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
