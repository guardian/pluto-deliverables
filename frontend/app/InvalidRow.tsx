import React, { useState, useEffect } from "react";
import {
  TableCell,
  TableRow,
  Button,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { ClassNameMap } from "@material-ui/core/styles/withStyles";
import axios from "axios";
import DateTimeFormatter from "./Form/DateTimeFormatter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAtom } from "@fortawesome/free-solid-svg-icons";
import BundleInfoComponentForInvalid from "./BundleInfoComponentForInvalid";

interface DeliverableRowProps {
  deliverable: Deliverable;
  classes: ClassNameMap<string>;
}

const useStyles = makeStyles({
  buttonGrid: {
    display: "grid",
    gridTemplateRows: "repeat(2, 50%)",
    gridTemplateColumns: "repeat(2, 50%)",
    minWidth: "280px",
    minHeight: "100px",
  },
  buttonContainer: {
    padding: "4px",
    display: "grid",
  },
});

const InvalidRow: React.FC<DeliverableRowProps> = (props) => {
  const [parentBundleInfo, setParentBundleInfo] = useState<Project | undefined>(
    undefined
  );

  useEffect(() => {
    loadParentBundle();
  }, [props.deliverable]);

  const loadParentBundle = async () => {
    try {
      const response = await axios.get(
        `/api/bundle/bybundleid/${props.deliverable.deliverable}`
      );
      return setParentBundleInfo(response.data);
    } catch (err) {
      console.error("Could not load in parent bundle data: ", err);
    }
  };

  const classes = useStyles();

  return (
    <TableRow className={props.classes.root}>
      <TableCell>
        <Typography>
          {props.deliverable.filename}
          {parentBundleInfo ? (
            <BundleInfoComponentForInvalid
              bundleName={parentBundleInfo.project_id}
              projectId={parentBundleInfo.pluto_core_project_id}
              commissionId={parentBundleInfo.commission_id}
              spacing={0}
            />
          ) : null}
        </Typography>
      </TableCell>
      <TableCell>
        {props.deliverable.atom_id ? (
          <FontAwesomeIcon icon={faAtom} size="2x" />
        ) : null}
      </TableCell>
      <TableCell>
        <DateTimeFormatter value={props.deliverable.modified_dt} />
      </TableCell>
      <TableCell>{props.deliverable.type_string}</TableCell>
      <TableCell>{props.deliverable.status_string}</TableCell>
      <TableCell>
        <div className={classes.buttonGrid}>
          <div
            className={classes.buttonContainer}
            style={{ gridColumnStart: 1, gridRowStart: 1 }}
          >
            <Button
              variant="contained"
              color="primary"
              target="_blank"
              href={`/vs-jobs/job/${props.deliverable.job_id}`}
              disabled={props.deliverable.job_id ? false : true}
            >
              Job
            </Button>
          </div>
          <div
            className={classes.buttonContainer}
            style={{ gridColumnStart: 2, gridRowStart: 1 }}
          >
            <Button
              variant="contained"
              color="secondary"
              target="_blank"
              href={`/deliverables/bundle/${props.deliverable.deliverable}`}
              disabled={props.deliverable.deliverable ? false : true}
            >
              Bundle
            </Button>
          </div>
          <div
            className={classes.buttonContainer}
            style={{ gridColumnStart: 1, gridRowStart: 2 }}
          >
            {props.deliverable.absolute_path ? (
              <Button
                variant="contained"
                color="primary"
                target="_blank"
                href={`pluto:openfolder:${props.deliverable.absolute_path.replace(
                  props.deliverable.filename,
                  ""
                )}`}
              >
                DropFolder
              </Button>
            ) : (
              <Button variant="contained" disabled>
                DropFolder
              </Button>
            )}
          </div>
          <div
            className={classes.buttonContainer}
            style={{ gridColumnStart: 2, gridRowStart: 2 }}
          >
            <Button
              variant="contained"
              color="secondary"
              target="_blank"
              href={`/vs/item/${props.deliverable.online_item_id}`}
              disabled={props.deliverable.online_item_id ? false : true}
            >
              Media Asset
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default InvalidRow;
