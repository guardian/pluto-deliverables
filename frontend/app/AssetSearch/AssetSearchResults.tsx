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
  TableSortLabel,
  Typography,
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
  sortBy: string;
  sortOrder?: "desc" | "asc";
}

const useStyles = makeStyles({
  table: {
    width: "100%",
  },
  informative: {
    marginLeft: "auto",
    marginRight: "auto",
    colour: "darkorange",
  },
});

interface SearchTableProps {
  results: Deliverable[];
  sortBy: string;
  sortOrder?: "desc" | "asc";
  onSortChanged: (
    newSortBy: string,
    newSortOrder: "desc" | "asc" | undefined
  ) => void;
}

const AssetSearchTable: React.FC<SearchTableProps> = (props) => {
  const classes = useStyles();

  const updateSort = (forField: string) => {
    if (props.sortBy == forField) {
      const newSortOrder = props.sortOrder == "desc" ? "asc" : "desc";
      props.onSortChanged(forField, newSortOrder);
    } else {
      props.onSortChanged(forField, props.sortOrder);
    }
  };

  return (
    <>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={
                  props.sortBy === "filename" ? props.sortOrder : false
                }
              >
                <TableSortLabel
                  active={props.sortBy === "filename"}
                  direction={
                    props.sortBy === "filename" ? props.sortOrder : undefined
                  }
                  onClick={(evt) => updateSort("filename")}
                >
                  Filename
                </TableSortLabel>
              </TableCell>
              <TableCell>Type</TableCell>
              <TableCell
                sortDirection={
                  props.sortBy === "modified_dt" ? props.sortOrder : false
                }
              >
                <TableSortLabel
                  active={props.sortBy === "modified_dt"}
                  direction={
                    props.sortBy === "modified_dt" ? props.sortOrder : undefined
                  }
                  onClick={(evt) => updateSort("modified_dt")}
                >
                  Last Modified
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.results.map((entry, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Link to={`/bundle/${entry.deliverable}`}>
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
        {props.results.length === 0 ? (
          <Typography
            align="center"
            variant="caption"
            className={classes.informative}
          >
            No assets matched this search
          </Typography>
        ) : undefined}
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
      sortBy: "modified_dt",
      sortOrder: "desc",
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

  djangoOrderParam() {
    let orderSym: string;
    switch (this.state.sortOrder) {
      case "asc":
        orderSym = "";
        break;
      case "desc":
        orderSym = "-";
        break;
      default:
        orderSym = "";
        break;
    }

    return `${orderSym}${this.state.sortBy}`;
  }

  async loadNextPage(): Promise<void> {
    try {
      const initialSearchDoc = this.validatedSearchRequest();
      if (!initialSearchDoc) {
        console.error("There was no search document set, this is a code bug");
        return this.setStatePromise({
          loading: false,
          lastError: "internal error, see browser log",
        });
      }

      const searchDoc = Object.assign({}, initialSearchDoc, {
        order_by: this.djangoOrderParam(),
      });
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
          <AssetSearchTable
            results={this.state.results}
            sortBy={this.state.sortBy}
            sortOrder={this.state.sortOrder}
            onSortChanged={(newSortBy, newSortOrder) => {
              this.setState(
                { sortBy: newSortBy, sortOrder: newSortOrder },
                () => this.reset().then(() => this.loadNextPage())
              );
            }}
          />
        </Paper>
      </>
    );
  }
}

export default AssetSearchResults;
