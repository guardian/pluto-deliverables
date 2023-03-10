import React from "react";
import { Grid, Tooltip } from "@material-ui/core";
import guardianEnabled from "../static/guardian_enabled.png";
import guardianDisabled from "../static/guardian_disabled.png";
import youtubeEnabled from "../static/youtube_enabled.png";
import youtubeDisabled from "../static/youtube_disabled.png";
import dailymotionEnabled from "../static/dailymotion_enabled.jpg";
import dailymotionDisabled from "../static/dailymotion_disabled.jpg";
import mainstreamEnabled from "../static/mainstream_enabled.png";
import mainstreamDisabled from "../static/mainstream_disabled.png";
import oovvuuDisabled from "../static/oovvuu_disabled.png";
import oovvuuEnabled from "../static/oovvuu_enabled.png";
import reutersDisabled from "../static/reuters_disabled.png";
import reutersEnabled from "../static/reuters_enabled.png";

import { makeStyles } from "@material-ui/core/styles";

interface PlatformIndicatorProps {
  entry: DenormalisedDeliverable;
}

const useStyles = makeStyles((theme) => ({
  inlineIcon: {
    width: "26px",
    height: "26px",
  },
}));

const PlatformIndicator: React.FC<PlatformIndicatorProps> = (props) => {
  const { entry } = props;
  const classes = useStyles();

  return (
    <Grid container direction="row" spacing={2}>
      <Grid item>
        <Tooltip
          title={
            entry.gnm_website_master
              ? "This has been published to the website"
              : "This has not been published to the website"
          }
        >
          <img
            className={classes.inlineIcon}
            src={entry.gnm_website_master ? guardianEnabled : guardianDisabled}
            alt="G"
          />
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip
          title={
            entry.youtube_master
              ? "This has Youtube information"
              : "This has not been published to Youtube"
          }
        >
          <img
            className={classes.inlineIcon}
            src={entry.youtube_master ? youtubeEnabled : youtubeDisabled}
            alt="Y"
          />
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip
          title={
            entry.DailyMotion_master
              ? "This has Daily Motion information"
              : "This has not been published to Daily Motion"
          }
        >
          <img
            className={classes.inlineIcon}
            src={
              entry.DailyMotion_master
                ? dailymotionEnabled
                : dailymotionDisabled
            }
            alt="D"
          />
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip
          title={
            entry.mainstream_master
              ? "This has Mainstream information"
              : "This has not been published to Mainstream"
          }
        >
          <img
            className={classes.inlineIcon}
            src={
              entry.mainstream_master ? mainstreamEnabled : mainstreamDisabled
            }
            alt="M"
          />
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip
          title={
            entry.oovvuu_master?.seen_on_channel
              ? "This has been seen on Oovvuu"
              : "This has not been seen on Oovvuu"
          }
        >
          <img
            className={classes.inlineIcon}
            src={
              entry.oovvuu_master?.seen_on_channel
                ? oovvuuEnabled
                : oovvuuDisabled
            }
            alt="O"
          />
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip
          title={
            entry.reutersconnect_master?.seen_on_channel
              ? "This has been seen on Reuters Connect"
              : "This has not been seen on Reuters Connect"
          }
        >
          <img
            className={classes.inlineIcon}
            src={
              entry.reutersconnect_master?.seen_on_channel
                ? reutersEnabled
                : reutersDisabled
            }
            alt="R"
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default PlatformIndicator;
