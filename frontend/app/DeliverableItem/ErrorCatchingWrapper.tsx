import React from "react";
import { Typography } from "@material-ui/core";

interface ECWProps {
  children?: React.ReactFragment;
}

class ErrorCatchingWrapper extends React.Component<ECWProps, any> {
  constructor(props: ECWProps) {
    super(props);

    this.state = {
      lastError: undefined,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("A subcomponent failed with the error ", error);
    this.setState({
      lastError: error.message,
    });
  }

  render() {
    return this.state.lastError ? (
      <Typography>
        This component has failed, please report to multimediatech.
      </Typography>
    ) : (
      this.props.children ?? null
    );
  }
}

export default ErrorCatchingWrapper;
