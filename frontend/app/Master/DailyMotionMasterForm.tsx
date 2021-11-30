import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  TextField,
  Tooltip,
} from "@material-ui/core";
import DailyMotionChannelSelector from "./DailymotionChannelSelector";
import { formStyles } from "./MetadataStyles";
import { MasterFormProps } from "./MasterForm";
import clsx from "clsx";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import ChipInput from "../Form/ChipInput";
import { Cancel, SaveAlt } from "@material-ui/icons";

const DailyMotionMasterForm: React.FC<MasterFormProps<
  DailymotionMaster,
  YoutubeMaster
>> = (props) => {
  const { isEditing } = props;

  const classes = formStyles();

  const [isDirty, setIsDirty] = useState(false);

  const [title, setTitle] = useState("");
  useEffect(() => {
    setTitle(props.master.daily_motion_title);
  }, [props.master]);

  const [description, setDescription] = useState("");
  useEffect(() => {
    setDescription(props.master.daily_motion_description);
  }, [props.master]);

  const [tags, setTags] = useState<string[]>([]);
  useEffect(() => {
    setTags(props.master.daily_motion_tags);
  }, [props.master]);

  const [adult, setAdult] = useState(false);
  useEffect(() => {
    if (props.master) {
      setAdult(props.master.daily_motion_contains_adult_content);
    } else {
      setAdult(false);
    }
  }, [props.master]);

  const [noMobile, setNoMobile] = useState(false);
  useEffect(() => {
    if (props.master) {
      setNoMobile(props.master.daily_motion_no_mobile_access);
    } else {
      setNoMobile(false);
    }
  }, [props.master]);

  const [category, setCategory] = useState("");
  useEffect(() => {
    if (props.master) {
      setCategory(props.master.daily_motion_category);
    } else {
      setCategory("");
    }
  }, [props.master]);

  const doSave = () => {
    const update: DailymotionMaster = {
      daily_motion_category: category,
      daily_motion_contains_adult_content: adult,
      daily_motion_description: description,
      daily_motion_no_mobile_access: noMobile,
      daily_motion_tags: tags,
      daily_motion_title: title,
      daily_motion_url: props.master.daily_motion_url,
      publication_date: props.master.publication_date,
      upload_status: props.master.upload_status,
      etag: props.master.etag,
    };
    props.saveRequested(update);
  };

  return (
    <ul className={classes.listContainer}>
      <li className={clsx(classes.listItem, classes.root)}>
        <TextField
          label="Upload Status"
          value={props.master.upload_status}
          disabled
        />
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <TextField
          label="Publication Date"
          value={props.master.publication_date}
          disabled
        />
      </li>
      <li className={clsx(classes.listItem, classes.root)}>
        <TextField
          label="Dailymotion URL"
          value={props.master.daily_motion_url}
          disabled
        />
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <Grid container justifyContent="space-between">
          <Grid item className={classes.expandable}>
            <TextField
              label="Daily Motion title"
              value={title}
              onChange={(evt) => setTitle(evt.target.value)}
              disabled={!isEditing}
              required={isEditing}
              error={!title || title == ""}
              helperText={
                title && title != "" ? undefined : "You must specify a title"
              }
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
              label="Daily Motion description"
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
        <DailyMotionChannelSelector
          id="dm-channel-selector"
          label="Channel"
          onChanged={(newValue) => setCategory(newValue)}
          value={category}
          classes={classes}
          disabled={!isEditing}
        />
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <FormControlLabel
          control={
            <Checkbox
              checked={noMobile}
              onChange={(event) => setNoMobile(event.target.checked)}
              name="no-mobile-access"
              color="primary"
              disabled={!isEditing}
            />
          }
          label="No mobile access"
        />
      </li>

      <li className={clsx(classes.listItem, classes.root)}>
        <FormControlLabel
          control={
            <Checkbox
              checked={adult}
              onChange={(event) => setAdult(event.target.checked)}
              name="contains-adult-content"
              color="primary"
              disabled={!isEditing}
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
                  setTitle(props.master.daily_motion_title);
                  setDescription(props.master.daily_motion_description);
                  setTags(props.master.daily_motion_tags);
                  setCategory(props.master.daily_motion_category);
                  setAdult(props.master.daily_motion_contains_adult_content);
                  setNoMobile(props.master.daily_motion_no_mobile_access);
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

export default DailyMotionMasterForm;
