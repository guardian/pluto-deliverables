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
import {
  SystemNotifcationKind,
  SystemNotification,
} from "@guardian/pluto-headers";
import { formatISO } from "date-fns";
import DeliverablesDashEntry from "./DeliverablesDashEntry";

interface DeliverablesDashListProps {
  startDate: Date;
  endDate: Date;
  titleSearchValue: string;
  types: "fullmasters" | "all";
}

const useStyles = makeStyles((theme) => ({
  table: {},
}));

const DeliverablesDashList: React.FC<DeliverablesDashListProps> = (props) => {
  const [matchingAssets, setMatchingAssets] = useState<
    DenormalisedDeliverable[]
  >([]);

  const classes = useStyles();

  const didUpdate = (assetId: bigint, newValue: DenormalisedDeliverable) => {
    //update the one entry in our content array matching the given asset id with the new value
    setMatchingAssets((prevState) => {
      let newState: DenormalisedDeliverable[] = new Array(prevState.length);

      for (let i = 0; i < prevState.length; i++) {
        if (prevState[i].id === assetId) {
          newState[i] = newValue;
        } else {
          newState[i] = prevState[i];
        }
      }

      return newState;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      const response = await axios.get(
        `/api/dash/assets?startDate=${encodeURIComponent(
          formatISO(props.startDate)
        )}&endDate=${encodeURIComponent(formatISO(props.endDate))}&types=${
          props.types
        }&q=${props.titleSearchValue}`,
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
  }, [props.startDate, props.endDate, props.types, props.titleSearchValue]);

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
                onRecordDidUpdate={didUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DeliverablesDashList;
