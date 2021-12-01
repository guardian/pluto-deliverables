import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@material-ui/core";
import LaunchIcon from "@material-ui/icons/Launch";
// @ts-ignore
import atomIcon from "../static/atom_icon.svg";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import { makeStyles } from "@material-ui/core/styles";
import NiceDateFormatter from "../Common/NiceDateFormatter";
import PlatformIndicator from "./PlatformIndicator";
import { useHistory } from "react-router-dom";
import BundleInfoComponentForInvalid from "../BundleInfoComponentForInvalid";
import SyndicationNotes from "./SyndicationNotes";
import { ChevronRightRounded } from "@material-ui/icons";
import OoovvuuSwitcher from "./OoovvuuSwitcher";
import ReutersConnectSwitcher from "./ReutersConnectSwitcher";

//import globals that were set by the backend
declare var mediaAtomToolUrl: string;
declare var archiverHunterURL: string;

interface DeliverablesDashEntryProps {
  entry: DenormalisedDeliverable;
  commissionFilterRequested: (commissionId?: number) => void;
  currentCommissionFilter?: number;
  projectFilterRequested: (projectId?: number) => void;
  currentProjectFilter?: number;
  onRecordDidUpdate?: (
    assetId: bigint,
    newValue: DenormalisedDeliverable
  ) => void; //called when a record has been updated in the backend
}

const useStyles = makeStyles({
  disabledIcon: {
    opacity: "50%",
  },
  enabledIcon: {
    opacity: "100%",
  },
});

const DeliverablesDashEntry: React.FC<DeliverablesDashEntryProps> = (props) => {
  const classes = useStyles();

  const [notesUpdate, setNotesUpdate] = useState(0); //increment to trigger a refresh of notes

  const commissionFilterChanged = () => {
    if (props.currentCommissionFilter) {
      props.commissionFilterRequested(undefined);
    } else {
      props.commissionFilterRequested(props.entry.deliverable.commission_id);
    }
  };

  const history = useHistory();

  const goToAtom = () => {};

  const openInMediabrowser = () => {
    if (props.entry.online_item_id) {
      window.open(`/vs/item/${props.entry.online_item_id}`, "_blank");
    } else if (props.entry.archive_item_id) {
      window.open(
        `${archiverHunterURL}${encodeURIComponent(
          props.entry.archive_item_id
        )}`,
        "_blank"
      );
    } else {
      SystemNotification.open(
        SystemNotifcationKind.Warning,
        "Sorry we can't view this item at present. Please report this to multimediatech."
      );
    }
  };

  const openInDeliverables = () => {
    window.open(`/deliverables/item/${props.entry.id}`, "_blank");
  };

  return (
    <TableRow>
      <TableCell>
        <Grid container justifyContent="space-between">
          <Grid item>
            {props.entry.gnm_website_master?.website_title ? (
              <Typography>
                {props.entry.gnm_website_master.website_title}
              </Typography>
            ) : undefined}
            <Typography>{props.entry.filename}</Typography>
          </Grid>
          <Grid item>
            <Tooltip title="Click here to view deliverable details">
              <IconButton onClick={openInDeliverables}>
                <ChevronRightRounded />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </TableCell>
      <TableCell style={{ minWidth: "250px", maxWidth: "500px" }}>
        {props.entry.gnm_website_master?.publication_date ? (
          <Typography>
            Published on{" "}
            <NiceDateFormatter
              date={props.entry.gnm_website_master.publication_date}
            />
          </Typography>
        ) : (
          <Typography>(not published)</Typography>
        )}
        <Typography>
          Last updated <NiceDateFormatter date={props.entry.changed_dt} />
        </Typography>
      </TableCell>
      <TableCell>
        <BundleInfoComponentForInvalid
          bundleName={props.entry.deliverable.name}
          commissionId={props.entry.deliverable.commission_id}
          projectId={props.entry.deliverable.pluto_core_project_id}
        />
      </TableCell>
      <TableCell>
        <Typography>{props.entry.type_string}</Typography>
      </TableCell>
      <TableCell>
        <Grid container>
          <Tooltip
            title={
              props.entry.atom_id
                ? "This deliverable came from the Atom Tool. Click here to view the original atom"
                : "This deliverable did not come from the Atom Tool"
            }
          >
            <Grid item>
              <IconButton onClick={goToAtom} disabled={!props.entry.atom_id}>
                <img
                  src={atomIcon}
                  alt="atom"
                  style={{ width: "26px", height: "26px" }}
                  className={
                    props.entry.atom_id
                      ? classes.enabledIcon
                      : classes.disabledIcon
                  }
                />
              </IconButton>
            </Grid>
          </Tooltip>
          <Tooltip title="View the video in a new tab">
            <IconButton onClick={openInMediabrowser}>
              <LaunchIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </TableCell>
      <TableCell>
        <PlatformIndicator entry={props.entry} />
      </TableCell>
      <TableCell>
        {props.entry.mainstream_master?.publication_date ? (
          <Typography>
            <NiceDateFormatter
              date={props.entry.mainstream_master.publication_date}
            />
          </Typography>
        ) : (
          <Typography>(not published)</Typography>
        )}
      </TableCell>
      <TableCell>
        <OoovvuuSwitcher
          projectId={props.entry.deliverable.pluto_core_project_id.toString()}
          assetId={props.entry.id.toString()}
          content={props.entry.oovvuu_master}
          didUpdate={(newContent) => {
            const updatedRecord: DenormalisedDeliverable = Object.assign(
              {},
              props.entry,
              {
                oovvuu_master: newContent,
              }
            );
            setNotesUpdate((prev) => prev + 1);
            if (props.onRecordDidUpdate)
              props.onRecordDidUpdate(props.entry.id, updatedRecord);
          }}
        />
      </TableCell>
      <TableCell>
        <ReutersConnectSwitcher
          projectId={props.entry.deliverable.pluto_core_project_id.toString()}
          assetId={props.entry.id.toString()}
          content={props.entry.reutersconnect_master}
          didUpdate={(newContent) => {
            const updatedRecord: DenormalisedDeliverable = Object.assign(
              {},
              props.entry,
              {
                reutersconnect_master: newContent,
              }
            );
            setNotesUpdate((prev) => prev + 1);
            if (props.onRecordDidUpdate)
              props.onRecordDidUpdate(props.entry.id, updatedRecord);
          }}
        />
      </TableCell>
      <TableCell style={{ minWidth: "200px" }}>
        <SyndicationNotes
          deliverableId={props.entry.id}
          updateCounter={notesUpdate}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="contained"
          onClick={() =>
            history.push(
              `/project/${props.entry.deliverable.pluto_core_project_id}`
            )
          }
        >
          Bundle
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default DeliverablesDashEntry;
