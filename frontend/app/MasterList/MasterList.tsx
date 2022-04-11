import React, { useState, useEffect } from "react";
import {
  makeStyles,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tooltip,
} from "@material-ui/core";
import moment from "moment";
import guardianEnabled from "../static/guardian_enabled.png";
import guardianDisabled from "../static/guardian_disabled.png";
import youtubeEnabled from "../static/youtube_enabled.png";
import youtubeDisabled from "../static/youtube_disabled.png";
import dailymotionEnabled from "../static/dailymotion_enabled.jpg";
import dailymotionDisabled from "../static/dailymotion_disabled.jpg";
import mainstreamEnabled from "../static/mainstream_enabled.png";
import mainstreamDisabled from "../static/mainstream_disabled.png";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import { MasterEnum } from "../utils/constants";
import {
  getDeliverableGNM,
  getDeliverableYoutube,
  getDeliverableDailymotion,
  getDeliverableMainstream,
} from "../utils/master-api-service";
import { SystemNotification, SystemNotifcationKind } from "pluto-headers";
import SyndicationTrigger from "./SyndicationTrigger";
import SyndicationLastLog from "./SyndicationLastLog";
import ViewListIcon from "@material-ui/icons/ViewList";

const useStyles = makeStyles({
  tableContainer: {
    padding: "0 1rem",
  },
  masterList: {
    display: "flex",
    alignItems: "center",
    paddingBottom: "1rem",
    width: "100%",
    visibility: "visible",
    "&.loading": {
      transition: "all 0.2s",
      visibility: "hidden",
    },
    "& .tags .chip": {
      margin: "2px",
    },
    "& .no-overflow": {
      textOverflow: "ellipsis",
      display: "inline-block",
      overflow: "hidden",
      width: "250px",
      whiteSpace: "nowrap",
    },
    "& img": {
      display: "flex",
      width: "30px",
      height: "30px",
    },
  },
});

const tableHeaderTitles: string[] = [
  "Group",
  "",
  "Publish date",
  "ID Link",
  "Title",
  "",
  "",
  "",
  "",
  "",
];

declare var deploymentRootPath: string;

interface MasterListProps {
  deliverable: Deliverable;
  project_id: number;
  onSyndicationInitiated: (assetId: bigint) => void | undefined;
}

