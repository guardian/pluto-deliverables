import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import { RouteComponentProps, useParams } from "react-router-dom";
import {
  getInvalidDeliverables,
  getInvalidDeliverablesByDate,
  getInvalidDeliverablesByType,
  getInvalidDeliverablesByStatus,
} from "./api-service";
import InvalidRow from "./InvalidRow";
import DayGraph from "./DayGraph";
import TypeGraph from "./TypeGraph";
import StatusGraph from "./StatusGraph";

interface HeaderTitles {
  label: string;
  key?: keyof Deliverable;
}

const tableHeaderTitles: HeaderTitles[] = [
  { label: "File", key: "filename" },
  { label: "", key: "atom_id" },
  { label: "Last Modified", key: "modified_dt" },
  { label: "Type", key: "type" },
  { label: "Status", key: "status" },
  { label: "Go To", key: "job_id" },
];

const useStyles = makeStyles({
  table: {
    maxWidth: "100%",
  },
  page_title: {
    fontSize: "25px",
  },

  graphs: {
    display: "grid",
    gridTemplateColumns: "55% 45%",
    gridTemplateRows: "200px 200px",
    "@media only screen and (max-width: 1490px)": {
      display: "grid",
      gridTemplateColumns: "50% 50%",
      gridTemplateRows: "400px 200px",
    },
  },
  daygraph: {
    gridColumnStart: 1,
    gridColumnEnd: 1,
    gridRowStart: 1,
    gridRowEnd: 2,
    "@media only screen and (max-width: 1490px)": {
      gridColumnStart: 1,
      gridColumnEnd: 2,
      gridRowStart: 1,
      gridRowEnd: 1,
    },
  },
  typegraph: {
    gridColumnStart: 2,
    gridColumnEnd: 2,
    gridRowStart: 1,
    gridRowEnd: 1,
    "@media only screen and (max-width: 1490px)": {
      gridColumnStart: 1,
      gridColumnEnd: 1,
      gridRowStart: 2,
      gridRowEnd: 2,
      marginTop: "20px",
    },
  },
  statusgraph: {
    gridColumnStart: 2,
    gridColumnEnd: 2,
    gridRowStart: 2,
    gridRowEnd: 2,
    marginTop: "16px",
    "@media only screen and (max-width: 1490px)": {
      gridColumnStart: 2,
      gridColumnEnd: 2,
      gridRowStart: 2,
      gridRowEnd: 2,
      marginTop: "20px",
    },
  },
});

const InvalidDeliverablesComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  // @ts-ignore
  const { date, kind, status } = useParams();

  // React state
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  // Material-UI
  const classes = useStyles();

  const loadDeliverables = async () => {
    try {
      if (date) {
        const projectDeliverables = await getInvalidDeliverablesByDate(date);
        setDeliverables(projectDeliverables);
      } else if (kind) {
        const projectDeliverables = await getInvalidDeliverablesByType(kind);
        setDeliverables(projectDeliverables);
      } else if (status) {
        const projectDeliverables = await getInvalidDeliverablesByStatus(
          status
        );
        setDeliverables(projectDeliverables);
      } else {
        const projectDeliverables = await getInvalidDeliverables();
        setDeliverables(projectDeliverables);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.data.detail) console.error(err.response.data.detail);
        else return console.error(`Error code ${err.response.status}`);
      } else if (err.request) {
        console.error(`Could not contact server: ${err.message}`);
      } else {
        console.error(err.message);
      }
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, []);

  return (
    <>
      <Helmet>
        <title>Invalid Deliverables</title>
      </Helmet>
      <div className={classes.page_title}>Invalid Deliverables</div>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <div className={classes.graphs}>
                <div className={classes.daygraph}>
                  <DayGraph />
                </div>
                <div className={classes.typegraph}>
                  <TypeGraph />
                </div>
                <div className={classes.statusgraph}>
                  <StatusGraph />
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Paper elevation={3}>
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                {tableHeaderTitles.map((entry, idx) => (
                  <TableCell key={`r${idx}`}>{entry.label}</TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {deliverables.map((del, idx) => (
                <InvalidRow
                  key={del.id.toString()}
                  deliverable={del}
                  classes={classes}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default InvalidDeliverablesComponent;
