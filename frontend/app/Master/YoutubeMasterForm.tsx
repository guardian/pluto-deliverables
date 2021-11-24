import React from "react";
import {
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { Launch } from "@material-ui/icons";
import CommonMaster from "./CommonMaster";

interface YoutubeMasterFormProps {
  isEditing: boolean;
  master: YoutubeMaster;
  isReadOnly: boolean;
  isDirty: boolean;
  fieldChanged: (
    event: React.ChangeEvent<
      | HTMLTextAreaElement
      | HTMLInputElement
      | HTMLSelectElement
      | { name?: string; value: any }
    >,
    field: keyof YoutubeMaster
  ) => void;
  onCommonMasterChanged: (evt: any, field: string) => void;
}

const YoutubeMasterForm: React.FC<YoutubeMasterFormProps> = (props) => {
  const {
    isEditing,
    master,
    isReadOnly,
    isDirty,
    fieldChanged,
    onCommonMasterChanged,
  } = props;

  return (
    <>
      {isEditing && (
        <>
          <TextField
            label="Publication Date"
            value={master.publication_date || ""}
            disabled
          />
          <div className="metadata-info">
            <Typography variant="subtitle1">Youtube category</Typography>
            <p className="subtitle-small">{master.youtube_category ?? ""}</p>
          </div>
          <div className="metadata-info">
            <Typography variant="subtitle1">Youtube channel</Typography>

            <p className="subtitle-small">{master.youtube_channel ?? ""}</p>
          </div>
        </>
      )}

      <Grid direction="row" container>
        <Grid item>
          <TextField
            label="Youtube ID"
            value={master.youtube_id || ""}
            onChange={(event) => fieldChanged(event, "youtube_id")}
            error={!isReadOnly && isDirty && !master.youtube_id}
            helperText={
              !isReadOnly && isDirty && !master.youtube_id
                ? "Youtube ID is required"
                : ""
            }
            required={!isReadOnly}
            disabled={isReadOnly}
          />
        </Grid>
        <Grid item style={{ flex: "0 0 48px" }}>
          <Tooltip title={`https://youtube.com/watch?v=${master.youtube_id}`}>
            <IconButton
              onClick={() => {
                window.open(
                  `https://youtube.com/watch?v=${master.youtube_id}`,
                  "_blank"
                );
              }}
            >
              <Launch />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      <CommonMaster
        prefix={"Youtube"}
        fields={{
          title: master.youtube_title,
          description: master.youtube_description,
          tags: master.youtube_tags,
        }}
        onChange={onCommonMasterChanged}
        isDirty={isDirty}
        disabled={isReadOnly}
      />
    </>
  );
};

export default YoutubeMasterForm;