const MasterList: React.FC<MasterListProps> = (props) => {
  const classes = useStyles();
  const { deliverable, project_id } = props;
  const projectIdUrl = `${deploymentRootPath}project/${project_id.toString()}/asset/${deliverable.id.toString()}`;
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTimerId, setRefreshTimerId] = useState<number | undefined>(
    undefined
  );

  const [masters, setMasters] = useState<Master[]>([
    {
      group: MasterEnum.Guardian,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
      upload_status: null,
    },
    {
      group: MasterEnum.Youtube,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
      upload_status: null,
    },
    {
      group: MasterEnum.Dailymotion,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
      upload_status: null,
      routename: null,
      job_id: null,
    },
    {
      group: MasterEnum.Mainstream,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
      upload_status: null,
      routename: null,
      job_id: null,
    },
  ]);

  const displayError = (error: any) => {
    if (error) {
      SystemNotification.open(SystemNotifcationKind.Error, error?.toString());
    }
  };

  useEffect(() => {
    console.debug("registering clear handler for refreshtimer");
    return () => {
      if (refreshTimerId) {
        console.debug("clearing refresh timer ", refreshTimerId);
        window.clearInterval(refreshTimerId);
      }
    };
  }, [refreshTimerId]);

  const startRegularRefresh = () => {
    const timerId = window.setInterval(loadData, 3000);
    setRefreshTimerId(timerId);
  };

  const loadData = async () => {
    let gnmMaster: GuardianMaster;
    try {
      gnmMaster = await getDeliverableGNM(
        project_id.toString(),
        deliverable.id.toString()
      );
    } catch (error) {
      displayError(error);
    }

    let youtubeMaster: YoutubeMaster;
    try {
      youtubeMaster = await getDeliverableYoutube(
        project_id.toString(),
        deliverable.id.toString()
      );
    } catch (error) {
      displayError(error);
    }

    let dailymotionMaster: DailymotionMaster;
    try {
      dailymotionMaster = await getDeliverableDailymotion(
        project_id.toString(),
        deliverable.id.toString()
      );
    } catch (error) {
      displayError(error);
    }

    let mainstreamMaster: MainstreamMaster;
    try {
      mainstreamMaster = await getDeliverableMainstream(
        project_id.toString(),
        deliverable.id.toString()
      );
    } catch (error) {
      displayError(error);
    }

    const updatedMasters = masters.map((master) => {
      if (master.group === MasterEnum.Guardian && gnmMaster) {
        return {
          group: MasterEnum.Guardian,
          publication_date: gnmMaster.publication_date,
          title: gnmMaster.website_title,
          link: gnmMaster.media_atom_id || "",
          tags: gnmMaster.tags,
          upload_status: gnmMaster.upload_status,
        };
      }
      if (master.group === MasterEnum.Youtube && youtubeMaster) {
        return {
          group: MasterEnum.Youtube,
          publication_date: youtubeMaster.publication_date,
          title: youtubeMaster.youtube_title,
          link: youtubeMaster.youtube_id,
          tags: youtubeMaster.youtube_tags,
          upload_status: null,
        };
      }
      if (master.group === MasterEnum.Dailymotion && dailymotionMaster) {
        return {
          group: MasterEnum.Dailymotion,
          publication_date: dailymotionMaster.publication_date,
          title: dailymotionMaster.daily_motion_title,
          link: dailymotionMaster.daily_motion_url,
          tags: dailymotionMaster.daily_motion_tags,
          upload_status: dailymotionMaster.upload_status,
          routename: dailymotionMaster.routename,
          job_id: dailymotionMaster.job_id,
        };
      }
      if (master.group === MasterEnum.Mainstream && mainstreamMaster) {
        return {
          group: MasterEnum.Mainstream,
          publication_date: "",
          title: mainstreamMaster.mainstream_title,
          link: "",
          tags: mainstreamMaster.mainstream_tags,
          upload_status: mainstreamMaster.upload_status,
          routename: mainstreamMaster.routename,
          job_id: mainstreamMaster.job_id,
        };
      }
      return master;
    });
    setLoading(false);

    setMasters(updatedMasters);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTypeImageSource = (master: Master) => {
    const { group, title } = master;
    const isEnabled = !!title;

    switch (group) {
      case MasterEnum.Guardian:
        return isEnabled ? guardianEnabled : guardianDisabled;
      case MasterEnum.Youtube:
        return isEnabled ? youtubeEnabled : youtubeDisabled;
      case MasterEnum.Dailymotion:
        return isEnabled ? dailymotionEnabled : dailymotionDisabled;
      case MasterEnum.Mainstream:
        return isEnabled ? mainstreamEnabled : mainstreamDisabled;
    }
  };

  const getPublicationText = (master: Master): string => {
    const { title, publication_date } = master;

    if (title === null && publication_date) {
      return `Publication FAILED ${moment(publication_date).format(
        "ddd Do MMM, HH:mm"
      )}`;
    }

    if (publication_date) {
      return `Published since ${moment(publication_date).format(
        "ddd Do MMM, HH:mm"
      )}`;
    }

    if (title) {
      return "Not sent yet";
    }

    return "";
  };

  const getMasterLink = (master: Master): string => {
    switch (master.group) {
      case MasterEnum.Guardian:
        return `${projectIdUrl}/atom`;
      case MasterEnum.Youtube:
        return `${projectIdUrl}/youtube`;
      case MasterEnum.Dailymotion:
        return `${projectIdUrl}/dailymotion`;
      case MasterEnum.Mainstream:
        return `${projectIdUrl}/mainstream`;
    }

    return "";
  };

  const getMediaLink = (master: Master): string => {
    switch (master.group) {
      case MasterEnum.Guardian:
        return `https://video.gutools.co.uk/${master.link}`;
      case MasterEnum.Youtube:
        return `https://www.youtube.com/watch?v=${master.link}`;
    }

    return master.link || "";
  };

  return (
    <div className={`${classes.masterList}${loading ? " loading" : ""}`}>
      <TableContainer className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              {tableHeaderTitles.map((title, index) => (
                <TableCell key={index}>{title}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {masters.map((master, index) => (
              <TableRow key={index}>
                <TableCell>
                  <img
                    src={getTypeImageSource(master)}
                    alt={`${master.group} image`}
                  />
                </TableCell>
                <TableCell>
                  {`${master.group.charAt(0).toUpperCase()}${master.group.slice(
                    1
                  )}`}
                </TableCell>

                <TableCell className="publication-text">
                  {getPublicationText(master)}
                </TableCell>
                <TableCell className="link">
                  {master.link ? (
                    <a
                      className="no-overflow"
                      target="_blank"
                      href={getMediaLink(master)}
                    >
                      {getMediaLink(master)}
                    </a>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className="platform">
                  {master.title ? master.title : ""}
                </TableCell>
                <TableCell className="tags">
                  {(master.tags || []).map((tag, index) => (
                    <Chip
                      className="chip"
                      key={index}
                      variant="outlined"
                      size="small"
                      label={tag}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  {master.title ? (
                    <Tooltip title="View/edit syndication information">
                      <IconButton href={getMasterLink(master)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Add syndication information">
                      <IconButton href={getMasterLink(master)}>
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell style={{ width: "96px" }}>
                  {master.group != MasterEnum.Guardian &&
                  master.group != MasterEnum.Youtube ? (
                    <SyndicationTrigger
                      uploadStatus={master.upload_status}
                      platform={master.group}
                      projectId={props.project_id}
                      assetId={deliverable.id}
                      sendInitiated={() => startRegularRefresh()}
                      title={master.title}
                      link={master.link}
                    />
                  ) : null}
                </TableCell>
                <TableCell>
                  <SyndicationLastLog
                    uploadStatus={master.upload_status}
                    platform={master.group}
                    projectId={props.project_id}
                    assetId={deliverable.id}
                  />
                </TableCell>
                <TableCell style={{ width: "96px" }}>
                  {master.job_id ? (
                    <Tooltip title="Upload Log">
                      <IconButton
                        // This is limited to fifty seven characters because CDS is only writing up to fifty seven character long file names not including the file extension.
                        href={`/cds/logByJobName/${master.job_id.substring(
                          0,
                          57
                        )}`}
                      >
                        <ViewListIcon />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
export default MasterList;
