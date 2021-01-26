import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { useHistory } from "react-router-dom";

interface GraphProps {}

const DayGraph: React.FC<GraphProps> = (props) => {
  const [invalidCount, setInvalidCount] = useState<
    | [
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
    | undefined
  >([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const days = ["Sun", "Mon", "Tues", "Weds", "Thur", "Fri", "Sat"];

  const now = new Date();
  const currentDay = days[now.getDay()];
  const dayThree = days[(days.indexOf(currentDay) - 2 + 7) % 7];
  const dayFour = days[(days.indexOf(currentDay) - 3 + 7) % 7];
  const dayFive = days[(days.indexOf(currentDay) - 4 + 7) % 7];
  const daySix = days[(days.indexOf(currentDay) - 5 + 7) % 7];
  const daySeven = days[(days.indexOf(currentDay) - 6 + 7) % 7];
  const dayEight = days[(days.indexOf(currentDay) - 7 + 7) % 7];
  const dayNine = days[(days.indexOf(currentDay) - 8 + 7) % 7];

  let data = {
    labels: [
      dayFive,
      dayFour,
      dayThree,
      dayNine,
      dayEight,
      daySeven,
      daySix,
      dayFive,
      dayFour,
      dayThree,
      "Yesterday",
      "Today",
    ],
    datasets: [
      {
        backgroundColor: "rgba(255,99,132,0.2)",
        borderColor: "rgba(255,99,132,1)",
        borderWidth: 1,
        hoverBackgroundColor: "rgba(255,99,132,0.4)",
        hoverBorderColor: "rgba(255,99,132,1)",
        data: invalidCount,
      },
    ],
  };

  let dateTwo = new Date();
  dateTwo.setDate(dateTwo.getDate() - 1);
  let dateThree = new Date();
  dateThree.setDate(dateThree.getDate() - 2);
  let dateFour = new Date();
  dateFour.setDate(dateFour.getDate() - 3);
  let dateFive = new Date();
  dateFive.setDate(dateFive.getDate() - 4);
  let dateSix = new Date();
  dateSix.setDate(dateSix.getDate() - 5);
  let dateSeven = new Date();
  dateSeven.setDate(dateSeven.getDate() - 6);
  let dateEight = new Date();
  dateEight.setDate(dateEight.getDate() - 7);
  let dateNine = new Date();
  dateNine.setDate(dateNine.getDate() - 8);
  let dateTen = new Date();
  dateTen.setDate(dateTen.getDate() - 9);
  let dateEleven = new Date();
  dateEleven.setDate(dateEleven.getDate() - 10);
  let dateTwelve = new Date();
  dateTwelve.setDate(dateTwelve.getDate() - 11);

  const dates = [
    dateTwelve.toISOString().split("T")[0],
    dateEleven.toISOString().split("T")[0],
    dateTen.toISOString().split("T")[0],
    dateNine.toISOString().split("T")[0],
    dateEight.toISOString().split("T")[0],
    dateSeven.toISOString().split("T")[0],
    dateSix.toISOString().split("T")[0],
    dateFive.toISOString().split("T")[0],
    dateFour.toISOString().split("T")[0],
    dateThree.toISOString().split("T")[0],
    dateTwo.toISOString().split("T")[0],
    now.toISOString().split("T")[0],
  ];

  const loadInvalidCount = async () => {
    try {
      const response = await axios.get(`/api/invalid/count`);
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
      <div style={{ width: "800px", height: "400px", float: "left" }}>
        <Bar
          data={data}
          onElementsClick={(elems) => {
            console.log("Date clicked: " + dates[elems[0]._index]);
            history.push(`/invalid/date/${dates[elems[0]._index]}`);
          }}
        />
      </div>
    </React.Fragment>
  );
};

export default DayGraph;
