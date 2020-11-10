import React from "react";
import axios from "axios";
import { validator } from "./UuidValidator";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import DeliverableSummaryCell from "../ProjectDeliverables/DeliverableSummaryCell";
import DateTimeFormatter from "../Form/DateTimeFormatter";

interface AssetSearchResultsProps {
  resultsLimit: number;
  filter: AssetSearchFilter;
}

interface AssetSearchResultsState {
  loading: boolean;
  lastError: string | undefined;
  results: Deliverable[];
  startAt: number;
  pageSize: number;
}

const useStyles = makeStyles({
  table: {
    width: "100%",
  },
});

interface SearchTableProps {
  results: Deliverable[];
}

const AssetSearchTable: React.FC<SearchTableProps> = (props) => {
  const classes = useStyles();

  return (
    <>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Filename</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.results.map((entry, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Link to={`/project/${entry.deliverable}`}>
                    <DeliverableSummaryCell deliverable={entry} />
                  </Link>
                </TableCell>
                <TableCell>{entry.type_string}</TableCell>
                <TableCell>
                  <DateTimeFormatter value={entry.modified_dt} />
                </TableCell>
                <TableCell>{entry.status_string}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

class AssetSearchResults extends React.Component<
  AssetSearchResultsProps,
  AssetSearchResultsState
> {
  constructor(props: AssetSearchResultsProps) {
    super(props);
    this.state = {
      loading: false,
      lastError: undefined,
      results: [],
      startAt: 0,
      pageSize: 25,
    };
  }

  static getDerivedStateFromError(error: any) {
    console.error(
      "An uncaught error occurred in AssetSearchResults, this is a code bug"
    );

    return {
      loading: false,
      lastError: error.toString(),
    };
  }

  setStatePromise(newState: any): Promise<void> {
    return new Promise((resolve, reject) =>
      this.setState(newState, () => resolve())
    );
  }

  reset(): Promise<void> {
    return this.setStatePromise({
      results: [],
      lastError: undefined,
      startAt: 0,
    });
  }

  validatedSearchRequest() {
    if (!this.props.filter) return undefined;

    if (
      this.props.filter.atom_id &&
      validator.test(this.props.filter.atom_id)
    ) {
      return this.props.filter;
    } else {
      let updatedFilters = Object.assign({}, this.props.filter);
      updatedFilters["atom_id"] = undefined;
      return updatedFilters;
    }
  }

  async loadNextPage(): Promise<void> {
    try {
      const searchDoc = this.validatedSearchRequest();
      if (!searchDoc) {
        console.error("There was no search document set, this is a code bug");
        return this.setStatePromise({
          loading: false,
          lastError: "internal error, see browser log",
        });
      }
      const response = await axios.post<Deliverable[]>(
        `/api/asset/search?startAt=${this.state.startAt}&limit=${this.state.pageSize}`,
        searchDoc
      );
      if (response.data.length == 0) {
        console.log("Reached end of list");
        return this.setStatePromise({ loading: false });
      }

      await this.setStatePromise((prevState: AssetSearchResultsState) => ({
        results: prevState.results.concat(...response.data),
        startAt: prevState.startAt + response.data.length,
      }));

      return this.state.startAt >= this.props.resultsLimit
        ? new Promise((resolve, reject) => resolve())
        : this.loadNextPage();
    } catch (err) {
      return this.setStatePromise({
        loading: false,
        lastError: err.toString(),
      });
    }
  }

  componentDidMount() {
    console.log("AssetSearchResults loaded");
    this.loadNextPage();
  }

  componentDidUpdate(
    prevProps: Readonly<AssetSearchResultsProps>,
    prevState: Readonly<AssetSearchResultsState>,
    snapshot?: any
  ) {
    if (prevProps.filter !== this.props.filter) {
      console.log("Filter updated, reloading results");
      this.reset().then(() => this.loadNextPage());
    }
  }

  render() {
    return (
      <>
        <span style={{ height: "1em", overflow: "hidden", color: "red" }}>
          {this.state.lastError ? this.state.lastError : ""}
        </span>
        <Paper elevation={3}>
          <AssetSearchTable results={this.state.results} />
        </Paper>
      </>
    );
  }
}

export default AssetSearchResults;
