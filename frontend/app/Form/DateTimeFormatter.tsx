import React from "react";
import moment from "moment";
import { Typography } from "@material-ui/core";

interface DateTimeFormatterProps {
  value?: string;
  formatString?: string;
}

const DateTimeFormatter: React.FC<DateTimeFormatterProps> = (props) => {
  const formatString = props.formatString ?? "ddd Do MMM YYYY, HH:mm";
  const maybeString = props.value
    ? moment(props.value).format(formatString)
    : undefined;
  return maybeString ? <Typography>{maybeString}</Typography> : null;
};

export default DateTimeFormatter;
