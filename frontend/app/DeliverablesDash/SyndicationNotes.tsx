import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import {
  SystemNotifcationKind,
  SystemNotification,
} from "@guardian/pluto-headers";
import { Grid, IconButton, Typography } from "@material-ui/core";
import { format, parseISO } from "date-fns";
import AddIcon from "@material-ui/icons/Add";
import ShowAllSelector from "./ShowAllSelector";
import clsx from "clsx";
import AddNoteDialog from "./AddNoteDialog";

interface SyndicationNotesProps {
  deliverableId: bigint;
  initialMax?: number;
  updateCounter?: number; //increment to trigger an update
}

const useStyles = makeStyles((theme) => ({
  basicList: {
    listStyle: "none",
    paddingLeft: "0",
  },
  contentBox: {
    fontSize: "0.9em",
  },
  attributionBox: {
    fontSize: "0.8em",
    height: "1rem",
    overflow: "hidden",
    textAlign: "right",
    textOverflow: "ellipsis",
    fontStyle: "italic",
  },
  collapsed: {
    overflow: "hidden",
    "-webkit-line-clamp": 2, //see https://stackoverflow.com/questions/33058004/applying-an-ellipsis-to-multiline-text, this is actually well supported
    "-webkit-box-orient": "vertical",
    display: "-webkit-box",
    // height: "2.3rem",
    // textOverflow: "ellipsis"
  },
  headNote: {
    fontSize: "0.9em",
    overflow: "hidden",
    height: "1rem",
  },
}));

const SyndicationNotes: React.FC<SyndicationNotesProps> = (props) => {
  const [notes, setNotes] = useState<SyndicationNote[]>([]);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [showingEntry, setShowingEntry] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [totalNotes, setTotalNotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const classes = useStyles();

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      try {
        const response = await axios.get<SyndicationNoteResponse>(
          `/api/asset/${props.deliverableId}/notes?limit=${
            props.initialMax ?? 100
          }`
        );
        setNotes(response.data.results);
        setTotalNotes(response.data.count);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        SystemNotification.open(
          SystemNotifcationKind.Error,
          `Could not load notes for ${props.deliverableId}`
        );
      }
    };

    loadNotes();
  }, [
    props.deliverableId,
    props.initialMax,
    reloadCounter,
    props.updateCounter,
  ]);

  const formatTime = (timeStr: string) => {
    try {
      const date = parseISO(timeStr);
      return format(date, "do MMM yy");
    } catch (e) {
      console.error("Could not parse time string ", timeStr, ": ", e);
      return "(invalid)";
    }
  };

  const addNoteRequested = () => setShowingEntry(true);

  const closeEntryNoSave = () => setShowingEntry(false);

  const saveAndClose = async (newNote: string) => {
    try {
      await axios.post(`/api/asset/${props.deliverableId}/notes/new`, newNote, {
        headers: { "Content-Type": "text/plain" },
      });
      setShowingEntry(false);
      setReloadCounter((prev) => prev + 1);
      SystemNotification.open(SystemNotifcationKind.Info, "Saved note");
    } catch (err) {
      SystemNotification.open(
        SystemNotifcationKind.Error,
        `Could not save your note: ${err}`
      );
    }
  };

  const notesToDisplay = expanded ? notes : notes.slice(0, 3);

  return (
    <>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Grid item>
          <Typography className={classes.headNote}>
            {loading ? "Loading" : `${totalNotes} notes`}
          </Typography>
          <ShowAllSelector
            value={expanded}
            onChange={(newValue) => setExpanded(newValue)}
          />
        </Grid>
        <Grid item>
          <IconButton onClick={addNoteRequested}>
            <AddIcon />
          </IconButton>
        </Grid>
      </Grid>
      <ul className={classes.basicList}>
        {notesToDisplay.map((note, idx) => (
          <li key={idx} className={classes.basicList}>
            <Typography
              className={clsx(
                classes.contentBox,
                expanded ? undefined : classes.collapsed
              )}
            >
              {note.content}
            </Typography>
            <Typography className={classes.attributionBox}>
              {note.username} {formatTime(note.timestamp)}
            </Typography>
          </li>
        ))}
      </ul>
      {showingEntry ? (
        <AddNoteDialog
          closeEntryNoSave={closeEntryNoSave}
          saveAndClose={saveAndClose}
        />
      ) : undefined}
    </>
  );
};

export default SyndicationNotes;
