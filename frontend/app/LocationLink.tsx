import React, { useEffect, useState } from "react";
import {Typography, Link, Grid, Tooltip, IconButton} from "@material-ui/core";
import {CloudUpload, FolderOpen} from "@material-ui/icons";

interface LocationLinkProps {
  bundleInfo: Project;
  networkUploadSelected: ()=>void;
}

const LocationLink: React.FC<LocationLinkProps> = (props) => {

  return (
      <Grid container spacing={3} style={{width: "200px"}} alignItems="center">
          <Grid item xs={6}><Typography>Add files:</Typography></Grid>
          <Grid item xs={3}>
              <Tooltip title={`Open ${props.bundleInfo.local_path}`}>
                  <Link href={props.bundleInfo.local_path}>
                    <IconButton><FolderOpen/></IconButton>
                  </Link>
              </Tooltip>
          </Grid>
          <Grid item xs={3}>
              <Tooltip title="Upload remotely, for when you don't have SAN access">
                  <IconButton onClick={props.networkUploadSelected}><CloudUpload/></IconButton>
              </Tooltip>
          </Grid>
      </Grid>
  );
};

export default LocationLink;
