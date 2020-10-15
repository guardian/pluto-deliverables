import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  makeStyles,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import CommonMaster from "./CommonMaster";
import {
  getDeliverableMainstream,
  createMainstreamDeliverable,
  updateMainstreamDeliverable,
  deleteMainstreamDeliverable,
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

interface MainstreamMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {}

const MainstreamMaster: React.FC<MainstreamMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<MainstreamMaster>({
    mainstream_title: "",
    mainstream_description: "",
    mainstream_tags: [],
    mainstream_rules_contains_adult_content: false,
    upload_status: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { projectid, assetid } = props.match.params;

  useEffect(() => {
    const loadMainstreamMaster = async () => {
      try {
        const mainstreamDeliverable = await getDeliverableMainstream(
          projectid,
          assetid
        );
        setIsEditing(true);
        setMaster(mainstreamDeliverable);
      } catch (error) {
        if (error) {
          console.error("Failed to load Asset Mainstream Master", error);
        }
      }

      setIsLoading(false);
    };

    setIsLoading(true);
    loadMainstreamMaster();
  }, []);

  const onProjectSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setIsDirty(true);

    const validForm = !!master.mainstream_title;

    if (!validForm) {
      console.warn("Could not submit the form because the form is invalid.");
      return;
    }

    try {
      if (isEditing) {
        await updateMainstreamDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Updated Mainstream Master!`
        );
        navigateBack();
      } else {
        await createMainstreamDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Created Mainstream Master!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to ${isEditing ? "Update" : "Create"} Mainstream Master.`
      );
    }
  };

  const deleteMainstream = async () => {
    try {
      await deleteMainstreamDeliverable(projectid, assetid);
      SystemNotification.open(
        SystemNotificationKind.Success,
        `Successfully Deleted Mainstream Master!`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to Delete Mainstream Master.`
      );
    }
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  const navigateBack = (): void => {
    history.push(`/project/${projectid}`);
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
      setMaster({ ...master, mainstream_tags: event });
      return;
    }

    fieldChanged(event, property as keyof MainstreamMaster);
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
          MainstreamMedia information{" "}
          {master.mainstream_title == "" ? "" : `– ${master.mainstream_title}`}
        </title>
      </Helmet>

      <div className={classes.root}>
        <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
          <Typography variant="h4">
            {isEditing ? "Edit" : "Create"} Mainstream master
          </Typography>

          {isEditing ? (
            <>
              <TextField
                label="Upload Status"
                value={master.upload_status || ""}
                disabled
              />
            </>
          ) : (
            ""
          )}

          <CommonMaster
            prefix="Mainstream"
            fields={{
              title: master.mainstream_title,
              description: master.mainstream_description,
              tags: master.mainstream_tags,
            }}
            onChange={onCommonMasterChanged}
            isDirty={isDirty}
          ></CommonMaster>

          <FormControlLabel
            control={
              <Checkbox
                checked={master.mainstream_rules_contains_adult_content}
                onChange={(event) =>
                  checkboxChanged(
                    event,
                    "mainstream_rules_contains_adult_content"
                  )
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

            {isEditing && (
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
        <DialogTitle id="alert-dialog-title">
          Delete Mainstream Master
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this Mainstream Master?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setOpenDialog(false);
              deleteMainstream();
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
export default MainstreamMaster;
