import React from "react";
import { Checkbox, FormControlLabel, TextField } from "@material-ui/core";
import CopyingMaster from "./CopyingMaster";

interface MainstreamMasterFormProps {
  isEditing: boolean;
  master: MainstreamMaster;
  isReadOnly: boolean;
  isDirty: boolean;
  checkboxChanged: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof MainstreamMaster
  ) => void;
  onCopyButton: (property: string) => void;
  onCommonMasterChanged: (evt: any, field: string) => void;
}

const MainstreamMasterForm: React.FC<MainstreamMasterFormProps> = (props) => {
  const {
    isEditing,
    master,
    isReadOnly,
    isDirty,
    checkboxChanged,
    onCopyButton,
    onCommonMasterChanged,
  } = props;

  return (
    <div>
      {isEditing ? (
        <>
          <TextField
            label="Upload Status"
            value={master.upload_status || ""}
            disabled
          />
        </>
      ) : (
        ""
      )}

      <CopyingMaster
        prefix="Mainstream"
        fields={{
          title: master.mainstream_title,
          description: master.mainstream_description,
          tags: master.mainstream_tags,
        }}
        onChange={onCommonMasterChanged}
        isDirty={isDirty}
        onButton={onCopyButton}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={master.mainstream_rules_contains_adult_content}
            onChange={(event) =>
              checkboxChanged(event, "mainstream_rules_contains_adult_content")
            }
            name="contains-adult-content"
            color="primary"
          />
        }
        label="Contains adult content"
      />
    </div>
  );
};

export default MainstreamMasterForm;
