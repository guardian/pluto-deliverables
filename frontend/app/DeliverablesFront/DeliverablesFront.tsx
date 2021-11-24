import React, { useState } from "react";
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

const useStyles = makeStyles({
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
    marginBottom: "2em",
  },
});

const DeliverablesFront: React.FC<{}> = () => {
  const [showFindPage, setShowFindPage] = useState(false);
  const [showFindDeliverable, setShowFindDeliverable] = useState(false);

  const [urlSearchValue, setUrlSearchValue] = useState("");
  const [urlSearchRunning, setUrlSearchRunning] = useState(false);

  const [delivSearchValue, setDelivSearchValue] = useState("");

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

  return (
    <>
      <Helmet>
        <title>Deliverables - PLUTO</title>
      </Helmet>
      <Typography variant="h2">Find a deliverable</Typography>

      <Paper elevation={3} className={classes.container}>
        <Typography variant="h6">
          Please click the option that you want to follow
        </Typography>
        <ul>
          <li
            className={clsx(classes.clickable, classes.item)}
            onClick={requestedFindPage}
          >
            <Typography>
              I want to find the deliverable for a page on the website
            </Typography>
            {showFindPage ? (
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
            ) : undefined}
          </li>

          <li
            className={clsx(classes.clickable, classes.item)}
            onClick={requestedFindDeliverable}
          >
            <Typography>
              I want to find a deliverable based on its title
            </Typography>
            {showFindDeliverable ? (
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
            ) : undefined}
          </li>

          <li
            className={clsx(classes.clickable, classes.item)}
            onClick={() => history.push("/dash")}
          >
            <Typography>I want to go to the dashboard</Typography>
          </li>
        </ul>
      </Paper>
    </>
  );
};

export default DeliverablesFront;
