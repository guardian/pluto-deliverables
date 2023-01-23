import React, { useEffect, useState } from "react";
import { RouteChildrenProps } from "react-router";
import { Helmet } from "react-helmet";
import {
  Button,
  Grid,
  IconButton,
  Link,
  Omit,
  Paper,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "@guardian/pluto-headers";
import {
  Add,
  Cancel,
  ChevronRight,
  ChevronRightRounded,
  Edit,
  Movie,
  Refresh,
} from "@material-ui/icons";
import guardianEnabled from "../static/guardian_enabled.png";
import guardianDisabled from "../static/guardian_disabled.png";
import dailymotionEnabled from "../static/dailymotion_enabled.jpg";
import dailymotionDisabled from "../static/dailymotion_disabled.jpg";
import GuardianMasterForm from "../Master/GuardianMasterForm";
import clsx from "clsx";
import YoutubeMasterForm from "../Master/YoutubeMasterForm";
import DailyMotionMasterForm from "../Master/DailyMotionMasterForm";
import MainstreamMasterForm from "../Master/MainstreamMasterForm";
import { useHistory } from "react-router-dom";
import { format, parseISO } from "date-fns";
import AddNoteDialog from "../DeliverablesDash/AddNoteDialog";
import { requestResync } from "../utils/master-api-service";

interface DeliverableItemParam {
  assetId: string;
}

import { useStyles } from "./DeliverableItemStyles";
import EmbeddableYTForm from "./EmbeddableYTForm";
import ErrorCatchingWrapper from "./ErrorCatchingWrapper";
import EmbeddableMSForm from "./EmbeddableMSForm";
import EmbeddableDMForm from "./EmbeddableDMForm";

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

  const [editingMS, setEditingMS] = useState(false);
  const [editingDM, setEditingDM] = useState(false);

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
                  <td>Related deliverables</td>
                  <td>
                    {deliverable?.deliverable ? (
                      <Button
                        endIcon={<ChevronRightRounded />}
                        onClick={() =>
                          history.push(
                            `/project/${deliverable?.deliverable.pluto_core_project_id}`
                          )
                        }
                      >
                        Go to bundle
                      </Button>
                    ) : undefined}
                  </td>
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
            </Grid>
            <Grid
              container
              direction="column"
              spacing={1}
              style={{ marginTop: "12px" }}
            >
              {" "}
              {/* marginTop makes up for the lack of an icon button*/}
              {deliverable?.gnm_website_master ? (
                <Grid item>
                  <GuardianMasterForm
                    master={deliverable.gnm_website_master}
                    isReadOnly={true}
                    isEditing={false}
                    isDirty={false}
                    onCommonMasterChanged={(evt, f) => {}}
                    fieldChanged={(evt, f) => {}}
                  />
                </Grid>
              ) : (
                <>
                  <Grid item>
                    <Typography variant="caption">
                      No GNM website data available for this item. This means
                      that it has not been published to the website, which must
                      be done through the Media Atom tool at{" "}
                      <Link href="https://video.gutools.co.uk">
                        https://video.gutools.co.uk
                      </Link>
                      .
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="caption">
                      Please email multimediatech at theguardian.com for more
                      information.
                    </Typography>
                  </Grid>
                </>
              )}
              {deliverable && deliverable.deliverable ? (
                <Grid item>
                  <Button
                    onClick={() =>
                      requestResync(
                        deliverable.deliverable.pluto_core_project_id.toString(),
                        deliverable.id.toString()
                      )
                    }
                    startIcon={<Refresh />}
                  >
                    Resync
                  </Button>
                </Grid>
              ) : undefined}
            </Grid>
          </Paper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <ErrorCatchingWrapper>
            {deliverable ? (
              <EmbeddableYTForm
                content={deliverable?.youtube_master}
                deliverableId={deliverable?.id}
                bundleId={deliverable?.deliverable.pluto_core_project_id}
                didUpdate={(newValue) =>
                  setDeliverable((prevValue) =>
                    Object.assign({}, prevValue, { youtube_master: newValue })
                  )
                }
              />
            ) : undefined}
          </ErrorCatchingWrapper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <ErrorCatchingWrapper>
            {deliverable ? (
              <EmbeddableMSForm
                content={deliverable?.mainstream_master}
                deliverableId={deliverable?.id}
                bundleId={deliverable?.deliverable.pluto_core_project_id}
                copySource={deliverable?.youtube_master}
                didUpdate={(newValue) =>
                  setDeliverable((prevValue) =>
                    Object.assign({}, prevValue, {
                      mainstream_master: newValue,
                    })
                  )
                }
              />
            ) : undefined}
          </ErrorCatchingWrapper>
        </Grid>

        <Grid item className={classes.metaPanel}>
          <ErrorCatchingWrapper>
            {deliverable ? (
              <EmbeddableDMForm
                content={deliverable?.DailyMotion_master}
                deliverableId={deliverable?.id}
                bundleId={deliverable?.deliverable.pluto_core_project_id}
                copySource={deliverable?.youtube_master}
                didUpdate={(newValue) =>
                  setDeliverable((prevValue) =>
                    Object.assign({}, prevValue, {
                      DailyMotion_master: newValue,
                    })
                  )
                }
              />
            ) : undefined}
          </ErrorCatchingWrapper>
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
