import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Typography,
  Button,
  TextField,
  Tooltip,
  Badge,
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
    "& .cancel": {
      marginLeft: "1rem",
    },
  },
});

interface YoutubeMasterProps
  extends RouteComponentProps<{ masterid?: string }> {
  isAdmin: boolean;
}

const YoutubeMaster: React.FC<YoutubeMasterProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const [master, setMaster] = useState<YoutubeMaster>({
    youtubeID: "",
    youtubeTitle: "",
    youtubeDescription: "",
    youtubeTags: [],
    publicationDate: "",
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

    const validForm = !!(master.youtubeID && master.youtubeTitle);

    // Todo Update / Create
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
      setMaster({ ...master, youtubeTags: event });
      return;
    }

    fieldChanged(event, property as keyof YoutubeMaster);
  };

  return (
    <div className={classes.root}>
      <form onSubmit={onProjectSubmit} noValidate autoComplete="off">
        <Typography variant="h4">
          {isEditing ? "Edit" : "Create"} Youtube master
        </Typography>

        {isEditing && (
          <>
            <TextField
              label="Publication Date"
              value={master.publicationDate}
              disabled
            />
            <div className="metadata-info">
              <Typography variant="subtitle1">
                Youtube categories{" "}
                <Tooltip
                  title={
                    master.youtubeCategories
                      ? master.youtubeCategories
                          .map((category) => category)
                          .join(", ")
                      : ""
                  }
                  placement="right"
                >
                  <Badge
                    badgeContent={master.youtubeCategories?.length || "0"}
                    color="primary"
                  ></Badge>
                </Tooltip>
              </Typography>
              <p className="subtitle-small">
                {master.youtubeCategories
                  ?.map((category) => category)
                  .join(", ")}
              </p>
            </div>
            <div className="metadata-info">
              <Typography variant="subtitle1">
                Youtube channels
                <Tooltip
                  title={
                    master.youtubeChannels
                      ? master.youtubeChannels
                          .map((channel) => channel)
                          .join(", ")
                      : ""
                  }
                  placement="right"
                >
                  <Badge
                    badgeContent={master.youtubeChannels?.length || "0"}
                    color="primary"
                  ></Badge>
                </Tooltip>
              </Typography>

              <p className="subtitle-small">
                {master.youtubeChannels?.map((channel) => channel).join(", ")}
              </p>
            </div>
          </>
        )}

        <TextField
          label="Youtube ID"
          value={master.youtubeID}
          onChange={(event) => fieldChanged(event, "youtubeID")}
          error={!isReadOnly && isDirty && !master.youtubeID}
          helperText={
            !isReadOnly && isDirty && !master.youtubeID
              ? "Youtube ID is required"
              : ""
          }
          required={!isReadOnly}
          disabled={isReadOnly}
        ></TextField>

        <CommonMaster
          prefix={"Youtube"}
          fields={{
            title: master.youtubeTitle,
            description: master.youtubeDescription,
            tags: master.youtubeTags,
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
        </div>
      </form>
    </div>
  );
};
export default YoutubeMaster;
