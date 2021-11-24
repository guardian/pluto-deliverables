import React from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  InputLabel,
  TextField,
} from "@material-ui/core";
import CopyingMaster from "./CopyingMaster";
import DailyMotionChannelSelector from "./DailymotionChannelSelector";
import DeleteIcon from "@material-ui/icons/Delete";
import { metadataStyles } from "./MetadataStyles";

interface DailyMotionMasterFormProps {
  isEditing: boolean;
  master: DailymotionMaster;
  isReadOnly: boolean;
  isDirty: boolean;
  checkboxChanged: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof DailymotionMaster
  ) => void;
  channelSelectorChanged: (newChan: string) => void;
  onCopyButton: (property: string) => void;
  onCommonMasterChanged: (evt: any, field: string) => void;
}

const DailyMotionMasterForm: React.FC<DailyMotionMasterFormProps> = (props) => {
  const {
    isEditing,
    master,
    isReadOnly,
    isDirty,
    checkboxChanged,
    onCopyButton,
    onCommonMasterChanged,
  } = props;

  const classes = metadataStyles();

  return (
    <>
      {isEditing ? (
        <>
          <TextField
            label="Upload Status"
            value={master.upload_status || ""}
            disabled
          />

          <TextField
            label="Publication Date"
            value={master.publication_date || ""}
            disabled
          />
          <TextField
            label="Dailymotion URL"
            value={master.daily_motion_url || ""}
            disabled
          />
        </>
      ) : (
        ""
      )}

      <CopyingMaster
        prefix="Dailymotion"
        fields={{
          title: master.daily_motion_title,
          description: master.daily_motion_description,
          tags: master.daily_motion_tags,
        }}
        onChange={onCommonMasterChanged}
        isDirty={isDirty}
        onButton={onCopyButton}
      />

      <InputLabel htmlFor="dm-channel-selector">Channel</InputLabel>
      <DailyMotionChannelSelector
        id="dm-channel-selector"
        label="Channel"
        onChanged={props.channelSelectorChanged}
        value={master.daily_motion_category || ""}
        classes={classes}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={master.daily_motion_no_mobile_access}
            onChange={(event) =>
              checkboxChanged(event, "daily_motion_no_mobile_access")
            }
            name="no-mobile-access"
            color="primary"
          />
        }
        label="No mobile access"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={master.daily_motion_contains_adult_content}
            onChange={(event) =>
              checkboxChanged(event, "daily_motion_contains_adult_content")
            }
            name="contains-adult-content"
            color="primary"
          />
        }
        label="Contains adult content"
      />
    </>
  );
};

export default DailyMotionMasterForm;
