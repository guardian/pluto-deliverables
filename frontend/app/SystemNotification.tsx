import React, { useState } from "react";
import { Snackbar, SnackbarContent } from "@material-ui/core";
import { RouteComponentProps } from "react-router-dom";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";

export enum SystemNotificationKind {
  Success = "success",
  Error = "error",
}

let openSystemNotification: (
  kind: SystemNotificationKind,
  message: string
) => void;

const SystemNotification: React.FC<RouteComponentProps> & {
  open: (kind: SystemNotificationKind, message: string) => void;
} = () => {
  const autoHideDuration = 4000;
  const successColor = "#4caf50";
  const errorColor = "rgb(211 47 47)";

  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [kind, setKind] = useState<SystemNotificationKind>(
    SystemNotificationKind.Success
  );

  const close = (_event?: React.SyntheticEvent, reason?: string): void => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  openSystemNotification = (kind: SystemNotificationKind, message: string) => {
    setOpen(true);
    setMessage(message);
    setKind(kind);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={close}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <SnackbarContent
        style={{
          backgroundColor:
            kind === SystemNotificationKind.Success ? successColor : errorColor,
        }}
        message={
          <div style={{ display: "flex", alignItems: "center" }}>
            {kind === SystemNotificationKind.Success ? (
              <CheckCircleOutlineIcon />
            ) : (
              <ErrorOutlineIcon />
            )}
            <p style={{ fontSize: "14px", margin: "0 0 0 6px" }}>{message}</p>
          </div>
        }
      />
    </Snackbar>
  );
};

SystemNotification.open = (kind: SystemNotificationKind, message: string) =>
  openSystemNotification(kind, message);

export default SystemNotification;
