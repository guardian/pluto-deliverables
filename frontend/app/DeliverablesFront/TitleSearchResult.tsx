import React, { useEffect, useState } from "react";
import { useStyles } from "./SearchResultStyles";
import { useHistory } from "react-router-dom";
import { Grid, Paper, Typography } from "@material-ui/core";
import clsx from "clsx";
import { MovieCreation } from "@material-ui/icons";
import { format } from "date-fns";
import NiceDateFormatter from "../Common/NiceDateFormatter";

interface TitleSearchResultProps {
  data: DeliverableSearchResponse;
  displayLimit: number;
}

const TitleSearchResult: React.FC<TitleSearchResultProps> = (props) => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <Paper elevation={1} className={classes.containerPaper}>
      <Typography>
        {props.data.count > props.displayLimit
          ? `Found a total of ${props.data.count} results, you might want to narrow it down a bit more. Showing the first ${props.displayLimit}`
          : `Found ${props.data.count} results`}
      </Typography>

      <Grid
        container
        direction="row"
        spacing={2}
        style={{ overflowX: "scroll" }}
      >
        {props.data.results.map((entry, idx) => (
          <Grid
            item
            key={idx}
            className={clsx(classes.itemTile, classes.clickable)}
            onClick={() => {
              history.push(`/item/${entry.id}`);
            }}
          >
            <Typography className={classes.tileCaption}>
              {entry.filename}
            </Typography>
            <MovieCreation className={classes.tileImage} />
            <NiceDateFormatter
              className={classes.tileCaption}
              date={entry.changed_dt}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TitleSearchResult;
