import React from "react";
import {format, parseISO} from "date-fns";
import {Typography} from "@material-ui/core";

interface NiceDateFormatterProps {
    date: Date|string;
}

const NiceDateFormatter:React.FC<NiceDateFormatterProps> = (props) => {
    const dateValue:Date = (typeof props.date)==="string" ? parseISO(props.date as string) : props.date as Date;

    return <Typography>{format(dateValue, "eee do MMM yy")}</Typography>
}

export default NiceDateFormatter;