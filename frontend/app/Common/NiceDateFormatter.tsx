import React from "react";
import { format, parseISO } from "date-fns";
import { Typography } from "@material-ui/core";

interface NiceDateFormatterProps {
  date: Date | string;
  className?: string;
}

interface NiceDateFormatterState {
  formattedString: string;
}

class NiceDateFormatter extends React.Component<
  NiceDateFormatterProps,
  NiceDateFormatterState
> {
  constructor(props: NiceDateFormatterProps) {
    super(props);

    this.state = {
      formattedString: "",
    };
  }

  componentDidMount() {
    try {
      const dateValue: Date =
          typeof this.props.date === "string"
              ? parseISO(this.props.date as string)
              : (this.props.date as Date);

      this.setState({ formattedString: format(dateValue, "eee do MMM yy") });
    } catch (err) {
      console.error("Error in NiceDateFormatter: ", err);
      this.setState({
        formattedString: "Could not reformat date",
      });
    }
  }

  componentDidUpdate(
    prevProps: Readonly<NiceDateFormatterProps>,
    prevState: Readonly<NiceDateFormatterState>,
    snapshot?: any
  ) {
    if (prevProps.date !== this.props.date) {
      try {
        const dateValue: Date =
          typeof this.props.date === "string"
            ? parseISO(this.props.date as string)
            : (this.props.date as Date);

        this.setState({ formattedString: format(dateValue, "eee do MMM yy") });
      } catch (err) {
        console.error("Error in NiceDateFormatter: ", err);
        this.setState({
          formattedString: "Could not reformat date",
        });
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in NiceDateFormatter: ", error);
    this.setState({
      formattedString: "Could not reformat date",
    });
  }

  render() {
    return (
      <Typography className={this.props.className}>
        {this.state.formattedString}
      </Typography>
    );
  }
}

export default NiceDateFormatter;
