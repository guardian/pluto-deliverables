import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import DeliverablesDashList from "./DeliverablesDashList";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";

type DelivTypes = "fullmasters" | "all";

const DeliverablesDashFront: React.FC = () => {
  const [startDateEntered, setStartDateEntered] = useState<Date>(() => {
    let d = new Date();
    d.setDate(1);
    return d;
  });
  const [finishDateEntered, setFinishDateEntered] = useState<Date>(new Date());
  const [selectedDelivTypes, setSelectedDelivTypes] = useState<DelivTypes>(
    "fullmasters"
  );

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Helmet>
        <title>Deliverables Dashboard</title>
      </Helmet>
      <Typography variant="h2">Deliverables Dashboard</Typography>
      <Grid container justify="space-between">
        <Grid item>
          <Grid container spacing={3}>
            <Grid item>
              <FormControl>
                <InputLabel id="deliv-type-label">Deliverable Type</InputLabel>
                <Select
                  labelId="deliv-type-label"
                  onChange={(evt) =>
                    setSelectedDelivTypes(evt.target.value as DelivTypes)
                  }
                  value={selectedDelivTypes}
                >
                  <MenuItem value="fullmasters">Full masters only</MenuItem>
                  <MenuItem value="all">All deliverables</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Grid container justify="flex-end" spacing={3}>
            <Grid item>
              <DatePicker
                label="Search from"
                value={startDateEntered}
                onChange={(newValue) =>
                  setStartDateEntered(newValue ?? new Date())
                }
              />
            </Grid>
            <Grid item>
              <DatePicker
                label="Search until"
                value={finishDateEntered}
                onChange={(newValue) =>
                  setFinishDateEntered(newValue ?? new Date())
                }
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <DeliverablesDashList
        startDate={startDateEntered}
        endDate={finishDateEntered}
        types={selectedDelivTypes}
      />
    </MuiPickersUtilsProvider>
  );
};

export default DeliverablesDashFront;
