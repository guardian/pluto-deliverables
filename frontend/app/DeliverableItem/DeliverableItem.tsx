import React, { useEffect, useState } from "react";
import { RouteChildrenProps } from "react-router";
import { Helmet } from "react-helmet";
import { Button, Grid, IconButton, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import { Add, Edit, Movie } from "@material-ui/icons";
import guardianEnabled from "../static/guardian_enabled.png";
import guardianDisabled from "../static/guardian_disabled.png";
import youtubeEnabled from "../static/youtube_enabled.png";
import youtubeDisabled from "../static/youtube_disabled.png";
import dailymotionEnabled from "../static/dailymotion_enabled.jpg";
import dailymotionDisabled from "../static/dailymotion_disabled.jpg";
import mainstreamEnabled from "../static/mainstream_enabled.png";
import mainstreamDisabled from "../static/mainstream_disabled.png";
import GuardianMasterForm from "../Master/GuardianMasterForm";
import clsx from "clsx";
import YoutubeMasterForm from "../Master/YoutubeMasterForm";
import DailyMotionMasterForm from "../Master/DailyMotionMasterForm";
import MainstreamMasterForm from "../Master/MainstreamMasterForm";
import { useHistory } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AddNoteDialog from "../DeliverablesDash/AddNoteDialog";

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
    maxWidth: "840px",
    minWidth: "550px",
    maxHeight: "496px",
  },
  attributionBox: {
    fontSize: "0.8em",
    height: "1rem",
    overflow: "hidden",
    textAlign: "right",
    textOverflow: "ellipsis",
    fontStyle: "italic",
  },
  playerFrame: {
    padding: "1em",
  },
  playerS: {
    width: "640px",
    height: "440px",
  },
  playerM: {
    width: "960px",
    height: "660px",
  },
  playerL: {
    width: "1280px",
    height: "880px",
  },
  playerX: {
    width: "1920px",
    height: "1320",
  },
}));

type PlayerSizing = "S" | "M" | "L" | "X";

