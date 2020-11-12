import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  RouteComponentProps,
  useHistory,
  useLocation,
  useParams,
  Redirect,
} from "react-router-dom";
import { CircularProgress, Grid, Typography } from "@material-ui/core";

const BundleRedirect: React.FC<RouteComponentProps> = (props) => {
  const [bundle, setBundle] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const { bundleId } = useParams();

  useEffect(() => {
    axios
      .get(`/api/bundle/${bundleId}`)
      .then((response) => {
        setLoading(false);
        setBundle(response.data);
      })
      .catch((err) => {
        setLoading(false);
        setLastError(err.toString());
      });
  }, []);

  if (bundle) {
    return <Redirect to={`/project/${bundle.pluto_core_project_id}`} />;
  } else {
    return (
      <Grid container justify="space-around">
        <Grid item xs={4}>
          {loading ? <CircularProgress /> : null}
          {lastError ? (
            <Typography style={{ marginLeft: "0.6em" }}>{lastError}</Typography>
          ) : null}
        </Grid>
      </Grid>
    );
  }
};

export default BundleRedirect;
