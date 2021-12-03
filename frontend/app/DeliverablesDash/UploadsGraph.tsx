import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { format, formatISO, parseISO } from "date-fns";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";

interface UploadsGraphProps {
  startDate: Date;
  endDate: Date;
  formatString?: string; //date-fns format string for the time
  colourOffset?: number;
  saturation?: string; //should be percentage 0->100%
  value?: string; //should be percentage 0->100%
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

  return (
    <Bar
      data={{
        labels: labels,
        datasets: datasets,
      }}
      options={{
        maintainAspectRatio: false,
        responsive: true,
      }}
    />
  );
};

export default UploadsGraph;
