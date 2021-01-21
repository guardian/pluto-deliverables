import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from 'react-chartjs-2';

interface GraphProps {

}

const DayGraph: React.FC<GraphProps> = (props) => {

    const [invalidCount, setInvalidCount] = useState<[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] | undefined>(
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    );

    const days = ['Sun','Mon','Tues','Weds','Thur','Fri','Sat'];

    const now = new Date();
    const currentDay = days[ now.getDay() ];
    const dayThree = days[(days.indexOf(currentDay)-2+7)%7];
    const dayFour = days[(days.indexOf(currentDay)-3+7)%7];
    const dayFive = days[(days.indexOf(currentDay)-4+7)%7];
    const daySix = days[(days.indexOf(currentDay)-5+7)%7];
    const daySeven = days[(days.indexOf(currentDay)-6+7)%7];
    const dayEight = days[(days.indexOf(currentDay)-7+7)%7];
    const dayNine = days[(days.indexOf(currentDay)-8+7)%7];

    let data = {
        labels: [dayFive, dayFour, dayThree, dayNine, dayEight, daySeven, daySix, dayFive, dayFour, dayThree, 'Yesterday', 'Today'],
        datasets: [
            {
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data: invalidCount
            }
        ]
    };

    const loadInvalidCount = async () => {
        try {
            const response = await axios.get(`/api/invalid/count`);
            return setInvalidCount(response.data);
        } catch (err) {
            console.error("Could not load in invalid count data: ", err);
        }
    };

    useEffect(() => {
        loadInvalidCount();
    }, []);



  return (
    <React.Fragment>
        <Bar
            data={data}
            width={600}
        />

    </React.Fragment>
  );
};

export default DayGraph;
