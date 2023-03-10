import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { VidispineJob } from "../vidispine/job/VidispineJob";
import { VError } from "ts-interface-checker";
import {
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from "@material-ui/core";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import LaunchIcon from "@material-ui/icons/Launch";
import { makeStyles } from "@material-ui/core/styles";
import { getUnixTime, parseISO } from "date-fns";

interface VidispineJobProgressProps {
  jobId: string;
  vidispineBaseUrl: string;
  openJob: (jobID: string) => void;
  onRecordNeedsUpdate: () => void;
  modifiedDateTime: string;
  status: string;
}

const useStyles = makeStyles({});

const VidispineJobProgress: React.FC<VidispineJobProgressProps> = (props) => {
  const [jobData, setJobData] = useState<VidispineJob | undefined>(undefined);
  const [updateTimer, setUpdateTimer] = useState<number>(Date.now());
  const [lastError, setLastError] = useState<string | undefined>(undefined);

  //we need to use a reference so that the timer callback can get access to the job data
  const jobDataRef = useRef<VidispineJob>();
  jobDataRef.current = jobData;

  const [totalProgressWithinStep, setTotalProgressWithinStep] = useState<
    number | undefined
  >(0);
  const [totalStepProgress, setTotalStepProgress] = useState<
    number | undefined
  >(0);
  const [indeterminate, setIndeterminate] = useState<boolean>(true);

  const classes = useStyles();

  /**
   * load in data for the job
   */
  const loadJobData = async (initialMount = false) => {
    const aWeekAgo = getUnixTime(Date.now() - 604800000);
    const modDateTime = getUnixTime(parseISO(props.modifiedDateTime));
    try {
      const response = await axios.get(
        `${props.vidispineBaseUrl}/API/job/${props.jobId}`
      );
      const jobInfo = new VidispineJob(response.data);

      setIndeterminate(jobInfo.data.totalSteps <= 0);

      let overallProgress =
        jobInfo.data.currentStep &&
        jobInfo.data.currentStep.number &&
        jobInfo.data.totalSteps > 0
          ? ((jobInfo.data.currentStep.number + 1) / jobInfo.data.totalSteps) *
            100
          : undefined;

      if (overallProgress) setTotalStepProgress(overallProgress);

      let subprogress: number = 0;
      if (jobInfo.data.currentStep && jobInfo.data.currentStep.progress) {
        const progressData = jobInfo.data.currentStep.progress;
        if (progressData.unit === "percent") {
          subprogress = progressData.value / 100;
        } else if (progressData.total) {
          subprogress = progressData.value / progressData.total;
        } else {
          subprogress = 0;
        }
      }

      if (overallProgress)
        setTotalProgressWithinStep(
          overallProgress -
            100 / jobInfo.data.totalSteps +
            100 * (subprogress / jobInfo.data.totalSteps)
        );

      setJobData(jobInfo);
      setLastError(undefined);
      //let the parent know when the job finishes, this triggers a reload of the row data
      if (!initialMount && jobInfo?.didFinish()) props.onRecordNeedsUpdate();
    } catch (err) {
      if (err instanceof VError) {
        console.error(
          "Vidispine returned unexpected data for ",
          props.jobId,
          ": ",
          err
        );
        setLastError("Did not understand response");
        clearInterval(updateTimer);
        setUpdateTimer(Date.now());
      } else if (err.response?.status == 404) {
        if (aWeekAgo < modDateTime) {
          console.error("Job not found: ", err);
          setLastError("Job not found");
        } else {
          console.error("Job older than a week: ", err);
        }
      } else {
        console.error("Could not load data from Vidispine: ", err);
        setLastError("Vidispine not responding");
      }
    }
  };

  /**
   * called on an interval timer to update the job status, while it is
   */
  const updateHandler = () => {
    const job = jobDataRef.current;
    if (!job) {
      console.log("no job data");
      return;
    }
    if (props.status != "Ready") {
      loadJobData();
    } else {
      return;
    }
  };

  useEffect(() => {
    loadJobData(true);

    return () => {
      console.log("clearing update timer for ", props.jobId);
      if (updateTimer) clearInterval(updateTimer);
    };
  }, [props.status]);

  useEffect(() => {
    const interval = setInterval(() => setUpdateTimer(Date.now()), 5000);
    return () => {
      updateHandler();
      clearInterval(interval);
    };
  }, [props.jobId]);

  return (
    <Grid container direction="column" spacing={3} id={`vs-job-${props.jobId}`}>
      <Grid item>
        {jobData?.wasSuccess() ||
        (jobData?.data.currentStep?.description && !jobData?.didFinish()) ||
        jobData?.getMetadata("errorMessage") ||
        lastError ? (
          <LinearProgress
            classes={classes}
            variant="buffer"
            value={totalProgressWithinStep}
            valueBuffer={totalStepProgress}
          />
        ) : null}
      </Grid>
      <Grid item className="job-progress-caption">
        <Grid
          container
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          {jobData?.wasSuccess() ? (
            <>
              <Grid item>
                <CheckCircleIcon fontSize="small" style={{ color: "green" }} />
              </Grid>
              <Grid item>
                <Typography
                  variant="caption"
                  id={`vs-job-${props.jobId}-completed`}
                >
                  Completed
                </Typography>
              </Grid>
            </>
          ) : null}
          {jobData?.data.currentStep?.description && !jobData?.didFinish() ? (
            <>
              <Grid item>
                <InfoIcon fontSize="small" style={{ color: "gray" }} />
              </Grid>
              <Grid item>
                <Typography variant="caption" id={`vs-job-${props.jobId}-info`}>
                  {jobData.data.currentStep.description}
                </Typography>
              </Grid>
            </>
          ) : null}
          {jobData?.getMetadata("errorMessage") || lastError ? (
            <>
              <Grid item>
                <ErrorIcon fontSize="small" style={{ color: "red" }} />
              </Grid>
              <Grid item>
                {jobData?.getMetadata("errorMessage") ? (
                  <Typography
                    variant="caption"
                    style={{ color: "red" }}
                    id={`vs-job-${props.jobId}-joberr`}
                  >
                    {jobData.getMetadata("errorMessage")}
                  </Typography>
                ) : null}
                {lastError ? (
                  <Typography
                    variant="caption"
                    style={{ color: "red" }}
                    id={`vs-job-${props.jobId}-servererr`}
                  >
                    {lastError}
                  </Typography>
                ) : null}
              </Grid>
            </>
          ) : null}
          <Grid item>
            {jobData?.wasSuccess() ||
            (jobData?.data.currentStep?.description && !jobData?.didFinish()) ||
            jobData?.getMetadata("errorMessage") ||
            lastError ? (
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => {
                  props.openJob(props.jobId);
                }}
              >
                <LaunchIcon />
              </IconButton>
            ) : null}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default React.memo(VidispineJobProgress);
