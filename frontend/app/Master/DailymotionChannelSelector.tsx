import React, {useState, useEffect} from "react";
import {fetchDailyMotionChannels} from "../utils/dailymotion-service";
import {CircularProgress, MenuItem, Select, Tooltip} from "@material-ui/core";


interface DMChannelSelectorProps {
    id: string;
    onChanged: (newValue:string)=>void;
    value: string;
    label?:string;
    className?: string;
    classes?: any;
}

const DailyMotionChannelSelector:React.FC<DMChannelSelectorProps> = (props) => {
    const [dmChannels, setDmChannels] = useState<DailyMotionChannel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [lastError, setLastError] = useState<string|undefined>(undefined);
    
    useEffect(()=> {
        setLoading(true);
        fetchDailyMotionChannels()
            .then(dmChannelList=>setDmChannels(dmChannelList))
            .catch(err=>setLastError(err))
            .finally(()=>setLoading(false))
    }, []);

    if(loading) {
        return <Tooltip title="loading from Daily Motion...">
            <CircularProgress style={{width: "16px"}}/>
        </Tooltip>
    }

    return <>
        {lastError ? <p className="error">{lastError}</p> :
            <Select value={props.value} id={props.id} label={props.label} className={props.className} classes={props.classes} onChange={(evt)=>props.onChanged(evt.target.value as string)}>
                {
                    dmChannels.map((chan, idx)=><MenuItem value={chan.id} key={idx}>{chan.name}</MenuItem>)
                }
            </Select>
        }
        </>
}

export default DailyMotionChannelSelector;