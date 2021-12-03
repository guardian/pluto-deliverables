import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import DeliverablesDashList from "./DeliverablesDashList";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import {
  Assessment,
  AssessmentOutlined,
  AssessmentRounded,
  Search,
} from "@material-ui/icons";
import UploadsGraph from "./UploadsGraph";
import { add, formatISO, parseISO, set } from "date-fns";
import { useHistory, useLocation } from "react-router-dom";
import { break_down_searchstring } from "../utils/searchstring";

type DelivTypes = "fullmasters" | "all";

const DeliverablesDashFront: React.FC = () => {
  const [startDateEntered, setStartDateEntered] = useState<Date>(() => {
    let d = new Date();
    d.setDate(1);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  });
  const [titleSearchValue, setTitleSearchValue] = useState("");
  const [finishDateEntered, setFinishDateEntered] = useState<Date>(
    set(new Date(), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
  );
  const [selectedDelivTypes, setSelectedDelivTypes] = useState<DelivTypes>(
    "fullmasters"
  );
  const [showingChart, setShowingChart] = useState(true);

  const history = useHistory();
  const location = useLocation();

  console.log("searchstring: ", location.search);
  useEffect(() => {
    if (location.search !== "") {
      const args = break_down_searchstring(location.search);
      const maybeStartTime = args.get("from");
      if (maybeStartTime) {
        try {
          const parsedStartTime = parseISO(maybeStartTime);
          setStartDateEntered(parsedStartTime);
        } catch (err) {
          console.warn(`${maybeStartTime} is not a valid time: `, err);
        }
      }

      const maybeFinishTime = args.get("until");
      if (maybeFinishTime) {
        try {
          const parsedFinishTime = parseISO(maybeFinishTime);
          setFinishDateEntered(parsedFinishTime);
        } catch (err) {
          console.warn(`${maybeFinishTime} is not a valid time: `, err);
        }
      }
    }
  }, [location.search]);

  const dateFilterUpdated = (
    newStartTime: Date | undefined,
    newFinishTime: Date | undefined
  ) => {
    const zeroTimePart = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };

    const params = [
      [
        "from",
        newStartTime ? formatISO(set(newStartTime, zeroTimePart)) : undefined,
      ],
      [
        "until",
        newFinishTime ? formatISO(set(newFinishTime, zeroTimePart)) : undefined,
      ],
    ].filter((entry) => !!entry[1]);

    if (params.length > 0) {
      const paramString = params
        .map((kv) =>
          kv[0] && kv[1]
            ? `${encodeURIComponent(kv[0])}=${encodeURIComponent(kv[1])}`
            : ""
        )
        .join("&");
      history.push("?" + paramString);
    } else {
      history.push("/dash");
    }
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Helmet>
        <title>Deliverables Dashboard</title>
      </Helmet>
      <Typography variant="h2">Deliverables Dashboard</Typography>
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <Grid
            container
            justify="space-between"
            style={{ marginBottom: "1em" }}
          >
            <Grid item>
              <Grid container spacing={3}>
                <Grid item>
                  <Search style={{ verticalAlign: "bottom" }} />
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

                <Grid item>
                  <Tooltip
                    title={`${
                      showingChart ? "Hide" : "Show"
                    } upload summary graph`}
                  >
                    <IconButton
                      onClick={() => setShowingChart((prev) => !prev)}
                    >
                      {showingChart ? (
                        <AssessmentOutlined />
                      ) : (
                        <AssessmentRounded />
                      )}
                    </IconButton>
                  </Tooltip>
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
                      dateFilterUpdated(
                        newValue ?? undefined,
                        finishDateEntered
                      )
                    }
                  />
                </Grid>
                <Grid item>
                  <DatePicker
                    label="Search until"
                    value={finishDateEntered}
                    onChange={(newValue) =>
                      dateFilterUpdated(startDateEntered, newValue ?? undefined)
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {showingChart ? (
          <Grid
            item
            style={{ height: "45%", maxHeight: "800px", minHeight: "200px" }}
          >
            <UploadsGraph
              startDate={startDateEntered}
              endDate={finishDateEntered}
              columnClicked={(columnIndex) => {
                const targetDate = add(startDateEntered, { days: columnIndex });
                const targetEndDate = set(targetDate, {
                  hours: 23,
                  minutes: 59,
                  seconds: 59,
                  milliseconds: 999,
                });
                history.push(
                  "?from=" +
                    formatISO(targetDate) +
                    "&until=" +
                    formatISO(targetEndDate)
                );
              }}
            />
          </Grid>
        ) : undefined}

        <Grid item style={{ flexGrow: 1 }}>
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
