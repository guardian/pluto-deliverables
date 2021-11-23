import React, { useEffect, useState } from "react";
import axios from "axios";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import CommissionIcon from "pluto-headers/src/static/c.svg";
import { makeStyles } from "@material-ui/core";

interface ShowCommissionProps {
  commissionId: number;
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
const ShowCommission: React.FC<ShowCommissionProps> = (props) => {
  const [commissionName, setCommissionName] = useState<string | undefined>(
    undefined
  );

  const classes = useStyles();

  const loadCommissionInfo = async () => {
    try {
      const response = await axios.get<PlutoCoreCommissionResponse>(
        `/pluto-core/api/pluto/commission/${props.commissionId}`
      );
      const commissionInfo = response.data.result as PlutoCoreCommission;
      response.data.hasOwnProperty("result")
        ? setCommissionName(
            commissionInfo.title + " (" + commissionInfo.productionOffice + ")"
          )
        : SystemNotification.open(
            SystemNotifcationKind.Error,
            "Commission data was not valid"
          );
    } catch (err) {
      console.error("Could not load commission data: ", err);
      setCommissionName(`${props.commissionId} not found`);
      SystemNotification.open(
        SystemNotifcationKind.Error,
        "Could not load commission data"
      );
    }
  };

  useEffect(() => {
    loadCommissionInfo();
  }, [props.commissionId]);

  return (
    <>
      <img src={CommissionIcon} alt="C" className={classes.inlineIcon} />
      {commissionName ?? ""}
    </>
  );
};

export default ShowCommission;
