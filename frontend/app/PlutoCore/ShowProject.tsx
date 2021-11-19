import React, {useEffect, useState} from "react";
import axios from "axios";
import {SystemNotifcationKind, SystemNotification} from "pluto-headers";
import ProjectIcon from "pluto-headers/src/static/p.svg";
import {makeStyles} from "@material-ui/core";

interface ShowProjectProps {
    projectId:number;
}

const useStyles = makeStyles((theme) => ({
    inlineIcon: {
        height: "16px",
        marginRight: "0.2em",
        verticalAlign: "middle",
    },
}));

/**
 * UI component to display the name of the commission and the production office
 * @param props
 * @constructor
 */
const ShowProject:React.FC<ShowProjectProps> = (props) => {
    const [projectInfo, setProjectInfo] = useState<
        PlutoCoreProject | undefined
        >(undefined);

    const classes = useStyles();

    const loadProjectInfo = async () => {
        try {
            const response = await axios.get<PlutoCoreProjectResponse>(
                `../pluto-core/api/project/${props.projectId}`
            );
            response.data.hasOwnProperty("result")
                ? setProjectInfo(response.data.result as PlutoCoreProject)
                : SystemNotification.open(SystemNotifcationKind.Error, "Project data was not valid");
        } catch (err) {
            console.error("Could not load project data: ", err);
            setProjectInfo(undefined);
            SystemNotification.open(SystemNotifcationKind.Error, "Could not load project data");
        }
    };

    /**
     * Load in data on update.
     */
    useEffect(() => {
        loadProjectInfo();
    }, [props.projectId]);

    return <>
        <img src={ProjectIcon} alt="P" className={classes.inlineIcon} />
        {projectInfo?.title}
    </>
}

export default ShowProject;