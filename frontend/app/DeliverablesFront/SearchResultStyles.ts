import { makeStyles } from "@material-ui/core/styles";

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

export { useStyles };
