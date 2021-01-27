import React, { useState, useEffect } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import { useHistory } from "react-router-dom";

interface GraphProps {}

const TypeGraph: React.FC<GraphProps> = (props) => {
  const [invalidCount, setInvalidCount] = useState<
    [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number
    ]
  >([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const legendlables = [
    "Full Master",
    "Clean Master",
    "Natural Sound",
    "Music",
    "Voiceover",
    "FX",
    "Subtitles",
    "Post-production Script",
    "Trailer",
    "Promo Stills",
    "PAC Forms",
    "Sync Sound",
    "Miscellaneous",
    "Migrated Master",
    "Podcast Master",
  ];
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
        backgroundColor: [
          "#66ff00",
          "#0052eb",
          "#ff0015",
          "#ff9600",
          "#8f00eb",
          "#6dfcff",
          "#ff4871",
          "#91eb00",
          "#2e00ff",
          "#ffea00",
          "#817980",
          "#ff34ec",
          "#5dffba",
          "#ebac4c",
          "#401215",
        ],
        borderWidth: 0,
        data: invalidCount,
      },
    ],
  };

  const types = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const loadInvalidCount = async () => {
    try {
      const response = await axios.get(`/api/invalid/countbytype`);
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
          float: "right",
          marginRight: "20px",
        }}
      >
        <Doughnut
          data={data}
          onElementsClick={(elems) => {
            console.log("Type clicked: " + types[elems[0]._index]);
            history.push(`/invalid/type/${types[elems[0]._index]}`);
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

export default TypeGraph;
