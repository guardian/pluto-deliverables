import React from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Chip, TextField } from "@material-ui/core";

interface ChipInputProps {
  label: string;
  value: string[];
  onChange: (newValue: string[]) => void;
  disabled?: boolean;
}

const ChipInput: React.FC<ChipInputProps> = (props) => {
  return (
    <Autocomplete
      multiple
      options={[]}
      freeSolo
      value={props.value}
      disabled={props.disabled}
      onChange={(_, newValue: string[]) => {
        props.onChange(newValue);
      }}
      renderTags={(value: string[], getTagProps) =>
        value.map((option: string, index: number) => (
          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
        ))
      }
      renderInput={(params) => <TextField {...params} label={props.label} />}
    />
  );
};

export default ChipInput;
