import React, { useState, useEffect } from "react";
import { Button } from "@material-ui/core";
import { useHistory, RouteComponentProps } from "react-router-dom";
import {
  SystemNotification,
  SystemNotifcationKind,
} from "@guardian/pluto-headers";
import axios from "axios";
import { ChevronLeft } from "@material-ui/icons";
import EmbeddableDMForm from "../DeliverableItem/EmbeddableDMForm";

interface DailymotionMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {}

const DailymotionMaster: React.FC<DailymotionMasterProps> = (props) => {
  const history = useHistory();

  const [dmData, setDMData] = useState<DailymotionMaster | undefined>(
    undefined
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get<DailymotionMaster>(
          `/api/bundle/${props.match.params.projectid}/asset/${props.match.params.assetid}/dailymotion`,
          { validateStatus: (status) => status == 200 || status == 404 }
        );
        switch (response.status) {
          case 200:
            setDMData(response.data);
            break;
          case 404:
            break;
          default:
            SystemNotification.open(
              SystemNotifcationKind.Error,
              `Got unexpected response ${response.status} from server`
            );
        }
      } catch (err) {
        console.error("Could not load youtube information: ", err);
        SystemNotification.open(
          SystemNotifcationKind.Error,
          "Could not load data, see browser console for more information"
        );
      }
    };
    loadData();
  }, []);

  return (
    <>
      <EmbeddableDMForm
        content={dmData}
        deliverableId={BigInt(parseInt(props.match.params.assetid))}
        bundleId={parseInt(props.match.params.projectid)}
        didUpdate={() => history.goBack()}
      />
      <Button
        startIcon={<ChevronLeft />}
        onClick={() => history.goBack()}
        variant="contained"
        color="secondary"
      >
        Go back
      </Button>
    </>
  );
};
export default DailymotionMaster;
