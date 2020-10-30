import React, {useEffect, useState} from "react";
import axios from 'axios';
import {CircularProgress, Grid} from "@material-ui/core";
import {People} from "@material-ui/icons";

interface BundleInfoComponentProps {
    projectId:number;
    commissionId:number;
    bundleName:string;
    spacing?:0 | 2 | 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}

interface PlutoCoreProject {
    id:number;
    projectTypeId:number;
    title:string;
    created:string;
    updated:string;
    user:string;
    workingGroupId:number;
    commissionId:number;
    status:string;
    productionOffice:string;
}

interface PlutoCoreCommission {
    id:number;
    title:string;
    status:string;
    owner:string;
    productionOffice:string;
}

const BundleInfoComponent:React.FC<BundleInfoComponentProps> = (props) => {
    const [projectInfo, setProjectInfo] = useState<PlutoCoreProject|undefined>(undefined);
    const [commissionInfo, setCommissionInfo] = useState<PlutoCoreCommission|undefined>(undefined);
    const [lastError, setLastError] = useState<string|undefined>(undefined);

    const [loading, setLoading] = useState<boolean>(true);

    const loadCommissionInfo = async () => {
        try {
            const response = await axios({
                method: "get",
                url: `/pluto-core/api/commission/${props.commissionId}`,
                baseURL: `/`,
            })
            setCommissionInfo(response.data as PlutoCoreCommission);
        } catch(err) {
            console.error("Could not load commission data: ", err);
            setLastError(err.toString)
        }
    }

    const loadProjectInfo = async () => {
        try {
            const response = await axios({
                method: "get",
                url: `/pluto-core/api/project/${props.projectId}`,
                baseURL: `/`,
            })
            setCommissionInfo(response.data as PlutoCoreCommission);
        } catch(err) {
            console.error("Could not load project data: ", err);
            setLastError(err.toString)
        }
    }

    /**
     * set loading to false if both commission and project info have loaded, or if there is an error
     */
    useEffect(()=>{
        if((projectInfo && commissionInfo) || lastError) {
            setLoading(false);
        }
    }, [projectInfo, commissionInfo, lastError]);

    /**
     * load in data on mount
     */
    useEffect(()=>{
        loadCommissionInfo();
        loadProjectInfo();
    })

    return <Grid container spacing={props.spacing ?? 3}>
        <Grid item xs={6}>
            {
                loading ? <CircularProgress style={{ width: "14px", height: "14px"}}/> : null
            }
            {
                commissionInfo ? <>
                    <img src="/static/img/icon_commission.png" style={{ height: "16px", marginRight: "0.2em"}} alt="Commission"/>
                    {commissionInfo.title} ({commissionInfo.productionOffice})
                </> : null
            }
        </Grid>
        <Grid item xs={6}>
            {
                projectInfo ? <>
                    <img src="/static/img/icon_project.png" style={{ height: "16px", marginRight: "0.2em"}} alt="Project"/>
                    {projectInfo.title} ({projectInfo.productionOffice})
                </> : null
            }
        </Grid>
        <Grid item xs={12}>
            <p style={{fontStyle: "italic"}}>{props.bundleName}</p>
        </Grid>
        <Grid item xs={12}>
            {projectInfo?.user ? <><People style={{marginRight: "0.2em"}}/>{projectInfo.user}</> : null}
        </Grid>
    </Grid>
}

export default BundleInfoComponent;