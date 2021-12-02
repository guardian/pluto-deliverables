import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { format, formatISO, parseISO } from "date-fns";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";

interface UploadsGraphProps {
  startDate: Date;
  endDate: Date;
  formatString?: string; //date-fns format string for the time
    height: number;
}

const UploadsGraph: React.FC<UploadsGraphProps> = (props) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<ChartDataset[]>([]);

  const defaultFormatString = "do MMM";

  // /**
  //  * sets up a string array to provide the date axis
  //  */
  // useEffect(()=>{
  //     const oneDay = {days: 1};
  //     const dateCount = (props.endDate.getTime() - props.startDate.getTime()) / 86400000;
  //
  //     let newLabels = new Array(dateCount);
  //     let currentDate = props.startDate;
  //     for(let i=0;i<dateCount;i++) {
  //         newLabels[i] = format(currentDate, props.formatString ?? defaultFormatString);
  //         currentDate = add(currentDate, oneDay);
  //     }
  //     setLabels(newLabels);
  //
  // }, [props.startDate, props.endDate, props.formatString]);

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

        const datasets: ChartDataset[] = response.data.platforms
            .filter(p=>!!p)
            .map(
              (platform) => ({
                label: platform.name,
                data: platform.data,
              })
            );

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
  }, [props.startDate, props.endDate]);

  return (
    <Bar
      data={{
        labels: labels,
        datasets: datasets,
      }}
      height={props.height}
    />
  );
};

export default UploadsGraph;
