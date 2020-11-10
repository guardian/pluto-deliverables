import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { makeStyles } from "@material-ui/core/styles";
import { Helmet } from "react-helmet";
import AssetSearchControls from "./AssetSearch/AssetSearchControls";

const useStyles = makeStyles({});

const AssetSearchComponent: React.FC<RouteComponentProps> = (props) => {
  const [searchParams, setSearchParams] = useState<AssetSearchFilter>({});

  return (
    <>
      <Helmet>
        <title>Search for deliverables</title>
      </Helmet>
      <h2>Search for deliverables</h2>
      <div id="controls-area">
        <AssetSearchControls
          values={searchParams}
          onChange={(newValues) => setSearchParams(newValues)}
        />
      </div>
    </>
  );
};

export default AssetSearchComponent;
