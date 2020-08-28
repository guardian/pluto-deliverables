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
} from "./helpers";
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
  const projectIdUrl = `${deploymentRootPath}project/${deliverable.id.toString()}`;
  const [masters, setMasters] = useState<Master[]>([
    {
      group: MasterEnum.Guardian,
    },
    {
      group: MasterEnum.Youtube,
    },
    {
      group: MasterEnum.Dailymotion,
    },
    {
      group: MasterEnum.Mainstream,
    },
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [
          gnmMaster,
          youtubeMaster,
          dailymotionMaster,
          mainstreamMaster,
        ] = await Promise.all([
          getDeliverableGNM(deliverable.deliverable, deliverable.id),
          getDeliverableYoutube(deliverable.deliverable, deliverable.id),
          getDeliverableDailymotion(deliverable.deliverable, deliverable.id),
          getDeliverableMainstream(deliverable.deliverable, deliverable.id),
        ]);

        if (typeof gnmMaster === "string") {
          throw "Failed to load GNM Master";
        }

        const updatedMasters = masters.map((master) => {
          if (master.group === MasterEnum.Guardian) {
            return { ...gnmMaster, group: MasterEnum.Guardian };
          }
          if (master.group === MasterEnum.Youtube) {
            return { ...youtubeMaster, group: MasterEnum.Guardian };
          }
          if (master.group === MasterEnum.Dailymotion) {
            return { ...dailymotionMaster, group: MasterEnum.Guardian };
          }
          if (master.group === MasterEnum.Mainstream) {
            return { ...mainstreamMaster, group: MasterEnum.Guardian };
          }
          return master;
        });

        setMasters(updatedMasters);
      } catch (error) {
        console.error(error);
        SystemNotification.open(SystemNotificationKind.Error, error);
      }
    };

    if (isMounted) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const getTypeImageSource = (master: Master) => {
    const { group, sent, publicationFailed } = master;
    const isEnabled = sent && publicationFailed !== true;

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
    const { id, sent, publicationFailed, sentDate } = master;

    if (sent && publicationFailed) {
      return `Publication FAILED ${moment(sentDate).format(
        "ddd Do MMM, HH:mm"
      )}`;
    }

    if (sent) {
      return `Published since ${moment(sentDate).format("ddd Do MMM, HH:mm")}`;
    }

    if (id) {
      return "Not sent yet";
    }

    return "";
  };

  const getMasterLink = (master: Master, edit = false): string => {
    const form = edit ? master.id : "new";

    switch (master.group) {
      case MasterEnum.Guardian:
        return `${projectIdUrl}/atom/${form}`;
      case MasterEnum.Youtube:
        return `${projectIdUrl}/youtube/${form}`;
      case MasterEnum.Dailymotion:
        return `${projectIdUrl}/dailymotion/${form}`;
      case MasterEnum.Mainstream:
        return `${projectIdUrl}/mainstream/${form}`;
    }

    return "";
  };

  return (
    <div className={classes.masterList}>
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
                    alt="Youtube enabled"
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
                  {master.platform ? master.platform : ""}
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
                  {master.id ? (
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
