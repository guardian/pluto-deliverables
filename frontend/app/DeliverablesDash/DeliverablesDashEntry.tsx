import React from "react";
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

//import globals that were set by the backend
declare var mediaAtomToolUrl: string;
declare var archiverHunterURL: string;

interface DeliverablesDashEntryProps {
  entry: DenormalisedDeliverable;
  commissionFilterRequested: (commissionId?: number) => void;
  currentCommissionFilter?: number;
  projectFilterRequested: (projectId?: number) => void;
  currentProjectFilter?: number;
  onOovvuuChanged: (delivId: bigint, newValue: boolean) => void;
  onReutersChanged: (delivId: bigint, newValue: boolean) => void;
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

  const commissionFilterChanged = () => {
    if (props.currentCommissionFilter) {
      props.commissionFilterRequested(undefined);
    } else {
      props.commissionFilterRequested(props.entry.deliverable.commission_id);
    }
  };

  const history = useHistory();

  const goToAtom = () => {};

  /*
                    const targetUrl = props.deliverable.online_item_id
                  ? `/vs/item/${props.deliverable.online_item_id}`
                  : `${archiverHunterURL}${encodeURIComponent(
                      props.deliverable.archive_item_id as string
                    )}`;
                window.open(targetUrl, "_blank");
     */
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

  return (
    <TableRow>
      <TableCell>
        {props.entry.gnm_website_master?.website_title ? (
          <Typography>
            {props.entry.gnm_website_master.website_title}
          </Typography>
        ) : undefined}
        <Typography>{props.entry.filename}</Typography>
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
        <Tooltip title="Indicate that this has been sent to Oovvuu. Not implemented yet.">
          <Switch
            onChange={(evt, checked) =>
              props.onOovvuuChanged(props.entry.id, checked)
            }
            checked={false}
          />
        </Tooltip>
      </TableCell>
      <TableCell>
        <Tooltip title="Indicate that this has been sent to Reuters Connect. Not implemented yet.">
          <Switch
            onChange={(evt, checked) =>
              props.onReutersChanged(props.entry.id, checked)
            }
            checked={false}
          />
        </Tooltip>
      </TableCell>
      <TableCell style={{minWidth: "200px"}}>
        <SyndicationNotes deliverableId={props.entry.id}/>
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
