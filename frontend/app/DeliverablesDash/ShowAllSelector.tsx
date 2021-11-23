import React, {useState} from "react";
import {Link} from "@material-ui/core";

interface ShowAllSelectorProps {
    value: boolean;
    onChange: (newValue:boolean)=>void;
}

const ShowAllSelector:React.FC<ShowAllSelectorProps> = (props) => {
    return <>
        {
            props.value ?
                <Link onClick={()=>props.onChange(false)} style={{cursor: "pointer"}}>hide</Link> :
                <Link onClick={()=>props.onChange(true)}  style={{cursor: "pointer"}}>show all</Link>
        }
    </>
}

export default ShowAllSelector;