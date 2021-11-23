import React, { useEffect, useState } from "react";
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
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import { formatISO } from "date-fns";
import DeliverablesDashEntry from "./DeliverablesDashEntry";

interface DeliverablesDashListProps {
  startDate: Date;
  endDate: Date;
}

const useStyles = makeStyles((theme) => ({
  table: {},
}));

const DeliverablesDashList: React.FC<DeliverablesDashListProps> = (props) => {
  const [matchingAssets, setMatchingAssets] = useState<
    DenormalisedDeliverable[]
  >([]);

  const classes = useStyles();

  const onOovvuuChanged = (delivId: bigint, newvalue: boolean) => {};

  const onReutersConnectChanged = (delivId: bigint, newvalue: boolean) => {};

  useEffect(() => {
    const loadData = async () => {
      const response = await axios.get(
        `/api/dash/assets?startDate=${formatISO(
          props.startDate
        )}&endDate=${formatISO(props.endDate)}`,
        { validateStatus: () => true }
      );
      switch (response.status) {
        case 200:
          setMatchingAssets(response.data as DenormalisedDeliverable[]);
          break;
        default:
          SystemNotification.open(
            SystemNotifcationKind.Error,
            `Could not load data, server returned ${response.status}`
          );
      }
    };

    loadData();
  }, [props.startDate, props.endDate]);

  const commissionFilterRequested = (newCommissionId?: number) => {};
  const projectFilterRequested = (newCommissionId?: number) => {};

  return (
    <Paper elevation={3}>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Filename</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Commission</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Deliverable type</TableCell>
              <TableCell>Links</TableCell>
              <TableCell>Platforms</TableCell>
              <TableCell>Mainstream Media</TableCell>
              <TableCell>Sent to Oovvuu</TableCell>
              <TableCell>Sent to Reuters Connect</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell /> {/*for "view bundle" button */}
            </TableRow>
          </TableHead>
          <TableBody>
            {matchingAssets.map((entry, idx) => (
              <DeliverablesDashEntry
                key={idx}
                entry={entry}
                commissionFilterRequested={commissionFilterRequested}
                projectFilterRequested={projectFilterRequested}
                onOovvuuChanged={onOovvuuChanged}
                onReutersChanged={onReutersConnectChanged}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DeliverablesDashList;
