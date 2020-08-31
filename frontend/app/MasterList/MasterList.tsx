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
import SystemNotification, {
  SystemNotificationKind,
} from "../SystemNotification";

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
];

declare var deploymentRootPath: string;

interface MasterListProps {
  deliverable: Deliverable;
}

const MasterList: React.FC<MasterListProps> = (props) => {
  const classes = useStyles();
  const { deliverable } = props;
  const projectIdUrl = `${deploymentRootPath}project/${deliverable.deliverable.toString()}/asset/${deliverable.id.toString()}`;
  const [loading, setLoading] = useState<boolean>(true);
  const [masters, setMasters] = useState<Master[]>([
    {
      group: MasterEnum.Guardian,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
    },
    {
      group: MasterEnum.Youtube,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
    },
    {
      group: MasterEnum.Dailymotion,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
    },
    {
      group: MasterEnum.Mainstream,
      publication_date: null,
      title: null,
      link: null,
      tags: null,
    },
  ]);

  const displayError = (error: any) => {
    if (error) {
      SystemNotification.open(SystemNotificationKind.Error, error?.toString());
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      let gnmMaster: GuardianMaster;
      try {
        gnmMaster = await getDeliverableGNM(
          deliverable.deliverable.toString(),
          deliverable.id.toString()
        );
      } catch (error) {
        displayError(error);
      }

      let youtubeMaster: YoutubeMaster;
      try {
        youtubeMaster = await getDeliverableYoutube(
          deliverable.deliverable.toString(),
          deliverable.id.toString()
        );
      } catch (error) {
        displayError(error);
      }

      let dailymotionMaster: DailymotionMaster;
      try {
        dailymotionMaster = await getDeliverableDailymotion(
          deliverable.deliverable.toString(),
          deliverable.id.toString()
        );
      } catch (error) {
        displayError(error);
      }

      let mainstreamMaster: MainstreamMaster;
      try {
        mainstreamMaster = await getDeliverableMainstream(
          deliverable.deliverable.toString(),
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
          };
        }
        if (master.group === MasterEnum.Youtube && youtubeMaster) {
          return {
            group: MasterEnum.Youtube,
            publication_date: youtubeMaster.publication_date,
            title: youtubeMaster.youtube_title,
            link: youtubeMaster.youtube_id,
            tags: youtubeMaster.youtube_tags,
          };
        }
        if (master.group === MasterEnum.Dailymotion && dailymotionMaster) {
          return {
            group: MasterEnum.Dailymotion,
            publication_date: dailymotionMaster.publication_date,
            title: "",
            link: dailymotionMaster.dailymotion_url,
            tags: dailymotionMaster.dailymotion_tags,
          };
        }
        if (master.group === MasterEnum.Mainstream && mainstreamMaster) {
          return {
            group: MasterEnum.Mainstream,
            publication_date: "",
            title: mainstreamMaster.mainstream_title,
            link: "",
            tags: mainstreamMaster.mainstream_tags,
          };
        }
        return master;
      });

      setLoading(false);

      setMasters(updatedMasters);
    };

    if (isMounted) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
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

  const getMasterLink = (master: Master, edit = false): string => {
    const form = edit ? "" : "/new";

    switch (master.group) {
      case MasterEnum.Guardian:
        return `${projectIdUrl}/atom${form}`;
      case MasterEnum.Youtube:
        return `${projectIdUrl}/youtube${form}`;
      case MasterEnum.Dailymotion:
        return `${projectIdUrl}/dailymotion${form}`;
      case MasterEnum.Mainstream:
        return `${projectIdUrl}/mainstream${form}`;
    }

    return "";
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
                  ></img>
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
                      href={master.link}
                    >
                      {master.link}
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
                    ></Chip>
                  ))}
                </TableCell>
                <TableCell>
                  {master.title ? (
                    <IconButton href={getMasterLink(master, true)}>
                      <EditIcon />
                    </IconButton>
                  ) : (
                    <IconButton href={getMasterLink(master)}>
                      <AddIcon />
                    </IconButton>
                  )}
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
