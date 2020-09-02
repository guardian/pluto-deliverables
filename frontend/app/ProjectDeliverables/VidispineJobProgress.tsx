import React, { useEffect, useState } from "react";
import axios from "axios";
import { VidispineJob } from "../vidispine/job/VidispineJob";
import { VError } from "ts-interface-checker";
import { Grid, LinearProgress, Typography } from "@material-ui/core";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import { makeStyles } from "@material-ui/core/styles";

interface VidispineJobProgressProps {
  jobId: string;
  vidispineBaseUrl: string;
}

const useStyles = makeStyles({});

const VidispineJobProgress: React.FC<VidispineJobProgressProps> = (props) => {
  const [jobData, setJobData] = useState<VidispineJob | undefined>(undefined);
  const [updateTimer, setUpdateTimer] = useState<number | undefined>(undefined);
  const [lastError, setLastError] = useState<string | undefined>(undefined);

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
  const loadJobData = async () => {
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

      //overallProgress takes us to the _next_ step (it's the "buffering" part of the progress bar)
      //therefore when currentStep.number==totalSteps it comes out >100%. Fix that here.
      //if(overallProgress && overallProgress>100) overallProgress=100;
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
    } catch (err) {
      if (err instanceof VError) {
        console.error(
          "Vidispine returned unexpected data for ",
          props.jobId,
          ": ",
          err
        );
        setLastError("Did not understand response");
        window.clearInterval(updateTimer);
        setUpdateTimer(undefined);
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
    console.log(jobData?.didFinish());
    if (!jobData) return;
    if (jobData && jobData.didFinish()) return; //don't try to reload data if the job has already completed
    loadJobData();
  };

  useEffect(() => {
    console.log("VidispineJobProgress mounting for job ", props.jobId);
    setUpdateTimer(window.setInterval(updateHandler, 5000));
    loadJobData();

    return () => {
      console.log("clearing update timer for ", props.jobId);
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  return (
    <Grid container direction="column" id={`vs-job-${props.jobId}`}>
      <Grid item>
        <Grid container direction="column" spacing={3}>
          <Grid item>
            <LinearProgress
              classes={classes}
              variant="buffer"
              value={totalProgressWithinStep}
              valueBuffer={totalStepProgress}
            />
          </Grid>
          <Grid item className="job-progress-caption">
            {jobData?.data.currentStep?.description ? (
              <Grid container direction="row">
                <Grid item>
                  <InfoIcon fontSize="small" style={{ color: "gray" }} />
                </Grid>
                <Grid item>
                  <Typography variant="caption">
                    {jobData.data.currentStep.description}
                  </Typography>
                </Grid>
              </Grid>
            ) : null}
            {jobData?.getMetadata("errorMessage") ? (
              <Grid container direction="row">
                <Grid item>
                  <ErrorIcon fontSize="small" style={{ color: "red" }} />
                </Grid>
                <Grid item>
                  <Typography variant="caption" style={{ color: "red" }}>
                    {jobData.getMetadata("errorMessage")}
                  </Typography>
                </Grid>
              </Grid>
            ) : null}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default VidispineJobProgress;
