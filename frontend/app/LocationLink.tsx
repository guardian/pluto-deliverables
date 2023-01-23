import React from "react";
import { Grid, IconButton, Link, Tooltip, Typography } from "@material-ui/core";
import { CloudUpload, FolderOpen } from "@material-ui/icons";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "@guardian/pluto-headers";

interface LocationLinkProps {
  bundleInfo: Project;
  networkUploadSelected: () => void;
}

const LocationLink: React.FC<LocationLinkProps> = (props) => {
  /**
   * Contacts the server to ensure that the dropfolder exists and then returns a promise
   * containing the dropfolder location
   */
  const verifyDropfolder = async () => {
    const response = await axios.get(
      `/api/bundle/${props.bundleInfo.pluto_core_project_id}/dropfolder`,
      {
        validateStatus: (code) => code === 404 || code === 200,
      }
    );
    switch (response.status) {
      case 200:
        const content = response.data as DropfolderStatus;
        return content.clientpath;
      case 404:
        SystemNotification.open(
          SystemNotifcationKind.Error,
          "Deliverable bundle has been deleted"
        );
        return undefined;
      default:
        throw `Unexpected status ${response.status} from server`;
    }
  };

  const localOpenSelected = async () => {
    try {
      const dropfolderLocation = await verifyDropfolder();
      if (dropfolderLocation) {
        window.open(`pluto:openfolder:${dropfolderLocation}`);
      }
    } catch (err) {
      console.error("Could not verify dropfolder location: ", err);
      SystemNotification.open(
        SystemNotifcationKind.Error,
        "Could not verify dropfolder, if Finder does not appear then contact multimediatech"
      );
      window.open(props.bundleInfo.local_open_uri);
    }
  };

  return (
    <Grid container spacing={3} style={{ width: "200px" }} alignItems="center">
      <Grid item xs={6}>
        <Typography>Add files:</Typography>
      </Grid>
      <Grid item xs={3}>
        <Tooltip title={`Open ${props.bundleInfo.local_path}`}>
          <IconButton onClick={localOpenSelected} id="local-open">
            <FolderOpen />
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid item xs={3}>
        <Tooltip title="Upload remotely, for when you don't have SAN access">
          <IconButton onClick={props.networkUploadSelected} id="remote-upload">
            <CloudUpload />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default LocationLink;
