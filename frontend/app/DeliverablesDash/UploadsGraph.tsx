import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { format, formatISO, parseISO } from "date-fns";
import axios from "axios";
import {
  SystemNotifcationKind,
  SystemNotification,
} from "@guardian/pluto-headers";

interface UploadsGraphProps {
  startDate: Date;
  endDate: Date;
  formatString?: string; //date-fns format string for the time
  colourOffset?: number;
  saturation?: string; //should be percentage 0->100%
  value?: string; //should be percentage 0->100%
  columnClicked?: (columnIndex: number) => void;
}

const UploadsGraph: React.FC<UploadsGraphProps> = (props) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<ChartDataset[]>([]);

  const defaultFormatString = "EEEEE do MMM";

  /**
   * loads in data from the server
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get<UploadSummaryResponse>(
          `/api/dash/summary?startDate=${formatISO(
            props.startDate
          )}&endDate=${formatISO(props.endDate)}`
        );

        const newLabels = response.data.dates.map((dateString) => {
          try {
            const parsedDate = parseISO(dateString);
            return format(
              parsedDate,
              props.formatString ?? defaultFormatString
            );
          } catch (err) {
            console.error("Could not reformat ", dateString, ": ", err);
            return "(err)";
          }
        });
        setLabels(newLabels);

        const colourInterval =
          response.data.platforms.length > 0
            ? 360 / (response.data.platforms.length + 1)
            : 0;

        const datasets: ChartDataset[] = response.data.platforms
          .filter((p) => !!p)
          .map((platform, idx) => ({
            label: platform.name,
            data: platform.data,
            backgroundColor: `hsl(${
              (props.colourOffset ?? 0) + colourInterval * idx
            }, ${props.saturation ?? "90%"}, ${props.value ?? "65%"})`,
            borderColor: `has(${
              (props.colourOffset ?? 0) + colourInterval * idx
            }, ${props.saturation ?? "90%"}, ${props.value ?? "10%"}`,
            borderWidth: 1,
          }));

        setDatasets(datasets);
      } catch (err) {
        console.error("Could not load data: ", err);
        SystemNotification.open(
          SystemNotifcationKind.Error,
          "Could not load in graph data, see browser console for details"
        );
      }
    };
    loadData();
  }, [props.startDate, props.endDate, props.saturation, props.value]);

  const graphWasClicked = (
    evt: MouseEvent,
    elements: Array<{ _index?: number }>
  ) => {
    //elements gives us an array of Dataset instances, for each of the data sets in the "bucket" defined by the date
    //the property `_index` tells us which column it is, i.e. how many days since the start date of the graph.
    //the first index is 0, i.e. date = startDate + _index
    try {
      if (elements.length > 0) {
        const maybeColumnIndex = elements[0]["_index"];
        if (maybeColumnIndex && props.columnClicked) {
          props.columnClicked(maybeColumnIndex);
        } else {
          console.error("No _index defined under ", elements[0]);
        }
      } else {
        console.log(
          "Graph was clicked outside of the datasets, can't tell which day"
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Bar
      data={{
        labels: labels,
        datasets: datasets,
      }}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        onClick: graphWasClicked,
      }}
    />
  );
};

export default UploadsGraph;
