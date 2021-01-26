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
import { RouteComponentProps, useHistory, useParams } from "react-router-dom";
import {
  getInvalidDeliverables,
  getInvalidDeliverablesByDate,
  getInvalidDeliverablesByType,
} from "./api-service";
import InvalidRow from "./InvalidRow";
import DayGraph from "./DayGraph";
import TypeGraph from "./TypeGraph";

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
  buttonContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(10,10%)",
  },
  buttons: {
    marginRight: "0.4rem",
    marginBottom: "1.2rem",
    marginTop: "0.625rem",
  },
  sectionHeader: {
    display: "inline",
    marginRight: "1em",
  },
});

const InvalidDeliverablesComponent: React.FC<RouteComponentProps> = () => {
  // React Router
  const history = useHistory();
  const { date, type } = useParams();

  // React state
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  // Material-UI
  const classes = useStyles();

  const loadRecord = async () => {
    try {
      if (date) {
          const projectDeliverables = await getInvalidDeliverablesByDate(date);
          setDeliverables(projectDeliverables);
      } else if (type) {
          const projectDeliverables = await getInvalidDeliverablesByType(type);
          setDeliverables(projectDeliverables);
      } else {
        const projectDeliverables = await getInvalidDeliverables();
        setDeliverables(projectDeliverables);
      }
      console.log("date: " + date);
    } catch (err) {
      if (err.response) {
        //server returned a bad status code
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
    loadRecord();
  }, []);

  return (
    <>
      <Helmet>
        <title>Invalid Deliverables</title>
      </Helmet>
      <div>
        <h3 className={classes.sectionHeader}>Invalid Deliverables</h3>
      </div>
      <DayGraph />
      <TypeGraph />
      <div>
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
      </div>
    </>
  );
};

export default InvalidDeliverablesComponent;
