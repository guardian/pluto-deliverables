import React from "react";
import { Typography } from "@material-ui/core";
import {format, parseISO} from 'date-fns';

interface DateTimeFormatterProps {
  value?: string;
  formatString?: string;
}

const DateTimeFormatter: React.FC<DateTimeFormatterProps> = (props) => {
  const formatString = props.formatString ?? "EEE do MMM yyyy, HH:mm";
  const maybeString = props.value
    ? format(parseISO(props.value), formatString)
    : undefined;
  return maybeString ? <Typography>{maybeString}</Typography> : null;
};

export default DateTimeFormatter;
