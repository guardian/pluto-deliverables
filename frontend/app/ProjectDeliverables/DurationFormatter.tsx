import React, { useEffect, useState } from "react";
import { Typography } from "@material-ui/core";

interface DurationFormatterProps {
  durationSeconds: number;
  frameRate?: number;
}

const DurationFormatter: React.FC<DurationFormatterProps> = (props) => {
  const [timeString, setTimeString] = useState<string>("-");

  /**
   * break down the number into hours, minutes, seconds, frames parts
   */
  useEffect(() => {
    const hours = Math.floor(props.durationSeconds / 3600);
    const mins = Math.floor((props.durationSeconds - hours * 3600) / 60);
    const seconds = Math.floor(
      props.durationSeconds - hours * 3600 - mins * 60
    );

    const finalString = `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    setTimeString(finalString);
  }, []);

  return <Typography>{timeString}</Typography>;
};

export default DurationFormatter;
