import React, { useEffect, useState } from "react";
import { Typography, Link } from "@material-ui/core";

interface LocationLinkProps {
  bundleInfo: Project;
}

const LocationLink: React.FC<LocationLinkProps> = (props) => {
  console.log(props.bundleInfo);
  return (
    <Typography>
      location:{" "}
      <Link href={props.bundleInfo.local_open_uri}>
        {props.bundleInfo.local_path}
      </Link>
    </Typography>
  );
};

export default LocationLink;
