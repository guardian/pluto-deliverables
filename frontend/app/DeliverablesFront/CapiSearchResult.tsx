import React from "react";
import { Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { WarningRounded } from "@material-ui/icons";
import clsx from "clsx";
import { useHistory } from "react-router-dom";

interface CapiSearchResultProps {
  data: CapiSearchResponse;
}

const useStyles = makeStyles((theme) => ({
  itemTile: {
    width: "160px",
    height: "150px",
    overflow: "hidden",
    padding: "20px",
  },
  clickable: {
    cursor: "pointer",
  },
  tileCaption: {
    fontSize: "0.9em",
    width: "160px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  tileImage: {
    width: "140px",
    height: "80px",
    marginLeft: "auto",
    marginRight: "auto",
    overflow: "hidden",
  },
  containerPaper: {
    marginTop: "1em",
    paddingTop: "0.2em",
    padding: "1em",
  },
  warning: {
    fontSize: "0.9em",
    color: theme.palette.error.dark,
  },
}));

const CapiSearchResult: React.FC<CapiSearchResultProps> = (props) => {
  const classes = useStyles();

  const history = useHistory();
  return (
    <Paper elevation={1} className={classes.containerPaper}>
      {props.data.status === "ok" ? (
        <Typography>
          Found page &quot;{props.data.webTitle}&quot;. Click an atom below to
          go to that deliverable
        </Typography>
      ) : (
        <Typography>
          That page is not a valid video atom: {props.data.detail}
        </Typography>
      )}
      <Grid
        container
        direction="row"
        spacing={2}
        style={{ overflow: "scroll" }}
      >
        {props.data.atoms.map((atom, idx) => (
          <Grid
            item
            key={idx}
            className={clsx(
              classes.itemTile,
              atom.deliverable ? classes.clickable : undefined
            )}
            onClick={() => {
              if (atom.deliverable) history.push(atom.deliverable);
            }}
          >
            <Typography className={classes.tileCaption}>
              {atom.atomTitle}
            </Typography>
            <img
              src={atom.image}
              alt="Video holding image"
              className={classes.tileImage}
            />
            {atom.deliverable ? undefined : (
              <Typography className={classes.warning}>
                <WarningRounded style={{ verticalAlign: "middle" }} />
                No deliverable
              </Typography>
            )}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default CapiSearchResult;
