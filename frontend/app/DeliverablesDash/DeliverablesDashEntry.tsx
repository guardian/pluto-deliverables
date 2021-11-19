import React from "react";
import {Grid, IconButton, TableCell, TableRow, Tooltip, Typography} from "@material-ui/core";
import LaunchIcon from "@material-ui/icons/Launch";
// @ts-ignore
import atomIcon from "../static/atom_icon.svg";
import ShowCommission from "../PlutoCore/ShowCommission";
import ShowProject from "../PlutoCore/ShowProject";
import {SystemNotifcationKind, SystemNotification} from "pluto-headers";
import {makeStyles} from "@material-ui/core/styles";
import NiceDateFormatter from "../Common/NiceDateFormatter";

//import globals that were set by the backend
declare var mediaAtomToolUrl: string;
declare var archiverHunterURL: string;

interface DeliverablesDashEntryProps {
    entry: DenormalisedDeliverable;
    commissionFilterRequested: (commissionId?:number)=>void;
    currentCommissionFilter?: number;
    projectFilterRequested: (projectId?:number)=>void;
    currentProjectFilter?: number;
}

const useStyles = makeStyles({
    disabledIcon: {
        opacity: "50%"
    },
    enabledIcon: {
        opacity: "100%"
    }
});

const DeliverablesDashEntry:React.FC<DeliverablesDashEntryProps> = (props) => {
    const classes = useStyles();

    const commissionFilterChanged = ()=>{
        if(props.currentCommissionFilter) {
            props.commissionFilterRequested(undefined);
        } else {
            props.commissionFilterRequested(props.entry.deliverable.commission_id)
        }
    }

    const goToAtom = () => {

    }

    /*
                    const targetUrl = props.deliverable.online_item_id
                  ? `/vs/item/${props.deliverable.online_item_id}`
                  : `${archiverHunterURL}${encodeURIComponent(
                      props.deliverable.archive_item_id as string
                    )}`;
                window.open(targetUrl, "_blank");
     */
    const openInMediabrowser = ()=>{
        if(props.entry.online_item_id) {
            window.open(`/vs/item/${props.entry.online_item_id}`, "_blank");
        } else if(props.entry.archive_item_id) {
            window.open(`${archiverHunterURL}${encodeURIComponent(props.entry.archive_item_id)}`, "_blank");
        } else {
            SystemNotification.open(SystemNotifcationKind.Warning,"Sorry we can't view this item at present. Please report this to multimediatech.");
        }
    }

    return <TableRow>
        <TableCell>
            {props.entry.gnm_website_master?.website_title ? <Typography>{props.entry.gnm_website_master.website_title}</Typography> : undefined }
            <Typography>{props.entry.filename}</Typography>
        </TableCell>
        <TableCell style={{minWidth: "250px", maxWidth: "500px"}}>
            { props.entry.gnm_website_master?.publication_date ?
                <Typography>Published on <NiceDateFormatter date={props.entry.gnm_website_master.publication_date}/></Typography> :
                <Typography>(not published)</Typography>
            }
            <Typography>Last updated <NiceDateFormatter date={props.entry.changed_dt}/></Typography>
        </TableCell>
        <TableCell>
            {/*<Grid container>*/}
            {/*    <Grid item>*/}
            {/*        <IconButton onClick={commissionFilterChanged}>*/}
            {/*            <Search/>*/}
            {/*        </IconButton>*/}
            {/*    </Grid>*/}
            {/*    <Grid item>*/}
                    <ShowCommission commissionId={props.entry.deliverable.commission_id}/>
            {/*    </Grid>*/}
            {/*</Grid>*/}
        </TableCell>
        <TableCell>
            <ShowProject projectId={props.entry.deliverable.pluto_core_project_id}/>
        </TableCell>
        <TableCell>
            <Typography>{props.entry.type_string}</Typography>
        </TableCell>
        <TableCell style={{minWidth: "150px", maxWidth: "500px"}}>
            <Grid container>
                <Tooltip title={props.entry.atom_id ? "This deliverable came from the Atom Tool. Click here to view the original atom" : "This deliverable did not come from the Atom Tool"}>
                <Grid item>
                    <IconButton onClick={goToAtom} disabled={!props.entry.atom_id}>
                        <img
                            src={atomIcon}
                            alt="atom"
                            style={{ width: "26px", height: "26px" }}
                            className={props.entry.atom_id ? classes.enabledIcon : classes.disabledIcon}
                        />
                    </IconButton>
                </Grid>
                </Tooltip>
                <Tooltip title="View the video in a new tab">
                    <IconButton onClick={openInMediabrowser}>
                        <LaunchIcon/>
                    </IconButton>
                </Tooltip>
            </Grid>
        </TableCell>
    </TableRow>
}

export default DeliverablesDashEntry;