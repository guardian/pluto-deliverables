import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { makeStyles } from "@material-ui/core/styles";
import { Helmet } from "react-helmet";
import AssetSearchControls from "./AssetSearch/AssetSearchControls";
import AssetSearchResults from "./AssetSearch/AssetSearchResults";

const useStyles = makeStyles({});

const AssetSearchComponent: React.FC<RouteComponentProps> = (props) => {
  const [searchParams, setSearchParams] = useState<AssetSearchFilter>({});
  const [resultsLimit, setResultsLimit] = useState(100);

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
        <div id="results-area">
            <AssetSearchResults resultsLimit={resultsLimit} filter={searchParams}/>
        </div>
    </>
  );
};

export default AssetSearchComponent;
