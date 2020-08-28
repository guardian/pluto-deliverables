import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
} from "@material-ui/core";

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (event: any) => void;
  options: string[];
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = (props) => {
  const labelId = `${(props.label || "").toLowerCase()}-label`;
  const error = props.error && !props.disabled;
  const required = props.required && !props.disabled;
  return (
    <FormControl disabled={props.disabled} required={required} error={error}>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <Select
        labelId={labelId}
        value={props.value}
        onChange={(event: any) => props.onChange(event)}
      >
        {props.options.map((option) => (
          <MenuItem value={option} key={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>
        {error ? `${props.label} is required` : ""}
      </FormHelperText>
    </FormControl>
  );
};

export default FormSelect;
