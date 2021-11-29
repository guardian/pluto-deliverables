import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  makeStyles,
  Typography,
  Button,
  TextField,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  IconButton,
  Toolbar,
} from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import CommonMaster from "./CommonMaster";
import {
  getDeliverableYoutube,
  createYoutubeDeliverable,
  updateYoutubeDeliverable,
  deleteYoutubeDeliverable,
} from "../utils/master-api-service";
import { SystemNotification, SystemNotifcationKind } from "pluto-headers";
import DeleteIcon from "@material-ui/icons/Delete";
import { Launch } from "@material-ui/icons";
import { metadataStyles } from "./MetadataStyles";
import YoutubeMasterForm from "./YoutubeMasterForm";

interface YoutubeMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {
  isAdmin: boolean;
}

const YoutubeMaster: React.FC<YoutubeMasterProps> = (props) => {
  const classes = metadataStyles();
  const history = useHistory();
  const [master, setMaster] = useState<YoutubeMaster>({
    youtube_id: "",
    youtube_title: "",
    youtube_description: "",
    youtube_tags: [],
    publication_date: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { projectid, assetid } = props.match.params;

  useEffect(() => {
    const loadYoutubeMaster = async () => {
      try {
        const youtubeDeliverable = await getDeliverableYoutube(
          projectid,
          assetid
        );
        setIsEditing(true);
        setIsReadOnly(!props.isAdmin);
        setMaster(youtubeDeliverable);
      } catch (error) {
        if (error) {
          console.error("Failed to load Asset Youtube Master", error);
        }
      }

      setIsLoading(false);
    };

    setIsLoading(true);
    loadYoutubeMaster();
  }, []);

  // const onProjectSubmit = async (
  //   event: React.FormEvent<HTMLFormElement>
  // ): Promise<void> => {
  //   event.preventDefault();
  //
  //   setIsDirty(true);
  //
  //   const validForm = !!(master.youtube_id && master.youtube_title);
  //
  //   if (!validForm) {
  //     console.warn("Could not submit the form because the form is invalid.");
  //     return;
  //   }
  //
  //   try {
  //     if (isEditing) {
  //       await updateYoutubeDeliverable(projectid, assetid, master);
  //       SystemNotification.open(
  //         SystemNotifcationKind.Success,
  //         `Successfully Updated Youtube Master!`
  //       );
  //       navigateBack();
  //     } else {
  //       await createYoutubeDeliverable(projectid, assetid, master);
  //       SystemNotification.open(
  //         SystemNotifcationKind.Success,
  //         `Successfully Created Youtube Master!`
  //       );
  //       navigateBack();
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     SystemNotification.open(
  //       SystemNotifcationKind.Error,
  //       `Failed to ${isEditing ? "Update" : "Create"} Youtube Master.`
  //     );
  //   }
  // };

  const saveRequested = async (update: YoutubeMaster) => {
    try {
      if (isEditing) {
        await updateYoutubeDeliverable(projectid, assetid, update);
        SystemNotification.open(
          SystemNotifcationKind.Success,
          `Successfully Updated Youtube Master!`
        );
        navigateBack();
      } else {
        await createYoutubeDeliverable(projectid, assetid, update);
        SystemNotification.open(
          SystemNotifcationKind.Success,
          `Successfully Created Youtube Master!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Failed to ${isEditing ? "Update" : "Create"} Youtube Master.`
      );
    }
  };

  const deleteYoutube = async () => {
    try {
      await deleteYoutubeDeliverable(projectid, assetid);
      SystemNotification.open(
        SystemNotifcationKind.Success,
        `Successfully Deleted Youtube Master!`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Failed to Delete Youtube Master.`
      );
    }
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  const navigateBack = (): void => {
    history.push(`/project/${projectid}`);
  };

  // const fieldChanged = (
  //   event: React.ChangeEvent<
  //     | HTMLTextAreaElement
  //     | HTMLInputElement
  //     | HTMLSelectElement
  //     | { name?: string; value: any }
  //   >,
  //   field: keyof YoutubeMaster
  // ): void => {
  //   setMaster({ ...master, [field]: event.target.value });
  // };
  //
  // const onCommonMasterChanged = (event: any, property: string) => {
  //   if (property === "tags") {
  //     setMaster({ ...master, youtube_tags: event });
  //     return;
  //   }
  //
  //   fieldChanged(event, property as keyof YoutubeMaster);
  // };

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
          YouTube information{" "}
          {master.youtube_title == "" ? "" : `– ${master.youtube_title}`}
        </title>
      </Helmet>

      <div className={classes.root}>
        <Typography variant="h4">
          {isEditing ? "Edit" : "Create"} Youtube master
        </Typography>

        <YoutubeMasterForm
          isEditing={isEditing}
          master={master}
          isReadOnly={isReadOnly}
          isDirty={isDirty}
          saveRequested={saveRequested}
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
        </div>
      </div>

      <Dialog
        className={classes.dialog}
        open={openDialog}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Youtube Master</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this Youtube Master?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setOpenDialog(false);
              deleteYoutube();
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

export default YoutubeMaster;