const DeliverableItem: React.FC<RouteChildrenProps<DeliverableItemParam>> = (
  props
) => {
  const [deliverable, setDeliverable] = useState<
    DenormalisedDeliverable | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<SyndicationNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [playerSize, setPlayerSize] = useState<PlayerSizing>("S");

  const classes = useStyles();

  const history = useHistory();

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

  useEffect(() => {
    const loadNotes = async () => {
      if (props.match) {
        try {
          const response = await axios.get<SyndicationNoteResponse>(
            `/api/asset/${props.match.params.assetId}/notes?limit=100`
          );
          setNotes(response.data.results ?? []);
        } catch (err) {
          SystemNotification.open(
            SystemNotifcationKind.Error,
            `Could not load syndication notes: ${err}`
          );
        }
      }
    };

    loadNotes();
  }, [props.match?.params, reloadCounter]);

  const requestAddNote = () => setShowAddNote(true);

  const formatTime = (timeStr: string) => {
    try {
      const date = parseISO(timeStr);
      return format(date, "do MMM yy");
    } catch (e) {
      console.error("Could not parse time string ", timeStr, ": ", e);
      return "(invalid)";
    }
  };

  const saveAndClose = async (newNote: string) => {
    try {
      await axios.post(
        `/api/asset/${props.match?.params.assetId}/notes/new`,
        newNote,
        {
          headers: { "Content-Type": "text/plain" },
        }
      );
      setShowAddNote(false);
      setReloadCounter((prev) => prev + 1);
      SystemNotification.open(SystemNotifcationKind.Info, "Saved note");
    } catch (err) {
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Could not save your note: ${err}`
      );
    }
  };

  const classForSize = () => {
    switch (playerSize) {
      case "S":
        return classes.playerS;
      case "M":
        return classes.playerM;
      case "L":
        return classes.playerL;
      case "X":
        return classes.playerX;
    }
  };

  return (
    <>
      <Helmet>
        <title>Deliverable item</title>
      </Helmet>

      <Grid container direction="row" className={classes.fullWidth} spacing={3}>
        <Grid item style={{ flexGrow: 1 }}>
          {deliverable ? (
            <iframe
              className={clsx(classes.playerFrame, classForSize())}
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
                  <td>Player size</td>
                  <td>
                    <Grid container direction="row" spacing={1}>
                      <Grid item>
                        <Button
                          variant={playerSize == "S" ? "contained" : undefined}
                          onClick={() => setPlayerSize("S")}
                        >
                          S
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          variant={playerSize == "M" ? "contained" : undefined}
                          onClick={() => setPlayerSize("M")}
                        >
                          M
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          variant={playerSize == "L" ? "contained" : undefined}
                          onClick={() => setPlayerSize("L")}
                        >
                          L
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          variant={playerSize == "X" ? "contained" : undefined}
                          onClick={() => setPlayerSize("X")}
                        >
                          X
                        </Button>
                      </Grid>
                    </Grid>
                  </td>
                </tr>
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
            <Grid container justifyContent="space-between">
              <Grid item>
                <Typography variant="h6">Notes</Typography>
              </Grid>
              <Grid item>
                <IconButton onClick={requestAddNote}>
                  <Add />
                </IconButton>
              </Grid>
            </Grid>
            {notes.length === 0 ? (
              <Typography variant="caption">
                No notes present on this item
              </Typography>
            ) : (
              <Typography variant="caption">{notes.length} notes</Typography>
            )}
            <ul
              style={{
                overflowY: "auto",
                paddingRight: "1em",
                paddingLeft: "30px",
              }}
            >
              {notes.map((note, idx) => (
                <li key={idx}>
                  <Typography>{note.content}</Typography>
                  <Typography className={classes.attributionBox}>
                    {note.username} {formatTime(note.timestamp)}
                  </Typography>
                </li>
              ))}
            </ul>
          </Paper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <Paper elevation={3} className={classes.basicMetadataBox}>
            <Grid container justifyContent="space-between">
              <Grid item>
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
              </Grid>
              <Grid item>
                <IconButton
                  onClick={() =>
                    history.push(
                      `/project/${deliverable?.deliverable.pluto_core_project_id}/asset/${deliverable?.id}/atom`
                    )
                  }
                >
                  {deliverable?.gnm_website_master ? <Edit /> : <Add />}
                </IconButton>
              </Grid>
            </Grid>
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
            <Grid container justifyContent="space-between">
              <Grid item>
                <Typography variant="h6">
                  <img
                    className={clsx(classes.inlineIcon, classes.sizedIcon)}
                    src={
                      deliverable?.youtube_master
                        ? youtubeEnabled
                        : youtubeDisabled
                    }
                  />
                  Youtube
                </Typography>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={() =>
                    history.push(
                      `/project/${deliverable?.deliverable.pluto_core_project_id}/asset/${deliverable?.id}/youtube`
                    )
                  }
                >
                  {deliverable?.youtube_master ? <Edit /> : <Add />}
                </IconButton>
              </Grid>
            </Grid>
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
            <Grid container justifyContent="space-between">
              <Grid item>
                <Typography variant="h6">
                  <img
                    className={clsx(classes.inlineIcon, classes.sizedIcon)}
                    src={
                      deliverable?.mainstream_master
                        ? mainstreamEnabled
                        : mainstreamDisabled
                    }
                  />
                  Mainstream Media
                </Typography>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={() =>
                    history.push(
                      `/project/${deliverable?.deliverable.pluto_core_project_id}/asset/${deliverable?.id}/mainstream`
                    )
                  }
                >
                  {deliverable?.mainstream_master ? <Edit /> : <Add />}
                </IconButton>
              </Grid>
            </Grid>
            {deliverable?.mainstream_master ? (
              <MainstreamMasterForm
                isEditing={false}
                master={deliverable.mainstream_master}
                isReadOnly={true}
                isDirty={false}
                checkboxChanged={() => {}}
                onCopyButton={() => {}}
                onCommonMasterChanged={() => {}}
              />
            ) : (
              <Typography variant="caption">
                No Mainstream data available for this item
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <Paper elevation={3} className={classes.basicMetadataBox}>
            <Grid container justifyContent="space-between">
              <Grid item>
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
              </Grid>
              <Grid item>
                <IconButton
                  onClick={() =>
                    history.push(
                      `/project/${deliverable?.deliverable.pluto_core_project_id}/asset/${deliverable?.id}/dailymotion`
                    )
                  }
                >
                  {deliverable?.DailyMotion_master ? <Edit /> : <Add />}
                </IconButton>
              </Grid>
            </Grid>
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
      {showAddNote ? (
        <AddNoteDialog
          closeEntryNoSave={() => setShowAddNote(false)}
          saveAndClose={saveAndClose}
        />
      ) : undefined}
    </>
  );
};

export default DeliverableItem;
