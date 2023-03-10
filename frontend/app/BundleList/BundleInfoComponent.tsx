import React, { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress, Grid, makeStyles } from "@material-ui/core";
import { People } from "@material-ui/icons";
import CommissionIcon from "@guardian/pluto-headers/build/static/c.svg";
import ProjectIcon from "@guardian/pluto-headers/build/static/p.svg";

interface BundleInfoComponentProps {
  projectId: number;
  commissionId: number;
  bundleName: string;
  spacing?: 0 | 2 | 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  maxWidth?: string;
}

interface PlutoCoreProject {
  id: number;
  projectTypeId: number;
  title: string;
  created: string;
  updated: string;
  user: string;
  workingGroupId: number;
  commissionId: number;
  status: string;
  productionOffice: string;
}

interface PlutoCoreCommission {
  id: number;
  title: string;
  status: string;
  owner: string;
  productionOffice: string;
}

const useStyles = makeStyles((theme) => ({
  inlineIcon: {
    height: "16px",
    marginRight: "0.2em",
    verticalAlign: "middle",
  },
}));

const BundleInfoComponent: React.FC<BundleInfoComponentProps> = (props) => {
  const [projectInfo, setProjectInfo] = useState<PlutoCoreProject | undefined>(
    undefined
  );
  const [commissionInfo, setCommissionInfo] = useState<
    PlutoCoreCommission | undefined
  >(undefined);
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const classes = useStyles();

  const loadCommissionInfo = async () => {
    try {
      const response = await axios({
        method: "get",
        url: `/pluto-core/api/pluto/commission/${props.commissionId}`,
        baseURL: `/`,
      });
      response.data.hasOwnProperty("result")
        ? setCommissionInfo(response.data.result as PlutoCoreCommission)
        : setLastError("Commission data was not valid");
    } catch (err) {
      console.error("Could not load commission data: ", err);
      setCommissionInfo(undefined);
      setLastError("Could not load commission data");
    }
  };

  const loadProjectInfo = async () => {
    try {
      const response = await axios({
        method: "get",
        url: `/pluto-core/api/project/${props.projectId}`,
        baseURL: `/`,
      });
      response.data.hasOwnProperty("result")
        ? setProjectInfo(response.data.result as PlutoCoreProject)
        : setLastError("Project data was not valid");
    } catch (err) {
      console.error("Could not load project data: ", err);
      setProjectInfo(undefined);
      setLastError("Could not load project data");
    }
  };

  /**
   * set loading to false if both commission and project info have loaded, or if there is an error
   */
  useEffect(() => {
    if ((projectInfo && commissionInfo) || lastError) {
      setLoading(false);
    }
  }, [projectInfo, commissionInfo, lastError]);

  /**
   * load in data on mount
   */
  useEffect(() => {
    loadCommissionInfo();
    loadProjectInfo();
  }, []);

  /**
   * load in data on update
   */
  useEffect(() => {
    loadProjectInfo();
  }, [props.projectId]);

  useEffect(() => {
    loadCommissionInfo();
  }, [props.commissionId]);

  return (
    <Grid
      container
      spacing={props.spacing ?? 3}
      style={{ maxWidth: props.maxWidth }}
    >
      <Grid item xs={6} style={{ paddingBottom: 0 }}>
        {loading ? (
          <CircularProgress style={{ width: "14px", height: "14px" }} />
        ) : null}
        {commissionInfo ? (
          <>
            <img src={CommissionIcon} alt="C" className={classes.inlineIcon} />
            {commissionInfo.title} ({commissionInfo.productionOffice})
          </>
        ) : null}
      </Grid>
      <Grid item xs={6} style={{ paddingBottom: 0 }}>
        {projectInfo ? (
          <>
            <img src={ProjectIcon} alt="P" className={classes.inlineIcon} />
            {projectInfo.title} ({projectInfo.productionOffice})
          </>
        ) : null}
      </Grid>
      <Grid item xs={6} style={{ paddingBottom: 0 }}>
        <p style={{ fontStyle: "italic", padding: 0, margin: 0 }}>
          {props.bundleName}
        </p>
      </Grid>
      <Grid item xs={6} style={{ paddingBottom: 0 }}>
        {projectInfo?.user ? (
          <>
            <People style={{ marginRight: "0.2em", verticalAlign: "middle" }} />
            {projectInfo.user}
          </>
        ) : null}
      </Grid>
    </Grid>
  );
};

export default BundleInfoComponent;
