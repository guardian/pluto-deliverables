import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import CommonMaster from "./CommonMaster";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "& form": {
      display: "flex",
      width: "100%",
      maxWidth: "800px",
      flexDirection: "column",
      alignItems: "flex-start",
    },
    "& .MuiAutocomplete-root": {
      width: "100%",
    },
    "& .MuiTextField-root": {
      width: "100%",
      marginBottom: "1rem",
    },
    "& .MuiFormControl-root": {
      width: "100%",
      marginBottom: "1rem",
    },
  },
  formButtons: {
    display: "flex",
    marginTop: "1rem",
    "& .cancel": {
      marginLeft: "1rem",
    },
  },
});

interface MainstreamMasterProps
  extends RouteComponentProps<{ masterid?: string }> {}

const MainstreamMaster: React.FC<MainstreamMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<MainstreamMaster>({
    mainstreamTitle: "",
    mainstreamDescription: "",
    mainstreamTags: [],
    mainstreamRulesContainsAdultContent: false,
    uploadStatus: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    if (props.match.params.masterid) {
      setIsEditing(true);
      // Load master
    }
  }, []);

  const onProjectSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setIsDirty(true);

    const validForm = !!master.mainstreamTitle;

    // Todo Update / Create
  };

  const fieldChanged = (
    event: React.ChangeEvent<
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLSelectElement
      | { name?: string; value: any }
    >,
    field: keyof MainstreamMaster
  ): void => {
    setMaster({ ...master, [field]: event.target.value });
  };

  const checkboxChanged = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof MainstreamMaster
  ): void => {
    setMaster({ ...master, [field]: event.target.checked });
  };

  const onCommonMasterChanged = (event: any, property: string) => {
    if (property === "tags") {
      setMaster({ ...master, mainstreamTags: event });
      return;
    }

    fieldChanged(event, property as keyof MainstreamMaster);
  };

  return (
    <div className={classes.root}>
      <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
        <Typography variant="h4">
          {isEditing ? "Edit" : "Create"} Mainstream master
        </Typography>

        {isEditing ? (
          <>
            <TextField
              label="Upload Status"
              value={master.uploadStatus}
              disabled
            />
          </>
        ) : (
          ""
        )}

        <CommonMaster
          prefix="Mainstream"
          fields={{
            title: master.mainstreamTitle,
            description: master.mainstreamDescription,
            tags: master.mainstreamTags,
          }}
          onChange={onCommonMasterChanged}
          isDirty={isDirty}
        ></CommonMaster>

        <FormControlLabel
          control={
            <Checkbox
              checked={master.mainstreamRulesContainsAdultContent}
              onChange={(event) =>
                checkboxChanged(event, "mainstreamRulesContainsAdultContent")
              }
              name="contains-adult-content"
              color="primary"
            />
          }
          label="Contains adult content"
        />

        <div className={classes.formButtons}>
          <Button type="submit" color="primary" variant="contained">
            {isEditing ? "Save" : "Create"}
          </Button>
          <Button
            className="cancel"
            variant="contained"
            onClick={() => history.goBack()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
export default MainstreamMaster;
