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
import { Search } from "@material-ui/icons";
import UploadsGraph from "./UploadsGraph";

type DelivTypes = "fullmasters" | "all";

const DeliverablesDashFront: React.FC = () => {
  const [startDateEntered, setStartDateEntered] = useState<Date>(() => {
    let d = new Date();
    d.setDate(1);
    return d;
  });
  const [titleSearchValue, setTitleSearchValue] = useState("");
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
      <Grid container direction="column">
        <Grid item>
          <Grid
            container
            justify="space-between"
            style={{ marginBottom: "1em" }}
          >
            <Grid item>
              <Grid container spacing={3}>
                <Grid item>
                  <Search style={{ verticalAlign: "baseline" }} />
                  <TextField
                    label="Search for title"
                    value={titleSearchValue}
                    onChange={(evt) => setTitleSearchValue(evt.target.value)}
                  />
                </Grid>
                <Grid item>
                  <FormControl>
                    <InputLabel id="deliv-type-label">
                      Deliverable Type
                    </InputLabel>
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
        </Grid>

        <Grid item style={{ flexGrow: 1 }}>
          <UploadsGraph startDate={startDateEntered} endDate={finishDateEntered} height={10}/>
          <DeliverablesDashList
            startDate={startDateEntered}
            endDate={finishDateEntered}
            types={selectedDelivTypes}
            titleSearchValue={titleSearchValue}
          />
        </Grid>
      </Grid>
    </MuiPickersUtilsProvider>
  );
};

export default DeliverablesDashFront;
