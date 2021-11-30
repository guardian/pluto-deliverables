import { makeStyles } from "@material-ui/core";

const formStyles = makeStyles((theme) => ({
  root: {
    width: "100% !important",
    "& .MuiTextField-root": {
      width: "100%",
    },
    "& .MuiFormControl-root": {
      width: "100%",
    },
    "& .MuiAutocomplete-root": {
      width: "100%",
    },
  },
  expandable: {
    flexGrow: 1,
  },
  listContainer: {
    listStyle: "none",
    paddingLeft: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: theme.spacing(1),
  },
}));

const metadataStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "& form": {
      display: "flex",
      width: "100%",
      maxWidth: "800px",
      flexDirection: "column",
      alignItems: "flex-start",
    },
    "& .MuiAutocomplete-root": {
      width: "100%",
    },
    "& .MuiTextField-root": {
      width: "100%",
      marginBottom: "1rem",
    },
    "& .MuiFormControl-root": {
      width: "100%",
      marginBottom: "1rem",
    },
    "& .metadata-info": {
      marginBottom: "1rem",
      display: "flex",
      width: "100%",
      flexDirection: "column",
      "& .subtitle-small": {
        fontSize: "14px",
        margin: "0",
        textOverflow: "ellipsis",
        display: "inline-block",
        overflow: "hidden",
        maxWidth: "790px",
        whiteSpace: "nowrap",
        minHeight: "22px",
      },
    },
    "& .MuiBadge-root": {
      marginLeft: "1rem",
    },
  },
  formButtons: {
    display: "flex",
    marginTop: "1rem",
    width: "100%",
    "& .cancel": {
      marginLeft: "1rem",
    },
    "& .delete": {
      marginLeft: "auto",
    },
  },
  dialog: {
    "& .MuiDialogActions-root.MuiDialogActions-spacing": {
      justifyContent: "flex-start",
      "& .MuiButtonBase-root.MuiButton-root.MuiButton-contained:not(.MuiButton-containedSecondary)": {
        marginLeft: "auto",
      },
    },
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
  },
});

export { metadataStyles, formStyles };
