import React, { ChangeEvent } from "react";
import {
  CircularProgress,
  Fab,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { Add, CloudUploadOutlined } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { FileEntry } from "./FileEntry";

interface UploaderMainProps {}

interface UploaderMainState {
  loading: boolean;
  uploadInProgress: boolean;
  dialogError?: string;
  files: FileEntry[];
}

class UploaderMain extends React.Component<
  UploaderMainProps,
  UploaderMainState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: false,
      uploadInProgress: false,
      dialogError: undefined,
      files: [],
    };
    this.newFileAdded = this.newFileAdded.bind(this);
  }

  static getDerivedStateFromError(err: Error) {
    return {
      dialogError: err.toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("File uploader caught an error: ", error, errorInfo);
  }

  newFileAdded(evt: any) {
    console.log(
      `Selected ${evt.target.files ? evt.target.files.length : 0} files`
    );
    console.log(evt.target.files);
    if (!evt.target.files) return;

    //evt.target.files is a FileList type, not an Array, so we can't map over it :(
    let newEntries: FileEntry[] = [];
    for (let i = 0; i < evt.target.files.length; ++i) {
      newEntries[i] = {
        filename: evt.target.files[i].name,
        progress: 0,
        lastError: "",
        rawFile: evt.target.files[i],
      };
    }

    this.setState((prevState) => ({
      files: prevState.files.concat(...newEntries),
    }));
  }

  render() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <label htmlFor="upload-selector">
            <input
              style={{ display: "none" }}
              id="upload-selector"
              name="upload-selector"
              type="file"
              disabled={this.state.uploadInProgress}
              onChange={this.newFileAdded}
            />
            <Fab
              color="secondary"
              size="small"
              component="span"
              aria-label="add"
              variant="extended"
              disabled={this.state.uploadInProgress}
            >
              <Add /> Add more files
            </Fab>
          </label>
        </Grid>
        <Grid item xs={6}>
          <Fab
            color="secondary"
            size="small"
            component="span"
            aria-label="add"
            variant="extended"
            disabled={this.state.uploadInProgress}
          >
            <CloudUploadOutlined />
            &nbsp;&nbsp;
            {this.state.uploadInProgress ? "Uploading..." : "Start upload"}
          </Fab>
          {this.state.loading ? <CircularProgress /> : null}
        </Grid>
        <Grid item xs={12}>
          {this.state.dialogError ? (
            <>
              <Typography>
                An internal error occurred: {this.state.dialogError}
              </Typography>
              <Typography>Please refresh and try again</Typography>
            </>
          ) : (
            <Paper elevation={3}>
              <TableContainer>
                <Table style={{ width: "100%", height: "75vh" }}>
                  <TableHead style={{ height: "2em" }}>
                    <TableRow>
                      <TableCell>File</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Problems</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.state.files.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{entry.filename}</TableCell>
                        <TableCell>{entry.progress}</TableCell>
                        <TableCell>{entry.lastError}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>
      </Grid>
    );
  }
}

export default UploaderMain;
