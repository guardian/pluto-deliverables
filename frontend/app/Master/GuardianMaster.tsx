import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  makeStyles,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { RouteComponentProps, useHistory } from "react-router-dom";
import { validPrimaryTones, validProductionOffices } from "../utils/constants";
import FormSelect from "../Form/FormSelect";
import CommonMaster from "./CommonMaster";
import {
  createGNMDeliverable,
  deleteGNMDeliverable,
  getDeliverableGNM,
  requestResync,
  resyncToPublished,
  updateGNMDeliverable,
} from "../utils/master-api-service";
import {
  SystemNotification,
  SystemNotifcationKind,
} from "@guardian/pluto-headers";
import DeleteIcon from "@material-ui/icons/Delete";
import GuardianMasterForm from "./GuardianMasterForm";
import { metadataStyles } from "./MetadataStyles";

// const useStyles = makeStyles({
//   root: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     "& form": {
//       display: "flex",
//       width: "100%",
//       maxWidth: "800px",
//       flexDirection: "column",
//       alignItems: "flex-start",
//     },
//     "& .MuiAutocomplete-root": {
//       width: "100%",
//     },
//     "& .MuiTextField-root": {
//       width: "100%",
//       marginBottom: "1rem",
//     },
//     "& .MuiFormControl-root": {
//       width: "100%",
//       marginBottom: "1rem",
//     },
//     "& .metadata-info": {
//       width: "100%",
//       "& .MuiTypography-subtitle1": {
//         display: "inline-block",
//       },
//       "& a": {
//         marginLeft: "10px",
//       },
//     },
//     "& .MuiDivider-root": {
//       marginTop: "3px",
//     },
//     "& .atom-tool-warning": {
//       paddingTop: "20px",
//     },
//   },
//   formButtons: {
//     display: "flex",
//     marginTop: "1rem",
//     width: "100%",
//     "& .cancel": {
//       marginLeft: "1rem",
//     },
//     "& .delete": {
//       marginLeft: "auto",
//     },
//     "& .resync": {
//       marginLeft: "auto",
//     },
//   },
//   dialog: {
//     "& .MuiDialogActions-root.MuiDialogActions-spacing": {
//       justifyContent: "flex-start",
//       "& .MuiButtonBase-root.MuiButton-root.MuiButton-contained:not(.MuiButton-containedSecondary)": {
//         marginLeft: "auto",
//       },
//     },
//   },
//   loading: {
//     display: "flex",
//     flexDirection: "column",
//     width: "100%",
//     alignItems: "center",
//   },
// });

interface GuardianMasterProps
  extends RouteComponentProps<{
    projectid: string;
    assetid: string;
  }> {
  isAdmin: boolean;
}

const GuardianMaster: React.FC<GuardianMasterProps> = (props) => {
  const classes = metadataStyles();
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
          SystemNotifcationKind.Success,
          `Successfully Updated GNM Website!`
        );
        navigateBack();
      } else {
        await createGNMDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotifcationKind.Success,
          `Successfully Created GNM Website!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotifcationKind.Error,
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
        SystemNotifcationKind.Success,
        `Successfully deleted website information`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Failed to delete website information`
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
      <Helmet>
        <title>
          Website information{" "}
          {master.website_title == "" ? "" : `– ${master.website_title}`}
        </title>
      </Helmet>

      <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
        <Typography variant="h4">
          {isEditing ? "Edit" : "Create"} GNM website
        </Typography>

        <GuardianMasterForm
          isEditing={isEditing}
          master={master}
          isReadOnly={isReadOnly}
          fieldChanged={fieldChanged}
          isDirty={isDirty}
          onCommonMasterChanged={onCommonMasterChanged}
        />

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
          <Tooltip title="Update the GNM website data from the published atom">
            <Button
              className="resync"
              variant="outlined"
              onClick={() =>
                requestResync(
                  props.match.params.projectid,
                  props.match.params.assetid
                )
              }
            >
              Resync
            </Button>
          </Tooltip>
        </div>
      </form>

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
