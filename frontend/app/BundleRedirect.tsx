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

  const history = useHistory();
  const { bundleId } = useParams();

  useEffect(() => {
    axios
      .get(`/api/bundle/bybundleid/${bundleId}`)
      .then((response) => {
        setLoading(false);
        setBundle(response.data);
      })
      .catch((err) => {
        setLoading(false);
        if (err.response) {
          switch (err.response.status) {
            case 404:
              setLastError("This ID does not exist");
              break;
            case 500 | 502 | 503 | 504:
              setLastError(
                "Server is not responding correctly. Please wait a few seconds and then click Refresh"
              );
              break;
            default:
              setLastError(err.toString());
              break;
          }
        } else {
          setLastError(err.toString());
        }
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
            <>
              <Typography style={{ marginLeft: "0.6em" }}>
                {lastError}
              </Typography>
              <br />
              <span style={{ marginLeft: "auto", marginRight: "auto" }}>
                <a
                  href="#"
                  style={{ marginLeft: "0.6em", marginRight: "0.6em" }}
                  onClick={(evt) => {
                    evt.preventDefault();
                    history.goBack();
                  }}
                >
                  Go back
                </a>
                <a
                  href="#"
                  onClick={(evt) => {
                    evt.preventDefault();
                    document.location.reload();
                  }}
                >
                  Refresh
                </a>
              </span>
            </>
          ) : null}
        </Grid>
      </Grid>
    );
  }
};

export default BundleRedirect;
