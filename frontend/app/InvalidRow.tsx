import React, { useState, useEffect } from "react";
import {
  Collapse,
  Grid,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  Button,
} from "@material-ui/core";
import DeliverableTypeSelector from "./DeliverableTypeSelector";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import MasterList from "./MasterList/MasterList";
import { ClassNameMap } from "@material-ui/core/styles/withStyles";
import axios from "axios";
import Cookies from "js-cookie";
import { VidispineItem } from "./vidispine/item/VidispineItem";
import { VError } from "ts-interface-checker";
import DurationFormatter from "./ProjectDeliverables/DurationFormatter";
import VidispineJobProgress from "./ProjectDeliverables/VidispineJobProgress";
import LaunchIcon from "@material-ui/icons/Launch";
// @ts-ignore
import atomIcon from "./static/atom_icon.svg";
import PriorityHighIcon from "@material-ui/icons/PriorityHigh";
import DeliverableSummaryCell from "./ProjectDeliverables/DeliverableSummaryCell";
import DateTimeFormatter from "./Form/DateTimeFormatter";
import ReplayIcon from "@material-ui/icons/Replay";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAtom} from '@fortawesome/free-solid-svg-icons'
import BundleInfoComponentForInvalid from "./BundleInfoComponentForInvalid";

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
  project_id: number;
  onSyndicationStarted: (assetId: bigint) => void;
}

const InvalidRow: React.FC<DeliverableRowProps> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
    const [parentBundleInfo, setParentBundleInfo] = useState<Project | undefined>(
        undefined
    );

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
    loadParentBundle();
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

  const doRetry = async () => {
    const url = `api/asset/${props.deliverable.id}/jobretry/${props.deliverable.job_id}`;

    try {
      await axios.put(url, null, {
        headers: {
          "X-CSRFToken": Cookies.get("csrftoken"),
        },
      });
      props.onNeedsUpdate(props.deliverable.id);
      props.setCentralMessage("Ingest process started");
    } catch (error) {
      console.error("Failed to retry job: ", error);
      props.setCentralMessage("Failed to start ingest process");
    }
  };

    const loadParentBundle = async () => {
        try {
            const response = await axios.get(`/api/bundle/byproject/${props.deliverable.deliverable}`);
            return setParentBundleInfo(response.data);
        } catch (err) {
            console.error("Could not load in parent bundle data: ", err);
        }
    };

  return (
    <React.Fragment>
      <TableRow className={props.classes.root}>
        <TableCell>
          {props.deliverable.filename}
            {parentBundleInfo ? (
            <BundleInfoComponentForInvalid
                bundleName={parentBundleInfo.project_id}
                projectId={parentBundleInfo.pluto_core_project_id}
                commissionId={parentBundleInfo.commission_id}
                spacing={0}
            />
            ) : null}
        </TableCell>
        <TableCell>
            {props.deliverable.atom_id ? (
                <FontAwesomeIcon icon={faAtom} size="2x" />
            ) : null}
        </TableCell>
        <TableCell>
          <DateTimeFormatter value={props.deliverable.modified_dt} />
        </TableCell>
        <TableCell>
          {props.deliverable.type_string}
        </TableCell>
        <TableCell>
          {props.deliverable.status_string}
        </TableCell>
        <TableCell>
          <div style={{width: "322px"}}>
          <div style={{float: "left", width: "160px"}}>
          {props.deliverable.job_id ? (
            <Button variant="contained" color="primary" target="_blank" href={`/vs-jobs/job/${props.deliverable.job_id}`}>
              JOB
            </Button>
          ) : (
            <Button variant="contained" disabled>
              JOB
            </Button>
          )}
          </div>
          <div style={{float: "left", width: "160px"}}>
          {props.deliverable.deliverable ? (
            <Button variant="contained" color="secondary" target="_blank" href={`/deliverables/project/${props.deliverable.deliverable}`}>
              BUNDLE
            </Button>
          ) : (
            <Button variant="contained" disabled>
              BUNDLE
            </Button>
          )}
          </div>
          <div style={{float: "left", width: "160px", clear: "left", marginTop: "10px"}}>
            {props.deliverable.absolute_path ? (
            <Button variant="contained" color="primary" target="_blank" href={`pluto:openfolder:${props.deliverable.absolute_path.replace(props.deliverable.filename,'')}`}>
              DROPFOLDER
            </Button>
          ) : (
            <Button variant="contained" disabled>
              DROPFOLDER
            </Button>
          )}
          </div>
          <div style={{float: "left", width: "160px", marginTop: "10px"}}>
            {props.deliverable.online_item_id ? (
            <Button variant="contained" color="secondary" target="_blank" href={`/vs/item/${props.deliverable.online_item_id}`}>
              MEDIA ASSET
            </Button>
          ) : (
            <Button variant="contained" disabled>
              MEDIA ASSET
            </Button>
          )}
          </div>
          </div>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default InvalidRow;
