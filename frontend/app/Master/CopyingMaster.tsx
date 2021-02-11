import React from "react";
import { Button, makeStyles, TextField } from "@material-ui/core";
import ChipInput from "../Form/ChipInput";

interface CopyingMasterFields {
  title: string;
  description: string;
  tags: string[];
}

interface CopyingMasterProps {
  prefix: string;
  fields: CopyingMasterFields;
  onChange: (event: any, property: string) => void;
  isDirty: boolean;
  disabled?: boolean;
  onButton: (property: string) => void;
}

const useStyles = makeStyles({
  grid_holder: {
    display: "grid",
    gridTemplateColumns: "535px 265px",
  },
  grid_1: {
    gridColumnStart: 1,
    gridColumnEnd: 1,
  },
  grid_2: {
    gridColumnStart: 2,
    gridColumnEnd: 2,
    marginLeft: "10px",
  },
  description_button: {
    gridColumnStart: 2,
    gridColumnEnd: 2,
    marginLeft: "10px",
    marginTop: "42px",
  },
});

const CopyingMaster: React.FC<CopyingMasterProps> = (props) => {
  const classes = useStyles();
  const { prefix } = props;
  const { title, description, tags } = props.fields;
  const titleLabel = `${prefix} title`;
  const titleDescription = `${prefix} description`;
  const prefixLowerCase = (prefix || "").toLowerCase();
  const isDirty = props.isDirty && !props.disabled;

  return (
    <>
      <div className={classes.grid_holder}>
        <div className={classes.grid_1}>
          <TextField
            label={titleLabel}
            value={title || ""}
            onChange={(event) =>
              props.onChange(event, `${prefixLowerCase}_title`)
            }
            error={isDirty && !title}
            helperText={isDirty && !title ? `${titleLabel} is required` : ""}
            required={!props.disabled}
            disabled={props.disabled}
          ></TextField>
        </div>
        <div className={classes.grid_2}>
          <Button
            onClick={() => props.onButton("title")}
            variant="contained"
            color="primary"
          >
            Copy from YouTube Master
          </Button>
        </div>
        <div className={classes.grid_1}>
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
          ></TextField>
        </div>
        <div className={classes.description_button}>
          <Button
            onClick={() => props.onButton("description")}
            variant="contained"
            color="primary"
          >
            Copy from YouTube Master
          </Button>
        </div>
        <div className={classes.grid_1}>
          <ChipInput
            label={"Tags"}
            value={tags}
            onChange={(event) => props.onChange(event, "tags")}
            disabled={props.disabled}
          ></ChipInput>
        </div>
        <div className={classes.grid_2}>
          <Button
            onClick={() => props.onButton("tags")}
            variant="contained"
            color="primary"
          >
            Copy from YouTube Master
          </Button>
        </div>
      </div>
    </>
  );
};

export default CopyingMaster;
