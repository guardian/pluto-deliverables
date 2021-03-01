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
import SystemNotification, {
  SystemNotificationKind,
} from "../SystemNotification";
import DeleteIcon from "@material-ui/icons/Delete";
import { Launch } from "@material-ui/icons";

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
      marginBottom: "1rem",
      display: "flex",
      width: "100%",
      flexDirection: "column",
      "& .subtitle-small": {
        fontSize: "14px",
        margin: "0",
        textOverflow: "ellipsis",
        display: "inline-block",
        overflow: "hidden",
        maxWidth: "790px",
        whiteSpace: "nowrap",
        minHeight: "22px",
      },
    },
    "& .MuiBadge-root": {
      marginLeft: "1rem",
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

interface YoutubeMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {
  isAdmin: boolean;
}

const YoutubeMaster: React.FC<YoutubeMasterProps> = (props) => {
  const classes = useStyles();
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

  const onProjectSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    setIsDirty(true);

    const validForm = !!(master.youtube_id && master.youtube_title);

    if (!validForm) {
      console.warn("Could not submit the form because the form is invalid.");
      return;
    }

    try {
      if (isEditing) {
        await updateYoutubeDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Updated Youtube Master!`
        );
        navigateBack();
      } else {
        await createYoutubeDeliverable(projectid, assetid, master);
        SystemNotification.open(
          SystemNotificationKind.Success,
          `Successfully Created Youtube Master!`
        );
        navigateBack();
      }
    } catch (error) {
      console.error(error);
      SystemNotification.open(
        SystemNotificationKind.Error,
        `Failed to ${isEditing ? "Update" : "Create"} Youtube Master.`
      );
    }
  };

  const deleteYoutube = async () => {
    try {
      await deleteYoutubeDeliverable(projectid, assetid);
      SystemNotification.open(
        SystemNotificationKind.Success,
        `Successfully Deleted Youtube Master!`
      );
      navigateBack();
    } catch (error) {
      SystemNotification.open(
        SystemNotificationKind.Error,
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

  const fieldChanged = (
    event: React.ChangeEvent<
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLSelectElement
      | { name?: string; value: any }
    >,
    field: keyof YoutubeMaster
  ): void => {
    setMaster({ ...master, [field]: event.target.value });
  };

  const onCommonMasterChanged = (event: any, property: string) => {
    if (property === "tags") {
      setMaster({ ...master, youtube_tags: event });
      return;
    }

    fieldChanged(event, property as keyof YoutubeMaster);
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
          YouTube information{" "}
          {master.youtube_title == "" ? "" : `– ${master.youtube_title}`}
        </title>
      </Helmet>

      <div className={classes.root}>
        <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
          <Typography variant="h4">
            {isEditing ? "Edit" : "Create"} Youtube master
          </Typography>

          {isEditing && (
            <>
              <TextField
                label="Publication Date"
                value={master.publication_date || ""}
                disabled
              />
              <div className="metadata-info">
                <Typography variant="subtitle1">Youtube categories </Typography>
                <p className="subtitle-small">
                  {master.youtube_category ?? ""}
                </p>
              </div>
              <div className="metadata-info">
                <Typography variant="subtitle1">Youtube channels</Typography>

                <p className="subtitle-small">{master.youtube_channel ?? ""}</p>
              </div>
            </>
          )}

          <Grid direction="row" container>
            <Grid item>
              <TextField
                label="Youtube ID"
                value={master.youtube_id || ""}
                onChange={(event) => fieldChanged(event, "youtube_id")}
                error={!isReadOnly && isDirty && !master.youtube_id}
                helperText={
                  !isReadOnly && isDirty && !master.youtube_id
                    ? "Youtube ID is required"
                    : ""
                }
                required={!isReadOnly}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item style={{ flex: "0 0 48px" }}>
              <Tooltip
                title={`https://youtube.com/watch?v=${master.youtube_id}`}
              >
                <IconButton
                  onClick={() =>
                    history.push(
                      `https://youtube.com/watch?v=${master.youtube_id}`
                    )
                  }
                >
                  <Launch />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <CommonMaster
            prefix={"Youtube"}
            fields={{
              title: master.youtube_title,
              description: master.youtube_description,
              tags: master.youtube_tags,
            }}
            onChange={onCommonMasterChanged}
            isDirty={isDirty}
            disabled={isReadOnly}
          ></CommonMaster>

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
