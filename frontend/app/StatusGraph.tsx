import React, { useState, useEffect } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import { useHistory } from "react-router-dom";

interface GraphProps {}

const StatusGraph: React.FC<GraphProps> = (props) => {
  const [invalidCount, setInvalidCount] = useState<[number, number, number]>([
    0,
    0,
    0,
  ]);

  const legendlables = ["Not Ingested", "Transcode Failed", "Ingest Failed"];
  let total = invalidCount.reduce(
    (accumulator, currentValue) => accumulator + currentValue
  );
  const labelsvalues = invalidCount.map(function (value, i) {
    let p = Math.round((value / total) * 100) + "%";
    return legendlables[i] + " " + p;
  });

  let data = {
    labels: labelsvalues,
    datasets: [
      {
        backgroundColor: ["#66ff00", "#0052eb", "#ff0015"],
        borderWidth: 0,
        data: invalidCount,
      },
    ],
  };

  const status_array = [0, 6, 3];

  const loadInvalidCount = async () => {
    try {
      const response = await axios.get(`/api/invalid/countbystatus`);
      return setInvalidCount(response.data);
    } catch (err) {
      console.error("Could not load in invalid count data: ", err);
    }
  };

  let history = useHistory();

  useEffect(() => {
    loadInvalidCount();
  }, []);

  return (
    <React.Fragment>
      <div
        style={{
          width: "540px",
          height: "180px",
        }}
      >
        <Doughnut
          data={data}
          onElementsClick={(elems) => {
            console.log("Type clicked: " + status_array[elems[0]._index]);
            history.push(`/invalid/status/${status_array[elems[0]._index]}`);
          }}
          options={{
            legend: {
              position: "right",
              labels: {
                filter: (legendItem: any, data: any) =>
                  data.datasets[0].data[legendItem.index] != 0,
              },
            },
            cutoutPercentage: 80,
            maintainAspectRatio: false,
          }}
        />
      </div>
    </React.Fragment>
  );
};

export default StatusGraph;
