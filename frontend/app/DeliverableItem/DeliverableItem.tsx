import React, { useEffect, useState } from "react";
import { RouteChildrenProps } from "react-router";
import { Helmet } from "react-helmet";
import { Grid, Link, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import { Movie } from "@material-ui/icons";
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
import GuardianMasterForm from "../Master/GuardianMasterForm";
import clsx from "clsx";
import YoutubeMasterForm from "../Master/YoutubeMasterForm";
import DailyMotionMasterForm from "../Master/DailyMotionMasterForm";

interface DeliverableItemParam {
  assetId: string;
}

const useStyles = makeStyles((theme) => ({
  fullWidth: {
    width: "100%",
  },
  basicMetadataBox: {
    padding: "1em",
    paddingLeft: "2em",
    paddingRight: "2em",
  },
  inlineIcon: {
    verticalAlign: "middle",
    marginRight: "0.6em",
  },
  sizedIcon: {
    width: "36px",
    height: "36px",
  },
  metaPanel: {
    flex: 1,
    maxWidth: "720px",
    minWidth: "220px",
  },
}));

const DeliverableItem: React.FC<RouteChildrenProps<DeliverableItemParam>> = (
  props
) => {
  const [deliverable, setDeliverable] = useState<
    DenormalisedDeliverable | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);

  const classes = useStyles();

  useEffect(() => {
    const loadDeliverable = async () => {
      if (props.match) {
        try {
          const response = await axios.get<DenormalisedDeliverable>(
            `/api/asset/${props.match.params.assetId}`
          );
          setDeliverable(response.data);
          setLoading(false);
        } catch (e) {
          SystemNotification.open(
            SystemNotifcationKind.Error,
            `Could not load deliverable, server error ${e}`
          );
          setLoading(false);
        }
      } else {
        setLoading(false);
        console.error(
          "Can't load the deliverable because `match` is not defined in `props`.",
          props
        );
      }
    };
    loadDeliverable();
  }, [props.match?.params]);

  return (
    <>
      <Helmet>
        <title>Deliverable item</title>
      </Helmet>

      <Grid container direction="row" className={classes.fullWidth} spacing={3}>
        <Grid item style={{ flexGrow: 1 }}>
          {deliverable ? (
            <iframe
              src={`/vs/embed/player?onlineId=${deliverable.online_item_id}&nearlineId=${deliverable.nearline_item_id}&archiveId=${deliverable.archive_item_id}`}
            />
          ) : undefined}
        </Grid>
        <Grid item>
          <Paper elevation={3} className={classes.basicMetadataBox}>
            <Typography variant="h6">
              <Movie className={classes.inlineIcon} />
              {deliverable?.filename}
            </Typography>
            <table>
              <tbody>
                <tr>
                  <td>Deliverable type</td>
                  <td>{deliverable?.type_string}</td>
                </tr>
                <tr>
                  <td>Atom ID</td>
                  <td>
                    {deliverable?.atom_id ? (
                      <a href={`not-implemented`}>{deliverable.atom_id}</a>
                    ) : (
                      <Typography variant="caption">
                        not from an atom
                      </Typography>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>{deliverable?.status_string}</td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td>{deliverable?.duration}</td>
                </tr>
                <tr>
                  <td>Size</td>
                  <td>{deliverable?.size}</td>
                </tr>
                <tr>
                  <td>File last modified</td>
                  <td>{deliverable?.modified_dt}</td>
                </tr>
                <tr>
                  <td>Deliverable last updated</td>
                  <td>{deliverable?.changed_dt}</td>
                </tr>
              </tbody>
            </table>
          </Paper>
        </Grid>
      </Grid>

      <Grid container direction="row" className={classes.fullWidth} spacing={3}>
        <Grid item className={classes.metaPanel}>
          <Paper elevation={3} className={classes.basicMetadataBox}>
            <Typography variant="h6">
              <img
                className={clsx(classes.inlineIcon, classes.sizedIcon)}
                src={
                  deliverable?.gnm_website_master
                    ? guardianEnabled
                    : guardianDisabled
                }
              />
              GNM Website
            </Typography>
            {deliverable?.gnm_website_master ? (
              <GuardianMasterForm
                master={deliverable.gnm_website_master}
                isReadOnly={true}
                isEditing={false}
                isDirty={false}
                onCommonMasterChanged={(evt, f) => {}}
                fieldChanged={(evt, f) => {}}
              />
            ) : (
              <Typography variant="caption">
                No GNM website data available for this item
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <Paper elevation={3} className={classes.basicMetadataBox}>
            <Typography variant="h6">
              <img
                className={clsx(classes.inlineIcon, classes.sizedIcon)}
                src={
                  deliverable?.youtube_master ? youtubeEnabled : youtubeDisabled
                }
              />
              Youtube
            </Typography>
            {deliverable?.youtube_master ? (
              <YoutubeMasterForm
                master={deliverable.youtube_master}
                isReadOnly={true}
                isEditing={false}
                isDirty={false}
                onCommonMasterChanged={(evt, f) => {}}
                fieldChanged={(evt, f) => {}}
              />
            ) : (
              <Typography variant="caption">
                No YouTube data available for this item
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <Paper elevation={3} className={classes.basicMetadataBox}>
            <Typography variant="h6">
              <img
                className={clsx(classes.inlineIcon, classes.sizedIcon)}
                src={
                  deliverable?.DailyMotion_master
                    ? dailymotionEnabled
                    : dailymotionDisabled
                }
              />
              Daily Motion
            </Typography>
            {deliverable?.DailyMotion_master ? (
              <DailyMotionMasterForm
                isEditing={false}
                master={deliverable.DailyMotion_master}
                isReadOnly={true}
                isDirty={false}
                checkboxChanged={(evt) => {}}
                channelSelectorChanged={(newValue) => {}}
                onCopyButton={() => {}}
                onCommonMasterChanged={(evt, field) => {}}
              />
            ) : (
              <Typography variant="caption">
                No Daily Motion data available for this item
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default DeliverableItem;
