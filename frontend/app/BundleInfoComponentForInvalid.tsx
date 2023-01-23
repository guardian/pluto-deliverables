import React, { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress, Grid, makeStyles } from "@material-ui/core";
import { People } from "@material-ui/icons";
import CommissionIcon from "@guardian/pluto-headers/src/static/c.svg";
import ProjectIcon from "@guardian/pluto-headers/src/static/p.svg";

interface BundleInfoComponentProps {
  projectId: number;
  commissionId: number;
  bundleName: string;
  spacing?: 0 | 2 | 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  maxWidth?: string;
}

const useStyles = makeStyles((theme) => ({
  inlineIcon: {
    height: "16px",
    marginRight: "0.2em",
    verticalAlign: "middle",
  },
}));

const BundleInfoComponentForInvalid: React.FC<BundleInfoComponentProps> = (
  props
) => {
  const classes = useStyles();
  const [projectInfo, setProjectInfo] = useState<PlutoCoreProject | undefined>(
    undefined
  );
  const [commissionInfo, setCommissionInfo] = useState<
    PlutoCoreCommission | undefined
  >(undefined);
  const [lastError, setLastError] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState<boolean>(true);

  const loadCommissionInfo = async () => {
    try {
      const response = await axios.get<PlutoCoreCommissionResponse>(
        `/pluto-core/api/pluto/commission/${props.commissionId}`
      );
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
      const response = await axios.get<PlutoCoreProjectResponse>(
        `../pluto-core/api/project/${props.projectId}`
      );
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
   * Set loading to false if both commission and project info have loaded, or if there is an error.
   */
  useEffect(() => {
    if ((projectInfo && commissionInfo) || lastError) {
      setLoading(false);
    }
  }, [projectInfo, commissionInfo, lastError]);

  /**
   * Load in data on update.
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
      <Grid item xs={12} style={{ paddingBottom: 0 }}>
        {loading ? (
          <CircularProgress style={{ width: "14px", height: "14px" }} />
        ) : null}
        <>
          <img src={CommissionIcon} alt="C" className={classes.inlineIcon} />
          {commissionInfo
            ? `${commissionInfo.title} (${commissionInfo.productionOffice})`
            : `${props.commissionId} not found`}
        </>
      </Grid>
      <Grid item xs={12} style={{ paddingBottom: 0 }}>
        <>
          <img src={ProjectIcon} alt="P" className={classes.inlineIcon} />
          {projectInfo
            ? `${projectInfo.title} (${projectInfo.productionOffice})`
            : `${props.projectId} not found`}
        </>
      </Grid>
      <Grid item xs={12} style={{ paddingBottom: 0 }}>
        {projectInfo?.user ? (
          <>
            <People className={classes.inlineIcon} />
            {projectInfo.user}
          </>
        ) : null}
      </Grid>
    </Grid>
  );
};

export default BundleInfoComponentForInvalid;
