import React from "react";
import { makeStyles, TextField, Tooltip, IconButton } from "@material-ui/core";
import ChipInput from "../Form/ChipInput";
import FileCopyIcon from "@material-ui/icons/FileCopy";

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
    gridTemplateColumns: "auto 40px",
    marginBottom: "1em",
  },
  grid_1: {
    gridColumnStart: 1,
    gridColumnEnd: 1,
    marginTop: "1em",
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
  fullWidth: {
    width: "100%",
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
            className={classes.fullWidth}
          />
        </div>
        <div className={classes.grid_2}>
          <Tooltip title="Copy from Youtube master">
            <IconButton onClick={() => props.onButton("title")}>
              <FileCopyIcon />
            </IconButton>
          </Tooltip>
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
            className={classes.fullWidth}
          />
        </div>
        <div className={classes.description_button}>
          <Tooltip title="Copy from Youtube master">
            <IconButton onClick={() => props.onButton("description")}>
              <FileCopyIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div className={classes.grid_1}>
          <ChipInput
            label={"Tags"}
            value={tags}
            onChange={(event) => props.onChange(event, "tags")}
            disabled={props.disabled}
          />
        </div>
        <div className={classes.grid_2}>
          <Tooltip title="Copy from Youtube master">
            <IconButton onClick={() => props.onButton("tags")}>
              <FileCopyIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export default CopyingMaster;
