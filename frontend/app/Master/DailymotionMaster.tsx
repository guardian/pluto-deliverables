import React, { useState, useEffect } from "react";
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
  getDeliverableDailymotion,
  createDailymotionDeliverable,
  updateDailymotionDeliverable,
  deleteDailymotionDeliverable,
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

interface DailymotionMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {}

const DailymotionMaster: React.FC<DailymotionMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<DailymotionMaster>({
    daily_motion_url: "",
    daily_motion_title: "",
    daily_motion_description: "",
    daily_motion_tags: [],
    publication_date: "",
    upload_status: "",
    daily_motion_no_mobile_access: false,
    daily_motion_contains_adult_content: false,
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { projectid, assetid } = props.match.params;

  useEffect(() => {
    const loadDailymotionMaster = async () => {
      try {
        const dailymotionDeliverable = await getDeliverableDailymotion(
          projectid,
          assetid
        );
        setIsEditing(true);
        setMaster(dailymotionDeliverable);
      } catch (error) {
        if (error) {
          console.error("Failed to load Asset Dailymotion Master", error);
        }
      }

      setIsLoading(false);
    };

    setIsLoading(true);
    loadDailymotionMaster();
  }, []);

  const onProjectSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setIsDirty(true);

    const validForm = !!master.daily_motion_title;

    if (!validForm) {
      console.warn("Could not submit the form because the form is invalid.");
      return;
    }

    try {
      if (isEditing) {
        await updateDailymotionDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Updated Dailymotion Master!`
        );
        navigateBack();
      } else {
        await createDailymotionDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Created Dailymotion Master!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to ${isEditing ? "Update" : "Create"} Dailymotion Master.`
      );
    }
  };

  const deleteDailymotion = async () => {
    try {
      await deleteDailymotionDeliverable(projectid, assetid);
      SystemNotification.open(
        SystemNotificationKind.Success,
        `Successfully Deleted Dailymotion Master!`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to Delete Dailymotion Master.`
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
      setMaster({ ...master, daily_motion_tags: event });
      return;
    }

    if (property?.includes("dailymotion")) {
      fieldChanged(
        event,
        property.replace(
          "dailymotion",
          "daily_motion"
        ) as keyof DailymotionMaster
      );
      return;
    }

    fieldChanged(event, property as keyof DailymotionMaster);
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
            {isEditing ? "Edit" : "Create"} Dailymotion master
          </Typography>

          {isEditing ? (
            <>
              <TextField
                label="Dailymotion Category"
                value={master.daily_motion_category || ""}
                disabled
              />
              <TextField
                label="Upload Status"
                value={master.upload_status || ""}
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

          <TextField
            label="Dailymotion URL"
            value={master.daily_motion_url || ""}
            onChange={(event) => fieldChanged(event, "daily_motion_url")}
            error={isDirty && !master.daily_motion_url}
            helperText={
              isDirty && !master.daily_motion_url
                ? "Dailymotion URL is required"
                : ""
            }
            required
          ></TextField>

          <CommonMaster
            prefix="Dailymotion"
            fields={{
              title: master.daily_motion_title,
              description: master.daily_motion_description,
              tags: master.daily_motion_tags,
            }}
            onChange={onCommonMasterChanged}
            isDirty={isDirty}
          ></CommonMaster>

          <FormControlLabel
            control={
              <Checkbox
                checked={master.daily_motion_no_mobile_access}
                onChange={(event) =>
                  checkboxChanged(event, "daily_motion_no_mobile_access")
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
                checked={master.daily_motion_contains_adult_content}
                onChange={(event) =>
                  checkboxChanged(event, "daily_motion_contains_adult_content")
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
          Delete Dailymotion Master
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this Dailymotion Master?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setOpenDialog(false);
              deleteDailymotion();
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
export default DailymotionMaster;