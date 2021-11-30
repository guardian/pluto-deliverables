import { makeStyles } from "@material-ui/core/styles";

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
    maxHeight: "600px",
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

export { useStyles };
