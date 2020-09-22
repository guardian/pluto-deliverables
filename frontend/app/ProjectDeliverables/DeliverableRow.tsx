import React, { useState, useEffect } from "react";
import {
  Collapse,
  Grid,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@material-ui/core";
import DeliverableTypeSelector from "../DeliverableTypeSelector";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import MasterList from "../MasterList/MasterList";
import { ClassNameMap } from "@material-ui/core/styles/withStyles";
import axios from "axios";
import Cookies from "js-cookie";
import { VidispineItem } from "../vidispine/item/VidispineItem";
import { VError } from "ts-interface-checker";
import DurationFormatter from "./DurationFormatter";
import VidispineJobProgress from "./VidispineJobProgress";
import LaunchIcon from "@material-ui/icons/Launch";
// @ts-ignore
import atomIcon from "../static/atom_icon.svg";

interface DeliverableRowProps {
  deliverable: Deliverable;
  classes: ClassNameMap<string>;
  typeOptions: DeliverableTypes;
  parentBundleInfo?: Project;
  setCentralMessage: (msg: string) => void;
  onCheckedUpdated: (isChecked: boolean) => void;
  onNeedsUpdate: (assetId: bigint) => void;
  onOnlineLoadError?: (err: string) => void;
  vidispineBaseUri: string;
  openJob: (jobId: string) => void;
}

declare var mediaAtomToolUrl: string;

const DeliverableRow: React.FC<DeliverableRowProps> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const updateVidispineItem = async (attempt: number) => {
    if (!props.deliverable.online_item_id) {
      console.log(
        `Deliverable asset ${props.deliverable.filename} has no online item id`
      );
      return;
    }

    const url = `${props.vidispineBaseUri}/API/item/${props.deliverable.online_item_id}?content=metadata&field=__version,durationSeconds`;
    try {
      const response = await axios.get(url);
      const item = new VidispineItem(response.data); //throws a VError if the data is not valid
      console.log(`Got item data ${item}`);
      setVersion(item.getLatestVersion());

      const maybeDuration = item.getMetadataString("durationSeconds");
      try {
        maybeDuration ? setDuration(parseFloat(maybeDuration)) : undefined;
      } catch (err) {
        console.error("Vidispine durationSeconds was not a number!: ", err);
      }
    } catch (err) {
      if (err instanceof VError) {
        console.error("Vidispine sent an invalid response: ", err);
        if (props.onOnlineLoadError)
          props.onOnlineLoadError("Vidispine sent an invalid response");
      } else {
        console.error("Could not load data from Vidispine: ", err);
        if (props.onOnlineLoadError)
          props.onOnlineLoadError("Could not communicate with Vidispine");
      }
    }
  };

  useEffect(() => {
    updateVidispineItem(0);
  }, []);

  const updateItemType = async (assetId: bigint, newvalue: number) => {
    const url = `/api/bundle/${props.parentBundleInfo?.pluto_core_project_id}/asset/${assetId}/setType`;

    try {
      props.setCentralMessage("Updating item type...");
      await axios.put(
        url,
        { type: newvalue },
        {
          headers: {
            "X-CSRFToken": Cookies.get("csrftoken"),
          },
        }
      );
      window.setTimeout(() => {
        props.setCentralMessage("Update completed");
        props.onNeedsUpdate(props.deliverable.id);
      }, 1000);
    } catch (error) {
      console.error("failed to update type: ", error);
      props.setCentralMessage(
        `Could not update the type, please contact MultimediaTech`
      );
    }
  };

  return (
    <React.Fragment>
      <TableRow className={props.classes.root}>
        <TableCell>
          <input
            type="checkbox"
            onChange={(evt) => {
              props.onCheckedUpdated(evt.target.checked);
            }}
          />
        </TableCell>
        <TableCell>
          <Grid
            container
            direction="row"
            alignItems="center"
            justify="space-between"
          >
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
                    onClick={() =>
                      window.open(
                        `${mediaAtomToolUrl}/${props.deliverable.atom_id}`,
                        "_blank"
                      )
                    }
                  >
                    <img
                      src={atomIcon}
                      alt="atom"
                      style={{ width: "26px", height: "26px" }}
                    />
                  </IconButton>
                </Tooltip>
              ) : null}
              <Tooltip title="View media">
                <IconButton
                  aria-label="Go to"
                  style={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingRight: "3px",
                    paddingLeft: "3px",
                  }}
                  onClick={() =>
                    window.open(
                      `/vs/item/${props.deliverable.online_item_id}`,
                      "_blank"
                    )
                  }
                >
                  <LaunchIcon style={{ width: "26px", height: "26px" }} />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </TableCell>
        <TableCell>{version ?? "-"}</TableCell>
        <TableCell>{props.deliverable.size_string ?? "-"}</TableCell>
        <TableCell>
          {duration ? <DurationFormatter durationSeconds={duration} /> : "-"}
        </TableCell>
        <TableCell>
          <DeliverableTypeSelector
            content={props.typeOptions}
            showTip={true}
            value={props.deliverable.type}
            onChange={(newvalue) =>
              updateItemType(props.deliverable.id, newvalue)
            }
          />
        </TableCell>
        <TableCell>{props.deliverable.modified_dt}</TableCell>
        <TableCell>
          {props.deliverable.job_id ? (
            <VidispineJobProgress
              jobId={props.deliverable.job_id}
              vidispineBaseUrl={props.vidispineBaseUri}
              openJob={props.openJob}
              onRecordNeedsUpdate={() =>
                props.onNeedsUpdate(props.deliverable.id)
              }
            />
          ) : null}
        </TableCell>
        <TableCell>{props.deliverable.status_string}</TableCell>
        <TableCell>
          <Tooltip title="Show syndication">
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => {
                setOpen(!open);
              }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow className={props.classes.collapsableTableRow}>
        <TableCell className="expandable-cell" colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <MasterList deliverable={props.deliverable} />
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default DeliverableRow;
