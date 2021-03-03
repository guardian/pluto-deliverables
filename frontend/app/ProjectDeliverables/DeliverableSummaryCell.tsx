import React from "react";
import {
  Grid,
  IconButton,
  TableCell,
  Tooltip,
  Typography,
} from "@material-ui/core";
// @ts-ignore
import atomIcon from "../static/atom_icon.svg";
import LaunchIcon from "@material-ui/icons/Launch";
import PriorityHighIcon from "@material-ui/icons/PriorityHigh";

interface DeliverableSummaryCellProps {
  deliverable: Deliverable;
}

//import globals that were set by the backend
declare var mediaAtomToolUrl: string;
declare var archiverHunterURL: string;

const DeliverableSummaryCell: React.FC<DeliverableSummaryCellProps> = (
  props
) => {
  return (
    <Grid container direction="row" alignItems="center" justify="space-between">
      <Grid item>
        <Typography>{props.deliverable.filename}</Typography>
      </Grid>
      <Grid item>
        {props.deliverable.atom_id ? (
          <Tooltip title="Imported from media atom">
            <IconButton
              aria-label="Go to"
              style={{
                paddingTop: 0,
                paddingBottom: 0,
                paddingRight: "3px",
                paddingLeft: "3px",
              }}
              onClick={(evt) => {
                evt.preventDefault();
                window.open(
                  `${mediaAtomToolUrl}/${props.deliverable.atom_id}`,
                  "_blank"
                );
              }}
            >
              <img
                src={atomIcon}
                alt="atom"
                style={{ width: "26px", height: "26px" }}
              />
            </IconButton>
          </Tooltip>
        ) : null}
        {props.deliverable.online_item_id ||
        props.deliverable.archive_item_id ? (
          <Tooltip title="View media">
            <IconButton
              aria-label="Go to"
              style={{
                paddingTop: 0,
                paddingBottom: 0,
                paddingRight: "3px",
                paddingLeft: "3px",
              }}
              onClick={(evt) => {
                evt.preventDefault();
                const targetUrl = props.deliverable.online_item_id
                  ? `/vs/item/${props.deliverable.online_item_id}`
                  : `${archiverHunterURL}${encodeURIComponent(
                      props.deliverable.archive_item_id as string
                    )}`;
                window.open(targetUrl, "_blank");
              }}
            >
              <LaunchIcon style={{ width: "26px", height: "26px" }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="No media could be found!">
            <PriorityHighIcon style={{ width: "26px", height: "26px" }} />
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default DeliverableSummaryCell;
