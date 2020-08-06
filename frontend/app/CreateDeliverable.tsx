import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Redirect,
  RouteComponentProps,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import {
  Button,
  FormControl,
  InputLabel,
  TextField,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Cookies from "js-cookie";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: "1rem",
    "& form": {
      width: "400px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      margin: "0.625rem 0 0 0",
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
    marginTop: "2.5rem",
    "& .cancel": {
      marginLeft: "1rem",
    },
  },
});

const CreateDeliverable: React.FC<RouteComponentProps> = () => {
  const [projectName, setProjectName] = useState("");
  const [projectIdInput, setProjectIdInput] = useState("");
  const [canEditProjectId, setCanEditProjectId] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState({});
  const [saveCompleted, setSaveCompleted] = useState(false);

  const { projectId } = useParams();

  const classes = useStyles();

  useEffect(() => {
    if (projectId) {
      setProjectIdInput(projectId);
      setCanEditProjectId(false);
    }
  }, []);

  const doCreateProject = async () => {
    const csrftoken = Cookies.get("csrftoken");
    if (!csrftoken) {
      console.warn("Could not find a csrf token! Request will probably fail");
    }

    setIsSaving(true);

    try {
      const result = await axios.post(
        "/api/bundle/new",
        {
          project_id: projectIdInput,
          name: projectName,
        },
        {
          headers: {
            "X-CSRFToken": csrftoken,
          },
        }
      );

      setIsSaving(false);
      if (result.status == 200) {
        setSaveCompleted(true);
      } else {
        setLastError(`Could not save: server returned ${result.status}`);
      }
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      setLastError(err.toString());
    }
  };

  if (saveCompleted) return <Redirect to={`/project/${projectIdInput}`} />;
  return (
    <>
      <Typography variant="h2">Create new bundle</Typography>
      <Paper elevation={3} className={classes.root}>
        <FormControl>
          {/*<InputLabel htmlFor="name-input">Deliverable bundle name</InputLabel>*/}
          <TextField
            required
            id="name-input"
            label="Deliverable bundle name"
            value={projectName}
            onChange={(evt) => setProjectName(evt.target.value)}
            InputProps={{
              readOnly: isSaving,
            }}
          />
        </FormControl>
        <FormControl>
          <TextField
            required
            id="project-id=input"
            label="Project ID"
            value={projectIdInput}
            onChange={(evt) => setProjectIdInput(evt.target.value)}
            InputProps={{
              readOnly: !canEditProjectId || isSaving,
            }}
          />
        </FormControl>
        <Button
          variant="outlined"
          onClick={doCreateProject}
          disabled={isSaving}
        >
          Create
        </Button>
        <Button
          variant="outlined"
          onClick={() => history.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </Paper>
    </>
  );
};

export default CreateDeliverable;
