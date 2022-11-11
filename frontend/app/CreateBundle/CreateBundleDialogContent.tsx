import React, { useEffect, useState } from "react";
import { parseISO } from "date-fns";
import axios from "axios";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@material-ui/core";
import { Check } from "@material-ui/icons";
import CustomDialogTitle from "../CustomDialogTitle";
import { useHistory } from "react-router-dom";
import { Alert } from "@material-ui/lab";
import { format } from "date-fns/fp";
import { createProjectDeliverable } from "./CreateBundleService";

interface CreateBundleDialogContentProps {
  projectid: number;
  didComplete: () => void;
}

const CreateBundleDialogContent: React.FC<CreateBundleDialogContentProps> = (
  props
) => {
  const [projectTitle, setProjectTitle] = useState<string | undefined>(
    undefined
  );
  const [projectStatus, setProjectStatus] = useState<string | undefined>(
    undefined
  );
  const [projectCreated, setProjectCreated] = useState<Date | undefined>(
    undefined
  );
  const [projectOwner, setProjectOwner] = useState<string | undefined>(
    undefined
  );
  const [projectCommission, setProjectCommission] = useState<
    number | undefined
  >(undefined);

  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [canComplete, setCanComplete] = useState(false);

  const [loading, setLoading] = useState(true);

  const history = useHistory();

  const safeDate = (from: string): Date | undefined => {
    try {
      return parseISO(from);
    } catch (err) {
      console.error("Date string ", from, " could not be parsed: ", err);
      return undefined;
    }
  };

  const formattedCreateTime = (): string => {
    if (projectCreated) {
      try {
        return format("E do LLL yyyy", projectCreated);
      } catch (err) {
        console.error("could not format date ", projectCreated, ": ", err);
        return "(unknown)";
      }
    } else {
      return "(unknown)";
    }
  };

  //validate that we have the right information for the create bundle call to succeed, and if so allow the user to complete
  useEffect(() => {
    const newValue =
      props.projectid !== undefined &&
      projectTitle !== undefined &&
      projectCommission !== undefined;
    console.log(`checking if we have enough data: ${newValue}...`);
    if (!canComplete && newValue) {
      console.log("all values present to create a bundle");
      setLastError(undefined);
      setCanComplete(newValue);
    }
    if (!newValue && !lastError) {
      console.info(
        "can't create a bundle as some data is missing: projectid=",
        props.projectid,
        " projectTitle=",
        projectTitle,
        " projectCommission=",
        projectCommission
      );
      setLastError(
        "Did not get the right data from pluto-core. Please report this to multimediatech."
      );
      setCanComplete(false);
    }
  }, [projectTitle, projectCommission, props.projectid]);

  const loadProjectInfo = async () => {
    setLoading(true);
    if (props.projectid === -1) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `/pluto-core/api/project/${props.projectid}`
      );
      if (response.data && response.data.result) {
        setProjectTitle(response.data.result.title);
        setProjectStatus(response.data.result.status);
        setProjectCreated(safeDate(response.data.result.created));
        setProjectOwner(response.data.result.user);
        setProjectCommission(response.data.result.commissionId);
      } else {
        setLastError(
          "Could not understand server response, please report this to multimediatech"
        );
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response) {
        switch (err.response.status) {
          case 404:
            setLastError("This project does not exist");
            break;
          case 502 | 503 | 504:
            setLastError("pluto-core is not responding, retrying...");
            window.setTimeout(() => loadProjectInfo(), 3000);
            break;
          default:
            if (err.response && err.response.data && err.response.data.detail) {
              setLastError(
                `There was a server error: ${err.response.data.detail}, please go back and try again.`
              );
            } else {
              setLastError(
                `There was a server error, please go back and try again.`
              );
            }
            console.log(
              "pluto-core responded with ",
              err.response.status,
              ": ",
              err.response.data
            );
            break;
        }
      }
    }
  };

  useEffect(() => {
    loadProjectInfo();
  }, [props.projectid]);

  const createBundle = () => {
    if (projectCommission && projectTitle) {
      createProjectDeliverable(props.projectid, projectCommission, projectTitle)
        .then((_) => props.didComplete())
        .catch((err) => {
          console.error("could not complete bundle creation: ", err);
          setLastError("Deliverable bundle create failed, please try again.");
        });
    } else {
      setLastError(
        "Did not have enough information to complete, this is a bug."
      );
    }
  };

  return (
    <>
      <CustomDialogTitle
        id="create-bundle-title"
        onClose={() => history.goBack()}
      >
        Add deliverables to project
      </CustomDialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress id="spinner" />
        ) : (
          <>
            {lastError ? (
              <Alert severity="error" id="error-text">
                {lastError}
              </Alert>
            ) : (
              <>
                <Typography>
                  You are about to add deliverables to {projectTitle} for the
                  first time. Are you sure you want to continue?
                </Typography>
                <Typography>
                  This project is currently {projectStatus} and was created by{" "}
                  {projectOwner} on {formattedCreateTime()}
                </Typography>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => history.goBack()}>
          Go back
        </Button>
        <Button
          id="create-button"
          variant="contained"
          color="primary"
          disabled={!canComplete}
          startIcon={<Check />}
          onClick={createBundle}
        >
          Create
        </Button>
      </DialogActions>
    </>
  );
};

export default CreateBundleDialogContent;
