import React from "react";
import { TextField } from "@material-ui/core";
import ChipInput from "../Form/ChipInput";

interface CommonMasterFields {
  title: string;
  description: string;
  tags: string[];
}

interface CommonMasterProps {
  prefix: string;
  fields: CommonMasterFields;
  onChange: (event: any, property: string) => void;
  isDirty: boolean;
  disabled?: boolean;
}

const CommonMaster: React.FC<CommonMasterProps> = (props) => {
  const { prefix } = props;
  const { title, description, tags } = props.fields;
  const titleLabel = `${prefix} title`;
  const titleDescription = `${prefix} description`;
  const prefixLowerCase = (prefix || "").toLowerCase();
  const isDirty = props.isDirty && !props.disabled;

  return (
    <>
      <TextField
        label={titleLabel}
        value={title || ""}
        onChange={(event) => props.onChange(event, `${prefixLowerCase}_title`)}
        error={isDirty && !title}
        helperText={isDirty && !title ? `${titleLabel} is required` : ""}
        required={!props.disabled}
        disabled={props.disabled}
      />

      <TextField
        label={titleDescription}
        multiline
        rows={4}
        variant="outlined"
        value={description || ""}
        onChange={(event) =>
          props.onChange(event, `${prefixLowerCase}_description`)
        }
        disabled={props.disabled}
      />

      <ChipInput
        label={"Tags"}
        value={tags}
        onChange={(event) => props.onChange(event, "tags")}
        disabled={props.disabled}
      />
    </>
  );
};

export default CommonMaster;
