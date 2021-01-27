import React, { useState, useEffect } from "react";
import { TableCell, TableRow, Button } from "@material-ui/core";
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

const InvalidRow: React.FC<DeliverableRowProps> = (props) => {
  const [parentBundleInfo, setParentBundleInfo] = useState<Project | undefined>(
    undefined
  );

  useEffect(() => {
    loadParentBundle();
  }, []);

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
        <TableCell>{props.deliverable.type_string}</TableCell>
        <TableCell>{props.deliverable.status_string}</TableCell>
        <TableCell>
          <div style={{ width: "322px" }}>
            <div style={{ float: "left", width: "160px" }}>
              {props.deliverable.job_id ? (
                <Button
                  variant="contained"
                  color="primary"
                  target="_blank"
                  href={`/vs-jobs/job/${props.deliverable.job_id}`}
                >
                  JOB
                </Button>
              ) : (
                <Button variant="contained" disabled>
                  JOB
                </Button>
              )}
            </div>
            <div style={{ float: "left", width: "160px" }}>
              {props.deliverable.deliverable ? (
                <Button
                  variant="contained"
                  color="secondary"
                  target="_blank"
                  href={`/deliverables/bundle/${props.deliverable.deliverable}`}
                >
                  BUNDLE
                </Button>
              ) : (
                <Button variant="contained" disabled>
                  BUNDLE
                </Button>
              )}
            </div>
            <div
              style={{
                float: "left",
                width: "160px",
                clear: "left",
                marginTop: "10px",
              }}
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
                  DROPFOLDER
                </Button>
              ) : (
                <Button variant="contained" disabled>
                  DROPFOLDER
                </Button>
              )}
            </div>
            <div style={{ float: "left", width: "160px", marginTop: "10px" }}>
              {props.deliverable.online_item_id ? (
                <Button
                  variant="contained"
                  color="secondary"
                  target="_blank"
                  href={`/vs/item/${props.deliverable.online_item_id}`}
                >
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
