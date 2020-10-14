import React, { useEffect, useState } from "react";
import axios from "axios";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

interface SyndicationLastLogProps {
  uploadStatus: string | null;
  platform: string;
  projectId: number;
  assetId: bigint;
}

interface LogResponse {
  logs: Array<string>;
}

const useStyles = makeStyles({
  logline: {
    fontFamily: "Courier New, Sans, Monospace",
    fontSize: "10pt",
  },
});

const SyndicationLastLog: React.FC<SyndicationLastLogProps> = (props) => {
  const [lastMessage, setLastMessage] = useState<string | undefined>(undefined);

  const classes = useStyles();

  useEffect(() => {
    console.log(
      "uploadStatus changed for ",
      props.assetId,
      "-",
      props.platform,
      ": ",
      props.uploadStatus
    );

    if (
      props.uploadStatus == "Ready for Upload" ||
      props.uploadStatus == "Uploading"
    ) {
      const timerId = window.setInterval(updateLog, 1000);
      return () => {
        console.log("clearing interval timer ", timerId);
        window.clearInterval(timerId);
      };
    }
  }, [props.uploadStatus]);

  const updateLog = async () => {
    try {
      const response = await axios.get<LogResponse>(
        `/api/bundle/${props.projectId}/asset/${props.assetId}/${props.platform}/logs?limit=1`
      );
      if (response.data.logs.length > 0) {
        setLastMessage(response.data.logs[0]);
      } else {
        setLastMessage(undefined);
      }
    } catch (err) {
      console.error(
        `Could not load logs for ${props.platform} of ${props.assetId}: `,
        err
      );
    }
  };

  return (
    <Typography className={classes.logline}>
      {lastMessage ? lastMessage : ""}
    </Typography>
  );
};

export default SyndicationLastLog;
