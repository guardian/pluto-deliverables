import React, { useEffect, useState } from "react";
import { Button } from "@material-ui/core";
import { RouteComponentProps, useHistory } from "react-router-dom";

import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import axios from "axios";
import { ChevronLeft } from "@material-ui/icons";
import EmbeddableMSForm from "../DeliverableItem/EmbeddableMSForm";

interface MainstreamMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {}

const MainstreamMaster: React.FC<MainstreamMasterProps> = (props) => {
  const history = useHistory();

  const [msData, setMSData] = useState<MainstreamMaster | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get<MainstreamMaster>(
          `/api/bundle/${props.match.params.projectid}/asset/${props.match.params.assetid}/mainstream`,
          { validateStatus: (status) => status == 200 || status == 404 }
        );
        switch (response.status) {
          case 200:
            setMSData(response.data);
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
        console.error("Could not load Mainstream information: ", err);
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
        <EmbeddableMSForm
          content={msData}
          deliverableId={props.match.params.assetid}
          bundleId={props.match.params.projectid}
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
export default MainstreamMaster;
