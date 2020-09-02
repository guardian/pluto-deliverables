import React, {useState} from "react";
import {Collapse, IconButton, TableCell, TableRow} from "@material-ui/core";
import DeliverableTypeSelector from "../DeliverableTypeSelector";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import MasterList from "../MasterList/MasterList";
import {ClassNameMap} from "@material-ui/core/styles/withStyles";
import axios from "axios";
import Cookies from "js-cookie";

interface DeliverableRowProps {
    deliverable: Deliverable;
    classes: ClassNameMap<string>;
    typeOptions: DeliverableTypes;
    parentBundleInfo?: Project;
    setCentralMessage:(msg:string)=>void;
    onCheckedUpdated:(isChecked:boolean)=>void;
    onNeedsUpdate:(assetId:bigint)=>void;
}

const DeliverableRow:React.FC<DeliverableRowProps> = (props) => {
    const [open, setOpen] = useState<boolean>(false);

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
                            console.log(
                                `checkbox ${props.deliverable.id} changed: ${evt.target.checked}`
                            );
                            props.onCheckedUpdated(evt.target.checked);
                        }}
                    />
                </TableCell>
                <TableCell>{props.deliverable.filename}</TableCell>
                <TableCell>{props.deliverable.version ?? "-"}</TableCell>
                <TableCell>{props.deliverable.size_string ?? "-"}</TableCell>
                <TableCell>{props.deliverable.duration ?? "-"}</TableCell>
                <TableCell>
                    <DeliverableTypeSelector
                        content={props.typeOptions}
                        showTip={true}
                        value={props.deliverable.type}
                        onChange={(newvalue) => updateItemType(props.deliverable.id, newvalue)}
                    />
                </TableCell>
                <TableCell>{props.deliverable.modified_dt}</TableCell>
                <TableCell>{props.deliverable.status_string}</TableCell>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => {
                            setOpen(!open);
                        }}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
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