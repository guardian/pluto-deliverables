import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import PriorityHighIcon from "@material-ui/icons/PriorityHigh";
import DeliverableSummaryCell from "./DeliverableSummaryCell";
import DateTimeFormatter from "../Form/DateTimeFormatter";
import ReplayIcon from "@material-ui/icons/Replay";
import { getDeliverable } from "../api-service";

interface DeliverableRowProps {
  deliverable: Deliverable;
  classes: ClassNameMap<string>;
  typeOptions: DeliverableTypes;
  parentBundleInfo?: Project;
  setCentralMessage: (msg: string) => void;
  onCheckedUpdated: (isChecked: boolean) => void;
  onNeedsUpdate: () => Promise<void>;
  onOnlineLoadError?: (err: string) => void;
  vidispineBaseUri: string;
  openJob: (jobId: string) => void;
  project_id: number;
  onSyndicationStarted: (assetId: bigint) => void;
}

const DeliverableRow: React.FC<DeliverableRowProps> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [deliverable, setDeliverable] = useState<Deliverable>(
    props.deliverable
  );

  const updateVidispineItem = async () => {
    if (!deliverable.online_item_id) {
      console.log(
        `Deliverable asset ${deliverable.filename} has no online item id`
      );
      return;
    }

    const url = `${props.vidispineBaseUri}/API/item/${deliverable.online_item_id}?content=metadata&field=__version,durationSeconds`;
    try {
      const response = await axios.get(url);
      const item = new VidispineItem(response.data); //throws a VError if the data is not valid
      console.log("Got item data ", item);
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

  const updateHandler = async () => {
    const refreshed_deliverable = await getDeliverable(deliverable.id);
    setDeliverable(refreshed_deliverable);
    if (["Ready", "Ingested"].includes(deliverable.status_string)) {
      clearInterval();
    }
  };

  useEffect(() => {
    updateVidispineItem();
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
      setTimeout(() => {
        props.setCentralMessage("Update completed");
        props.onNeedsUpdate;
      }, 1000);
    } catch (error) {
      console.error("failed to update type: ", error);
      props.setCentralMessage(
        `Could not update the type, please contact MultimediaTech`
      );
    }
  };

  const doRetry = async () => {
    const url = `/deliverables/api/asset/${deliverable.id}/jobretry/${deliverable.job_id}`;

    try {
      await axios.put(url, null, {
        headers: {
          "X-CSRFToken": Cookies.get("csrftoken"),
        },
      });
      props.onNeedsUpdate;
      props.setCentralMessage("Ingest process started");
    } catch (error) {
      console.error("Failed to retry job: ", error);
      props.setCentralMessage("Failed to start ingest process");
    }
  };

  useEffect(() => {
    setDeliverable(props.deliverable);
  }, [props.deliverable]);

  useEffect(() => {
    if (!["Ready"].includes(deliverable.status_string)) {
      const timer = setTimeout(updateHandler, 5000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [deliverable, version, duration]);

  const [rerender, setRerender] = useState(false);
  // Updates item after vidispine ingest is complete
  const onRecordNeedsUpdate = () => {
    console.log("DEBUG: Vidispine ingest complete");
    // TODO: Update item version and duration after ingest is complete
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
          <DeliverableSummaryCell deliverable={deliverable} />
        </TableCell>
        <TableCell>{version ?? "-"}</TableCell>
        <TableCell>{deliverable.size_string ?? "-"}</TableCell>
        <TableCell>
          {duration ? <DurationFormatter durationSeconds={duration} /> : "-"}
        </TableCell>
        <TableCell>
          <DateTimeFormatter value={deliverable.ingest_complete_dt} />
        </TableCell>
        <TableCell>
          <DeliverableTypeSelector
            content={props.typeOptions}
            showTip={true}
            value={deliverable.type}
            onChange={(newvalue) => updateItemType(deliverable.id, newvalue)}
          />
        </TableCell>
        <TableCell>
          <DateTimeFormatter value={deliverable.modified_dt} />
        </TableCell>
        <TableCell>
          {deliverable.job_id ? (
            <VidispineJobProgress
              jobId={deliverable.job_id}
              vidispineBaseUrl={props.vidispineBaseUri}
              openJob={props.openJob}
              onRecordNeedsUpdate={onRecordNeedsUpdate}
              modifiedDateTime={deliverable.modified_dt}
              status={deliverable.status_string}
            />
          ) : null}
        </TableCell>
        <TableCell>
          {deliverable.status_string}
          {deliverable.status_string == "Ingest failed" ? (
            <Tooltip title="Run the failed ingest process again">
              <IconButton
                size="small"
                onClick={() => {
                  doRetry();
                }}
                style={{ marginLeft: "6px" }}
              >
                <ReplayIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </TableCell>
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
            <MasterList
              deliverable={deliverable}
              project_id={props.project_id}
              onSyndicationInitiated={props.onSyndicationStarted}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default React.memo(DeliverableRow);
