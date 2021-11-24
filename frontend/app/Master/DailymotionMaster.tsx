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
  FormControl,
  InputLabel,
} from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import CopyingMaster from "./CopyingMaster";
import {
  getDeliverableDailymotion,
  createDailymotionDeliverable,
  updateDailymotionDeliverable,
  deleteDailymotionDeliverable,
  getDeliverableYoutube,
} from "../utils/master-api-service";
import { SystemNotification, SystemNotifcationKind } from "pluto-headers";
import DeleteIcon from "@material-ui/icons/Delete";
import DailyMotionChannelSelector from "./DailymotionChannelSelector";
import DailyMotionMasterForm from "./DailyMotionMasterForm";

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
    daily_motion_category: "news",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { projectid, assetid } = props.match.params;
  const [youtubeMaster, setYoutubeMaster] = useState<YoutubeMaster>({
    youtube_id: "",
    youtube_title: "",
    youtube_description: "",
    youtube_tags: [],
    publication_date: "",
  });

  useEffect(() => {
    const loadYoutubeMaster = async () => {
      try {
        const youtubeDeliverable = await getDeliverableYoutube(
          projectid,
          assetid
        );
        setYoutubeMaster(youtubeDeliverable);
      } catch (error) {
        if (error) {
          console.error("Failed to load Asset Youtube Master", error);
        }
      }
    };
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

    loadYoutubeMaster();
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
          SystemNotifcationKind.Success,
          `Successfully Updated Dailymotion Master!`
        );
        navigateBack();
      } else {
        await createDailymotionDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotifcationKind.Success,
          `Successfully Created Dailymotion Master!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Failed to ${isEditing ? "Update" : "Create"} Dailymotion Master.`
      );
    }
  };

  const deleteDailymotion = async () => {
    try {
      await deleteDailymotionDeliverable(projectid, assetid);
      SystemNotification.open(
        SystemNotifcationKind.Success,
        `Successfully Deleted Dailymotion Master!`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotifcationKind.Error,
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
      | { name?: number; value: any }
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

  const onCopyButton = (property: string) => {
    if (property === "title") {
      setMaster({ ...master, daily_motion_title: youtubeMaster.youtube_title });
      return;
    }
    if (property === "description") {
      setMaster({
        ...master,
        daily_motion_description: youtubeMaster.youtube_description,
      });
      return;
    }
    if (property === "tags") {
      setMaster({ ...master, daily_motion_tags: youtubeMaster.youtube_tags });
      return;
    }
  };

  return (
    <>
      <Helmet>
        <title>
          DailyMotion information{" "}
          {master.daily_motion_title == ""
            ? ""
            : `– ${master.daily_motion_title}`}
        </title>
      </Helmet>

      <div className={classes.root}>
        <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
          <Typography variant="h4">
            {isEditing ? "Edit" : "Create"} Dailymotion master
          </Typography>

          <DailyMotionMasterForm
            isEditing={isEditing}
            master={master}
            isReadOnly={false}
            isDirty={isDirty}
            checkboxChanged={checkboxChanged}
            channelSelectorChanged={(newChan) =>
              setMaster({ ...master, ["daily_motion_category"]: newChan })
            }
            onCopyButton={onCopyButton}
            onCommonMasterChanged={onCommonMasterChanged}
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
