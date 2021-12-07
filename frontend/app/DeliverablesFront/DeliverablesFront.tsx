import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import CapiSearchResult from "./CapiSearchResult";
import { ChevronRightRounded } from "@material-ui/icons";
import TitleSearchResult from "./TitleSearchResult";

const useStyles = makeStyles((theme) => ({
  clickable: {
    cursor: "pointer",
  },
  container: {
    width: "60%",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "2em",
    paddingRight: "2em",
    paddingTop: "1em",
    paddingBottom: "1em",
  },
  input: {
    width: "80%",
  },
  item: {
    padding: "0.8em",
    listStyle: "none",
    "&:hover": {
      backgroundColor:
        theme.palette.type === "dark"
          ? theme.palette.grey["700"]
          : theme.palette.grey["300"],
      borderRadius: "8px",
    },
  },
  inlineIcon: {
    verticalAlign: "top",
    marginRight: "4px",
  },
}));

const DeliverablesFront: React.FC<{}> = () => {
  const [showFindPage, setShowFindPage] = useState(false);
  const [showFindDeliverable, setShowFindDeliverable] = useState(false);

  const [urlSearchValue, setUrlSearchValue] = useState("");
  const [urlSearchRunning, setUrlSearchRunning] = useState(false);
  const [urlSearchResult, setUrlSearchResult] = useState<
    CapiSearchResponse | undefined
  >(undefined);

  const [delivSearchValue, setDelivSearchValue] = useState("");
  const [delivSearchResult, setDelivSearchResult] = useState<
    DeliverableSearchResponse | undefined
  >(undefined);

  const titleSearchLimit = 10;
  const classes = useStyles();

  const requestedFindPage = () => {
    setShowFindPage(true);
    setShowFindDeliverable(false);
  };

  const requestedFindDeliverable = () => {
    setShowFindDeliverable(true);
    setShowFindPage(false);
  };

  const history = useHistory();

  useEffect(() => {
    const runUrlSearch = async () => {
      setUrlSearchRunning(true);
      try {
        const response = await axios.get<CapiSearchResponse>(
          `/api/capiscan?url=${encodeURIComponent(urlSearchValue)}`
        );
        setUrlSearchRunning(false);
        setUrlSearchResult(response.data);
      } catch (err) {
        setUrlSearchRunning(false);
        console.error(`Could not search CAPI for ${urlSearchValue}: `, err);
        SystemNotification.open(
          SystemNotifcationKind.Error,
          "Could not perform the search."
        );
      }
    };

    if (urlSearchValue == "") {
      setUrlSearchRunning(false);
      setUrlSearchResult(undefined);
    } else {
      runUrlSearch();
    }
  }, [urlSearchValue]);

  useEffect(() => {
    const runTitleSearch = async () => {
      setUrlSearchRunning(true);
      try {
        const response = await axios.post<DeliverableSearchResponse>(
          `/api/asset/search?limit=${titleSearchLimit}`,
          { title: delivSearchValue },
          { headers: { "Content-Type": "application/json" } }
        );
        setUrlSearchRunning(false);
        setDelivSearchResult(response.data);
      } catch (err) {
        setUrlSearchRunning(false);
        console.error(
          `Could not search deliverables for ${delivSearchValue}: `,
          err
        );
        SystemNotification.open(
          SystemNotifcationKind.Error,
          "Could not perform the search"
        );
      }
    };

    if (delivSearchValue == "") {
      setUrlSearchRunning(false);
      setDelivSearchResult(undefined);
    } else {
      runTitleSearch();
    }
  }, [delivSearchValue]);

  return (
    <>
      <Helmet>
        <title>Deliverables - PLUTO</title>
      </Helmet>
      <Typography variant="h2">Find a deliverable</Typography>

      <Paper elevation={3} className={classes.container}>
        <Typography variant="h6">
          Please click the option that you want to follow:
        </Typography>
        <ul>
          <li
            className={clsx(classes.clickable, classes.item)}
            onClick={requestedFindPage}
          >
            <Typography>
              <ChevronRightRounded className={classes.inlineIcon} />I want to
              find the deliverable for a page on the website
            </Typography>
            {showFindPage ? (
              <>
                <Grid container justifyContent="space-between">
                  <Grid item style={{ flexGrow: 1 }}>
                    <TextField
                      onChange={(evt) => setUrlSearchValue(evt.target.value)}
                      className={classes.input}
                      value={urlSearchValue}
                      label="Paste the page URL here"
                    />
                  </Grid>
                  <Grid item>
                    {urlSearchRunning ? <CircularProgress /> : undefined}
                  </Grid>
                </Grid>
                {urlSearchResult ? (
                  <CapiSearchResult data={urlSearchResult} />
                ) : undefined}
              </>
            ) : undefined}
          </li>

          <li
            className={clsx(classes.clickable, classes.item)}
            onClick={requestedFindDeliverable}
          >
            <Typography>
              <ChevronRightRounded className={classes.inlineIcon} />I want to
              find a deliverable based on its title
            </Typography>
            {showFindDeliverable ? (
              <>
                <Grid container justifyContent="space-between">
                  <Grid item style={{ flexGrow: 1 }}>
                    <TextField
                      className={classes.input}
                      label="Deliverable name"
                      onChange={(evt) => setDelivSearchValue(evt.target.value)}
                      value={delivSearchValue}
                    />
                  </Grid>
                  <Grid item>
                    {urlSearchRunning ? <CircularProgress /> : undefined}
                  </Grid>
                </Grid>
                {delivSearchResult ? (
                  <TitleSearchResult
                    data={delivSearchResult}
                    displayLimit={titleSearchLimit}
                  />
                ) : undefined}
              </>
            ) : undefined}
          </li>

          <li
            className={clsx(classes.clickable, classes.item)}
            onClick={() => history.push("/dash")}
          >
            <Typography>
              <ChevronRightRounded className={classes.inlineIcon} />I want to
              browse what's available, take me to the dashboard &gt;
            </Typography>
          </li>
        </ul>
      </Paper>
    </>
  );
};

export default DeliverablesFront;
