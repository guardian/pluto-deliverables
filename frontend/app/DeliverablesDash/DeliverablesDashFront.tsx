import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {FormControl, Grid, InputLabel, TextField, Typography} from "@material-ui/core";
import DateFnsUtils from '@date-io/date-fns';
import DeliverablesDashList from "./DeliverablesDashList";
import {DatePicker, MuiPickersUtilsProvider} from "@material-ui/pickers";

const DeliverablesDashFront:React.FC = ()=>{
    const [startDateEntered, setStartDateEntered] = useState<Date>(()=>{
        let d = new Date();
        d.setDate(1);
        return d;
    });
    const [finishDateEntered, setFinishDateEntered] = useState<Date>(new Date());

    console.log("startDateEntered: ", startDateEntered);
    console.log("finishDateEntered: ", finishDateEntered);

    return <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Helmet>
            <title>Deliverables Dashboard</title>
        </Helmet>
        <Typography variant="h2">
            Deliverables Dashboard
        </Typography>
        <Grid container justify="flex-end" spacing={3}>
            <Grid item>
                <DatePicker
                    label="Search from"
                    value={startDateEntered}
                    onChange={(newValue)=>setStartDateEntered(newValue ?? new Date())}
                    />
            </Grid>
            <Grid item>
                <DatePicker
                    label="Search until"
                    value={finishDateEntered}
                    onChange={(newValue)=>setFinishDateEntered(newValue ?? new Date())}
                />
            </Grid>
        </Grid>
        <DeliverablesDashList startDate={startDateEntered} endDate={finishDateEntered}/>

    </MuiPickersUtilsProvider>
}

export default DeliverablesDashFront;