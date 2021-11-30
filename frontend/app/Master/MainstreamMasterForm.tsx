import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Tooltip,
} from "@material-ui/core";
import { MasterFormProps } from "./MasterForm";
import { formStyles } from "./MetadataStyles";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import ChipInput from "../Form/ChipInput";
import clsx from "clsx";
import { Cancel, SaveAlt } from "@material-ui/icons";

const MainstreamMasterForm: React.FC<MasterFormProps<
  MainstreamMaster,
  YoutubeMaster
>> = (props) => {
  const { isEditing, master, isReadOnly, saveRequested } = props;

  const classes = formStyles();

  const [isDirty, setIsDirty] = useState(false);

  const [title, setTitle] = useState("");
  useEffect(() => {
    setTitle(master.mainstream_title);
  }, [master]);

  const [description, setDescription] = useState("");
  useEffect(() => {
    setDescription(master.mainstream_description);
  }, [master]);

  const [tags, setTags] = useState<string[]>([]);
  useEffect(() => {
    setTags(master.mainstream_tags);
  }, [master]);

  const [adult, setAdult] = useState(false);
  useEffect(() => {
    setAdult(master.mainstream_rules_contains_adult_content);
  }, [master]);

  const doSave = () => {
    const update: MainstreamMaster = {
      mainstream_description: description,
      mainstream_rules_contains_adult_content: adult,
      mainstream_tags: tags,
      mainstream_title: title,
      publication_date: master.publication_date,
      upload_status: master.upload_status,
      etag: master.etag,
    };
    saveRequested(update);
  };

  return (
    <ul className={classes.listContainer}>
      <li className={clsx(classes.listItem, classes.root)}>
        <TextField
          label="Upload Status"
          value={master.upload_status || ""}
          disabled
          className={classes.root}
        />
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <Grid container justifyContent="space-between">
          <Grid item className={classes.expandable}>
            <TextField
              label="Mainstream title"
              value={title}
              onChange={(evt) => setTitle(evt.target.value)}
              disabled={!isEditing}
              error={isDirty && (!title || title == "")}
              helperText="You must specify a title"
              className={classes.root}
            />
          </Grid>
          {props.copySource && isEditing ? (
            <Grid item>
              <Tooltip title="Copy from youtube master">
                <IconButton
                  onClick={() =>
                    setTitle(props.copySource?.youtube_title ?? "")
                  }
                >
                  <FileCopyIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          ) : undefined}
        </Grid>
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <Grid container justifyContent="space-between">
          <Grid item className={classes.expandable}>
            <TextField
              label="Mainstream description"
              multiline
              rows={4}
              value={description}
              className={classes.root}
              onChange={(evt) => setDescription(evt.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          {props.copySource && isEditing ? (
            <Grid item>
              <Tooltip title="Copy from youtube master">
                <IconButton
                  onClick={() =>
                    setDescription(props.copySource?.youtube_description ?? "")
                  }
                >
                  <FileCopyIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          ) : undefined}
        </Grid>
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <Grid container justifyContent="space-between">
          <Grid item className={classes.expandable}>
            <ChipInput
              label={"Tags"}
              value={tags}
              onChange={(newValue) => setTags(newValue)}
              disabled={!isEditing}
            />
          </Grid>
          {props.copySource && isEditing ? (
            <Grid item>
              <Tooltip title="Copy from youtube master">
                <IconButton
                  onClick={() => setTags(props.copySource?.youtube_tags ?? [])}
                >
                  <FileCopyIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          ) : undefined}
        </Grid>
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <FormControlLabel
          control={
            <Checkbox
              checked={adult}
              onChange={(event) => setAdult(event.target.checked)}
              disabled={!isEditing}
              name="contains-adult-content"
              color="primary"
            />
          }
          label="Contains adult content"
        />
      </li>
      {isEditing ? (
        <li className={classes.listItem}>
          <Grid container justifyContent="space-between">
            <Grid item>
              <Button
                startIcon={<Cancel />}
                onClick={() => {
                  setIsDirty(false);
                  setTitle(master.mainstream_title);
                  setDescription(master.mainstream_description);
                  setTags(master.mainstream_tags);
                  setAdult(master.mainstream_rules_contains_adult_content);
                  if (props.editCancelled) props.editCancelled();
                }}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <Button
                startIcon={<SaveAlt />}
                onClick={doSave}
                variant="contained"
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </li>
      ) : undefined}
    </ul>
  );
};

export default MainstreamMasterForm;
