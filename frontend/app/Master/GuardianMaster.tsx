import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Typography,
  Button,
  Divider,
  TextField,
} from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import { validProductionOffices, validPrimaryTones } from "../utils/constants";
import FormSelect from "../Form/FormSelect";
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
    "& .metadata-info": {
      width: "100%",
      "& .MuiTypography-subtitle1": {
        display: "inline-block",
      },
      "& a": {
        marginLeft: "10px",
      },
    },
    "& .MuiDivider-root": {
      marginTop: "3px",
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

interface GuardianMasterProps
  extends RouteComponentProps<{ masterid?: string }> {
  isAdmin: boolean;
}

const GuardianMaster: React.FC<GuardianMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<GuardianMaster>({
    uploadStatus: "",
    productionOffice: "",
    tags: [],
    publicationDate: "",
    websiteTitle: "",
    websiteDescription: "",
    primaryTone: "",
    publicationStatus: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    if (props.match.params.masterid) {
      setIsEditing(true);
      setIsReadOnly(!props.isAdmin);
      // Load master
    }
  }, []);

  const onProjectSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setIsDirty(true);

    const validForm = !!(master.productionOffice && master.websiteTitle);

    // Todo Update / Create
  };

  const fieldChanged = (
    event: React.ChangeEvent<
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLSelectElement
      | { name?: string; value: any }
    >,
    field: keyof GuardianMaster
  ): void => {
    setMaster({ ...master, [field]: event.target.value });
  };

  const onCommonMasterChanged = (event: any, property: string) => {
    if (property === "tags") {
      setMaster({ ...master, tags: event });
      return;
    }

    fieldChanged(event, property as keyof GuardianMaster);
  };

  return (
    <div className={classes.root}>
      <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
        <Typography variant="h4">
          {isEditing ? "Edit" : "Create"} GNM website
        </Typography>

        {isEditing ? (
          <>
            <div className="metadata-info">
              <Typography variant="subtitle1">Media Atom ID</Typography>

              {master.mediaAtomId ? (
                <a target="_blank" href={master.mediaAtomId}>
                  {master.mediaAtomId}
                </a>
              ) : (
                ""
              )}

              <Divider></Divider>
            </div>

            <TextField
              label="Upload Status"
              value={master.uploadStatus}
              disabled
            />

            <TextField
              label="Publication Status"
              value={master.publicationStatus}
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

        <FormSelect
          label="Production Office"
          value={master.productionOffice}
          onChange={(event: any) => fieldChanged(event, "productionOffice")}
          options={validProductionOffices}
          required={!isReadOnly}
          error={!isReadOnly && isDirty && !master.productionOffice}
          disabled={isReadOnly}
        ></FormSelect>

        <CommonMaster
          prefix="Website"
          fields={{
            title: master.websiteTitle,
            description: master.websiteDescription,
            tags: master.tags,
          }}
          onChange={onCommonMasterChanged}
          isDirty={isDirty}
          disabled={isReadOnly}
        ></CommonMaster>

        <FormSelect
          label="Primary Tone"
          value={master.primaryTone}
          onChange={(event: any) => fieldChanged(event, "primaryTone")}
          options={validPrimaryTones}
          disabled={isReadOnly}
        ></FormSelect>

        <div className={classes.formButtons}>
          <Button
            disabled={isReadOnly}
            type="submit"
            color="primary"
            variant="contained"
          >
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
export default GuardianMaster;
