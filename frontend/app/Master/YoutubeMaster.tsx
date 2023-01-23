import React, { useEffect, useState } from "react";
import { RouteComponentProps, useHistory } from "react-router-dom";
import { SystemNotifcationKind, SystemNotification } from "@guardian/pluto-headers";
import EmbeddableYTForm from "../DeliverableItem/EmbeddableYTForm";
import axios from "axios";
import { Button } from "@material-ui/core";
import { ChevronLeft } from "@material-ui/icons";

interface YoutubeMasterProps
  extends RouteComponentProps<{ projectid: string; assetid: string }> {}

const YoutubeMaster: React.FC<YoutubeMasterProps> = (props) => {
  const history = useHistory();

  const [ytData, setYTData] = useState<YoutubeMaster | undefined>(undefined);
  const emptyRecord: YoutubeMaster = {
    publication_date: "",
    youtube_description: "",
    youtube_id: "",
    youtube_tags: [],
    youtube_title: "",
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get<YoutubeMaster>(
          `/api/bundle/${props.match.params.projectid}/asset/${props.match.params.assetid}/youtube`,
          { validateStatus: (status) => status == 200 || status == 404 }
        );
        switch (response.status) {
          case 200:
            setYTData(response.data);
            break;
          case 404:
            setYTData(emptyRecord);
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
      <EmbeddableYTForm
        content={ytData}
        deliverableId={BigInt(parseInt(props.match.params.projectid))}
        bundleId={parseInt(props.match.params.assetid)}
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

export default YoutubeMaster;
