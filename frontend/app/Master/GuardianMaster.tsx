import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Typography,
  Button,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import { validProductionOffices, validPrimaryTones } from "../utils/constants";
import FormSelect from "../Form/FormSelect";
import CommonMaster from "./CommonMaster";
import {
  getDeliverableGNM,
  createGNMDeliverable,
  updateGNMDeliverable,
  deleteGNMDeliverable,
} from "../utils/master-api-service";
import SystemNotification, {
  SystemNotificationKind,
} from "../SystemNotification";
import DeleteIcon from "@material-ui/icons/Delete";

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
    width: "100%",
    "& .cancel": {
      marginLeft: "1rem",
    },
    "& .delete": {
      marginLeft: "auto",
    },
  },
  dialog: {
    "& .MuiDialogActions-root.MuiDialogActions-spacing": {
      justifyContent: "flex-start",
      "& .MuiButtonBase-root.MuiButton-root.MuiButton-contained:not(.MuiButton-containedSecondary)": {
        marginLeft: "auto",
      },
    },
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
  },
});

interface GuardianMasterProps
  extends RouteComponentProps<{
    projectid: string;
    assetid: string;
  }> {
  isAdmin: boolean;
}

const GuardianMaster: React.FC<GuardianMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<GuardianMaster>({
    upload_status: "",
    production_office: "",
    tags: [],
    publication_date: "",
    website_title: "",
    website_description: "",
    primary_tone: "",
    publication_status: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { projectid, assetid } = props.match.params;

  useEffect(() => {
    const loadGNMWebsite = async () => {
      try {
        const gnmDeliverable = await getDeliverableGNM(projectid, assetid);
        setIsEditing(true);
        setIsReadOnly(!props.isAdmin);
        setMaster(gnmDeliverable);
      } catch (error) {
        if (error) {
          console.error("Failed to load GNM Deliverable", error);
        }
      }

      setIsLoading(false);
    };

    setIsLoading(true);
    loadGNMWebsite();
  }, []);

  const onProjectSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setIsDirty(true);

    const validForm = !!(master.production_office && master.website_title);

    if (!validForm) {
      console.warn("Could not submit the form because the form is invalid.");
      return;
    }

    try {
      if (isEditing) {
        await updateGNMDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Updated GNM Website!`
        );
        navigateBack();
      } else {
        await createGNMDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Created GNM Website!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to ${isEditing ? "Update" : "Create"}  GNM Website.`
      );
    }
  };

  const navigateBack = (): void => {
    history.push(`/project/${projectid}`);
  };

  const deleteGNM = async () => {
    try {
      await deleteGNMDeliverable(projectid, assetid);
      SystemNotification.open(
        SystemNotificationKind.Success,
        `Successfully Deleted GNM Website!`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to Delete GNM Website.`
      );
    }
  };

  const closeDialog = () => {
    setOpenDialog(false);
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

  if (isLoading) {
    return (
      <div className={classes.loading}>
        <Typography variant="h4">Loading...</Typography>
      </div>
    );
  }

  return (
    <>
      <div className={classes.root}>
        <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
          <Typography variant="h4">
            {isEditing ? "Edit" : "Create"} GNM website
          </Typography>

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

                <Divider></Divider>
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
          ></FormSelect>

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
          ></CommonMaster>

          <FormSelect
            label="Primary Tone"
            value={master.primary_tone || ""}
            onChange={(event: any) => fieldChanged(event, "primary_tone")}
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
            {!isReadOnly && isEditing && (
              <Button
                className="delete"
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </div>
      <Dialog
        className={classes.dialog}
        open={openDialog}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete GNM Website</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this GNM Website?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setOpenDialog(false);
              deleteGNM();
            }}
          >
            Delete
          </Button>
          <Button variant="contained" onClick={closeDialog}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default GuardianMaster;