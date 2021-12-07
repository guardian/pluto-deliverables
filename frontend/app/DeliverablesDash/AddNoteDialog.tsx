import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@material-ui/core";

interface AddNoteDialogProps {
  closeEntryNoSave: () => void;
  saveAndClose: (newValue: string) => void;
}

const AddNoteDialog: React.FC<AddNoteDialogProps> = (props) => {
  const [enteredNote, setEnteredNote] = useState("");

  return (
    <Dialog open={true} onClose={props.closeEntryNoSave}>
      <DialogTitle>Add note</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please enter the text of your note in the box below and click the
          "Save" button. It will then be recorded alongside your username and
          the time that the note was made.
        </DialogContentText>
        <TextField
          multiline={true}
          style={{ width: "100%" }}
          onChange={(evt) => setEnteredNote(evt.target.value)}
          value={enteredNote}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.closeEntryNoSave}>Cancel</Button>
        <Button onClick={() => props.saveAndClose(enteredNote)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNoteDialog;
