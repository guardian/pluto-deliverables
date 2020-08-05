import React, {ReactComponentElement} from "react";
import {RouteComponentProps} from "react-router";
import {useHistory, useLocation} from "react-router-dom";
import Select from "@material-ui/core/Select";
import {MenuItem} from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from '@material-ui/core/FormHelperText';

interface DeliverableTypeSelectorProps {
    content: DeliverableTypes;
    value: number | null;
    onChange: (newvalue:number)=>void;
    showTip: boolean;
}

const DeliverableTypeSelector: React.FC<DeliverableTypeSelectorProps> = (props)=>{

    return (
        <FormControl>
            <Select value={props.value ?? ""} onChange={(evt)=>props.onChange(parseInt(evt.target.value as string))}>
                {Object.keys(props.content).map((section_name, idx)=>{
                    const section_content = props.content[section_name];
                    console.log(section_content);
                    section_content.map((entry,idx)=>(
                        <MenuItem key={entry[0]} value={entry[0]}>{entry[1]}</MenuItem>
                    ))
                })}
            </Select>
            {props.showTip ? <FormHelperText>Select a type to begin media ingest</FormHelperText> : ""}
        </FormControl>
    )
};

export default DeliverableTypeSelector;