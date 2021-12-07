import React from "react";
import { Divider, TextField, Typography } from "@material-ui/core";
import FormSelect from "../Form/FormSelect";
import { validPrimaryTones, validProductionOffices } from "../utils/constants";
import CommonMaster from "./CommonMaster";
import { metadataStyles } from "./MetadataStyles";

interface GuardianMasterFormProps {
  isEditing: boolean;
  master: GuardianMaster;
  isReadOnly: boolean;
  isDirty: boolean;
  fieldChanged: (
    event: React.ChangeEvent<
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLSelectElement
      | { name?: string; value: any }
    >,
    field: keyof GuardianMaster
  ) => void;
  onCommonMasterChanged: (evt: any, field: string) => void;
}

const GuardianMasterForm: React.FC<GuardianMasterFormProps> = (props) => {
  const {
    isEditing,
    master,
    isReadOnly,
    isDirty,
    fieldChanged,
    onCommonMasterChanged,
  } = props;

  const classes = metadataStyles();

  return (
    <div className={classes.root}>
      {isEditing ? (
        <>
          <div className="metadata-info">
            <Typography variant="subtitle1">Media Atom ID</Typography>

            {master.media_atom_id ? (
              <a target="_blank" href={master.media_atom_id}>
                {master.media_atom_id}
              </a>
            ) : (
              ""
            )}

            <Divider />
          </div>

          <TextField
            label="Upload Status"
            value={master.upload_status || ""}
            disabled
          />

          <TextField
            label="Publication Status"
            value={master.publication_status || ""}
            disabled
          />

          <TextField
            label="Publication Date"
            value={master.publication_date || ""}
            disabled
          />
        </>
      ) : (
        ""
      )}

      <FormSelect
        label="Production Office"
        value={master.production_office || ""}
        onChange={(event: any) => fieldChanged(event, "production_office")}
        options={validProductionOffices}
        required={!isReadOnly}
        error={!isReadOnly && isDirty && !master.production_office}
        disabled={isReadOnly}
      />

      <CommonMaster
        prefix="Website"
        fields={{
          title: master.website_title,
          description: master.website_description,
          tags: master.tags,
        }}
        onChange={onCommonMasterChanged}
        isDirty={isDirty}
        disabled={isReadOnly}
      />

      <FormSelect
        label="Primary Tone"
        value={master.primary_tone || ""}
        onChange={(event: any) => fieldChanged(event, "primary_tone")}
        options={validPrimaryTones}
        disabled={isReadOnly}
      />

      {isEditing ? (
        <div className="atom-tool-warning">
          You can not adjust this here. You need to do it in Atom Tool.&nbsp;
          <a href="https://video.gutools.co.uk/" target="_blank">
            https://video.gutools.co.uk/
          </a>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default GuardianMasterForm;
