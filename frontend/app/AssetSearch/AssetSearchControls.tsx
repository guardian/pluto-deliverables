import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, TextField } from "@material-ui/core";
import { validator } from "./UuidValidator";

interface AssetSearchControlsProps {
  values: AssetSearchFilter;
  onChange: (newValues: AssetSearchFilter) => void;
}

const useStyles = makeStyles({});

const AssetSearchControls: React.FC<AssetSearchControlsProps> = (props) => {
  const classes = useStyles();
  const [atomIdError, setAtomIdError] = useState(false);

  useEffect(() => {
    if (props.values.atom_id && props.values.atom_id.length > 0) {
      setAtomIdError(!validator.test(props.values.atom_id));
    }
  }, [props.values]);

  return (
    <Grid container>
      <Grid item xs={4}>
        <TextField
          id="asset-search-filename"
          label="Filename or title"
          value={props.values.title}
          onChange={(evt) => {
            const newValues = Object.assign({}, props.values, {
              title: evt.target.value,
            });
            props.onChange(newValues);
          }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="asset-search-atomid"
          label="Atom ID"
          value={props.values.atom_id}
          error={atomIdError}
          onChange={(evt) => {
            const newValues = Object.assign({}, props.values, {
              atom_id: evt.target.value,
            });
            props.onChange(newValues);
          }}
          helperText={
            atomIdError ? "This does not appear to be a valid atom id" : ""
          }
        />
      </Grid>
    </Grid>
  );
};

export default AssetSearchControls;
