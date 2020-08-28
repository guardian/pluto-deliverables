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

interface DailymotionMasterProps
  extends RouteComponentProps<{ masterid?: string }> {}

const DailymotionMaster: React.FC<DailymotionMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<DailymotionMaster>({
    dailymotionUrl: "",
    dailymotionTitle: "",
    dailymotionDescription: "",
    dailymotionTags: [],
    publicationDate: "",
    uploadStatus: "",
    dailymotionNoMobileAccess: false,
    dailymotionContainsAdultContent: false,
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

    const validForm = !!master.dailymotionTitle;

    // Todo Update / Create
  };

  const fieldChanged = (
    event: React.ChangeEvent<
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLSelectElement
      | { name?: string; value: any }
    >,
    field: keyof DailymotionMaster
  ): void => {
    setMaster({ ...master, [field]: event.target.value });
  };

  const checkboxChanged = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof DailymotionMaster
  ): void => {
    setMaster({ ...master, [field]: event.target.checked });
  };

  const onCommonMasterChanged = (event: any, property: string) => {
    if (property === "tags") {
      setMaster({ ...master, dailymotionTags: event });
      return;
    }

    fieldChanged(event, property as keyof DailymotionMaster);
  };

  return (
    <div className={classes.root}>
      <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
        <Typography variant="h4">
          {isEditing ? "Edit" : "Create"} Dailymotion master
        </Typography>

        {isEditing ? (
          <>
            <TextField
              label="Dailymotion Category"
              value={master.dailymotionCategory}
              disabled
            />
            <TextField
              label="Upload Status"
              value={master.uploadStatus}
              disabled
            />

            <TextField
              label="Publication Date"
              value={master.publicationDate}
              disabled
            />
          </>
        ) : (
          ""
        )}

        <TextField
          label="Dailymotion URL"
          value={master.dailymotionUrl}
          onChange={(event) => fieldChanged(event, "dailymotionUrl")}
          error={isDirty && !master.dailymotionUrl}
          helperText={
            isDirty && !master.dailymotionUrl
              ? "Dailymotion URL is required"
              : ""
          }
          required
        ></TextField>

        <CommonMaster
          prefix="Dailymotion"
          fields={{
            title: master.dailymotionTitle,
            description: master.dailymotionDescription,
            tags: master.dailymotionTags,
          }}
          onChange={onCommonMasterChanged}
          isDirty={isDirty}
        ></CommonMaster>

        <FormControlLabel
          control={
            <Checkbox
              checked={master.dailymotionNoMobileAccess}
              onChange={(event) =>
                checkboxChanged(event, "dailymotionNoMobileAccess")
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
              checked={master.dailymotionContainsAdultContent}
              onChange={(event) =>
                checkboxChanged(event, "dailymotionContainsAdultContent")
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
export default DailymotionMaster;
