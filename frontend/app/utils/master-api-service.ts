import axios from "axios";
import { etEE } from "@material-ui/core/locale";
import { SystemNotifcationKind, SystemNotification } from "pluto-headers";
import MainstreamMaster from "../Master/MainstreamMaster";
import DailymotionMaster from "../Master/DailymotionMaster";

const API = "/api";
const API_DELIVERABLE = `${API}/bundle`;
const API_PATH_GNM = "gnmwebsite";
const API_PATH_YOUTUBE = "youtube";
const API_PATH_DAILYMOTION = "dailymotion";
const API_PATH_MAINSTREAM = "mainstream";
const API_PATH_OOVVUU = "oovvuu";
const API_PATH_REUTERSCONNECT = "reutersconnect";

export const getDeliverableGNM = async (
  deliverableId: string,
  assetId: string
): Promise<GuardianMaster> => {
  try {
    const { status, data } = await axios.get<GuardianMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_GNM}`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset GNM Website`);
    }
  } catch (error) {
    // Due to GET returns 404 if the metadata entry does not exists
    // do not treat this is an error
    if (error?.response?.status === 404) {
      return Promise.reject();
    }

    console.error(error);
    return Promise.reject(`Could not fetch Asset GNM Website`);
  }
};

export const createGNMDeliverable = async (
  deliverableId: string,
  assetId: string,
  guardianMaster: CreateGuardianMaster
): Promise<GuardianMaster> => {
  const {
    production_office,
    tags,
    website_title,
    website_description,
    primary_tone,
  } = guardianMaster;
  try {
    const { status, data } = await axios.put<GuardianMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_GNM}`,
      {
        production_office,
        tags,
        website_title,
        website_description,
        primary_tone,
      }
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not create Asset GNM Website`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not create Asset GNM Website`);
  }
};

export const updateGNMDeliverable = async (
  deliverableId: string,
  assetId: string,
  guardianMaster: GuardianMaster
): Promise<GuardianMaster> => {
  try {
    const { status, data } = await axios.put<GuardianMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_GNM}`,
      guardianMaster
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not update Asset GNM Website`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not update Asset GNM Website`);
  }
};

export const deleteGNMDeliverable = async (
  deliverableId: string,
  assetId: string
): Promise<void> => {
  try {
    await axios.delete<void>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_GNM}`
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not delete Asset GNM Website`);
  }
};

export async function requestResync(projectId: string, assetId: string) {
  try {
    await resyncToPublished(projectId, assetId);
    SystemNotification.open(
      SystemNotifcationKind.Success,
      "Requested resync, data should arrive within a couple of minutes."
    );
  } catch (err) {
    SystemNotification.open(
      SystemNotifcationKind.Error,
      `Could not request resync, ${err}`
    );
  }
}

export const resyncToPublished = async (
  bundleId: string,
  assetId: string
): Promise<void> => {
  try {
    const result = await axios.post(
      `${API_DELIVERABLE}/${bundleId}/asset/${assetId}/atomresync`
    );
    if (result.data.hasOwnProperty("status") && result.data.status == "error") {
      if (result.data.hasOwnProperty("detail")) {
        return Promise.reject(result.data.detail);
      } else {
        return Promise.reject("Launchdetector reported an error");
      }
    }
  } catch (err) {
    console.error(err);
    try {
      if (
        err.response &&
        err.response.hasOwnProperty("data") &&
        err.response.data.hasOwnProperty("details")
      ) {
        return Promise.reject(err.response.data.details);
      }
      return Promise.reject("see browser console for details");
    } catch (responseErr) {
      console.error("Caught error when handling response: ", responseErr);
    }
    return Promise.reject(`see browser console for details`);
  }
};

export const getDeliverableYoutube = async (
  deliverableId: string,
  assetId: string
): Promise<YoutubeMaster> => {
  try {
    const { status, data } = await axios.get<YoutubeMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_YOUTUBE}`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Youtube master`);
    }
  } catch (error) {
    // Due to GET returns 404 if the metadata entry does not exists
    // do not treat this is an error
    if (error?.response?.status === 404) {
      return Promise.reject();
    }

    console.error(error);
    return Promise.reject(`Could not fetch Asset Youtube master`);
  }
};

export const createYoutubeDeliverable = async (
  deliverableId: string,
  assetId: string,
  youtubeMaster: CreateYoutubeMaster
): Promise<YoutubeMaster> => {
  const {
    youtube_id,
    youtube_title,
    youtube_description,
    youtube_tags,
  } = youtubeMaster;
  try {
    const { status, data } = await axios.put<YoutubeMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_YOUTUBE}`,
      {
        youtube_id,
        youtube_title,
        youtube_description,
        youtube_tags,
      }
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not create Asset Youtube Master`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not create Asset Youtube Master`);
  }
};

export const updateYoutubeDeliverable = async (
  deliverableId: string,
  assetId: string,
  youtubeMaster: YoutubeMaster
): Promise<YoutubeMaster> => {
  try {
    const { status, data } = await axios.put<YoutubeMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_YOUTUBE}`,
      youtubeMaster
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not update Asset Youtube Master`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not update Asset Youtube Master`);
  }
};

export const deleteYoutubeDeliverable = async (
  deliverableId: string,
  assetId: string
): Promise<void> => {
  try {
    await axios.delete<void>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_YOUTUBE}`
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not delete Asset Youtube Master`);
  }
};

export const getDeliverableDailymotion = async (
  deliverableId: string,
  assetId: string
): Promise<DailymotionMaster> => {
  try {
    const { status, data } = await axios.get<DailymotionMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_DAILYMOTION}`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Dailymotion master`);
    }
  } catch (error) {
    // Due to GET returns 404 if the metadata entry does not exists
    // do not treat this is an error
    if (error?.response?.status === 404) {
      return Promise.reject();
    }

    console.error(error);
    return Promise.reject(`Could not fetch Asset Dailymotion master`);
  }
};

export const createDailymotionDeliverable = async (
  deliverableId: string,
  assetId: string,
  dailymotionMaster: CreateDailymotionMaster
): Promise<DailymotionMaster> => {
  const {
    daily_motion_url,
    daily_motion_title,
    daily_motion_description,
    daily_motion_tags,
    daily_motion_no_mobile_access,
    daily_motion_contains_adult_content,
    daily_motion_category,
  } = dailymotionMaster;
  try {
    const response = await genericUpdate<CreateDailymotionMaster>(
      deliverableId,
      assetId,
      API_PATH_DAILYMOTION,
      {
        daily_motion_url,
        daily_motion_title,
        daily_motion_description,
        daily_motion_tags,
        daily_motion_no_mobile_access,
        daily_motion_contains_adult_content,
        daily_motion_category,
      }
    );
    return response as DailymotionMaster;
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not create Asset Dailymotion Master`);
  }
};

export const updateDailymotionDeliverable = async (
  deliverableId: string,
  assetId: string,
  dailymotionMaster: DailymotionMaster
): Promise<DailymotionMaster> => {
  try {
    return genericUpdate<DailymotionMaster>(
      deliverableId,
      assetId,
      API_PATH_DAILYMOTION,
      dailymotionMaster
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not update Asset Dailymotion Master`);
  }
};

export const deleteDailymotionDeliverable = async (
  deliverableId: string,
  assetId: string
): Promise<void> => {
  try {
    await axios.delete<void>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_DAILYMOTION}`
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not delete Asset Dailymotion Master`);
  }
};

export const getDeliverableMainstream = async (
  deliverableId: string,
  assetId: string
): Promise<MainstreamMaster> => {
  try {
    const { status, data } = await axios.get<MainstreamMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_MAINSTREAM}`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Mainstream master`);
    }
  } catch (error) {
    // Due to GET returns 404 if the metadata entry does not exists
    // do not treat this is an error
    if (error?.response?.status === 404) {
      return Promise.reject();
    }

    console.error(error);
    return Promise.reject(`Could not fetch Asset Mainstream master`);
  }
};

export const createMainstreamDeliverable = async (
  deliverableId: string,
  assetId: string,
  mainstreamMaster: CreateMainstreamMaster
): Promise<MainstreamMaster> => {
  const {
    mainstream_title,
    mainstream_description,
    mainstream_tags,
    mainstream_rules_contains_adult_content,
  } = mainstreamMaster;
  try {
    const result = await genericUpdate<CreateMainstreamMaster>(
      deliverableId,
      assetId,
      API_PATH_MAINSTREAM,
      {
        mainstream_title,
        mainstream_description,
        mainstream_tags,
        mainstream_rules_contains_adult_content,
        publication_date: undefined,
      }
    );
    return result as MainstreamMaster;
  } catch (error) {
    console.error(error);
    return Promise.reject(
      `Could not create Asset Mainstream Master, see browser console`
    );
  }
};

export const updateMainstreamDeliverable = async (
  deliverableId: string,
  assetId: string,
  mainstreamMaster: MainstreamMaster
): Promise<MainstreamMaster> => {
  try {
    return genericUpdate<MainstreamMaster>(
      deliverableId,
      assetId,
      API_PATH_MAINSTREAM,
      mainstreamMaster
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not update Asset Mainstream Master`);
  }
};

export const deleteMainstreamDeliverable = async (
  deliverableId: string,
  assetId: string
): Promise<void> => {
  try {
    await axios.delete<void>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_MAINSTREAM}`
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not delete Asset Mainstream Master`);
  }
};

export const getDeliverableOovvuu = async (
  deliverableId: string,
  assetId: string
): Promise<OovvuuMaster> => {
  try {
    const { status, data } = await axios.get<OovvuuMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_OOVVUU}`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Mainstream master`);
    }
  } catch (error) {
    // Due to GET returns 404 if the metadata entry does not exists
    // do not treat this is an error
    if (error?.response?.status === 404) {
      return Promise.reject();
    }

    console.error(error);
    return Promise.reject(`Could not fetch Asset Mainstream master`);
  }
};

export const createOovvuuDeliverable = async (
  deliverableId: string,
  assetId: string,
  content: OovvuuMaster
): Promise<OovvuuMaster> => {
  try {
    const result = await genericUpdate<CreateOovvuuMaster>(
      deliverableId,
      assetId,
      API_PATH_OOVVUU,
      {
        seen_on_channel: content.seen_on_channel,
      }
    );
    return result as OovvuuMaster;
  } catch (error) {
    console.error(error);
    return Promise.reject(
      `Could not create Asset Oovvuu Master, see browser console`
    );
  }
};

export const updateOovvuuDeliverable = async (
  deliverableId: string,
  assetId: string,
  content: OovvuuMaster
): Promise<OovvuuMaster> => {
  try {
    return genericUpdate<OovvuuMaster>(
      deliverableId,
      assetId,
      API_PATH_OOVVUU,
      content
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not update Asset Oovvuu Master`);
  }
};

export const deleteOovvuuDeliverable = async (
  deliverableId: string,
  assetId: string
): Promise<void> => {
  try {
    await axios.delete<void>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_OOVVUU}`
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not delete Asset Oovvuu Master`);
  }
};

export const getDeliverableReutersConnect = async (
  deliverableId: string,
  assetId: string
): Promise<ReutersConnectMaster> => {
  try {
    const { status, data } = await axios.get<ReutersConnectMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_REUTERSCONNECT}`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Mainstream master`);
    }
  } catch (error) {
    // Due to GET returns 404 if the metadata entry does not exists
    // do not treat this is an error
    if (error?.response?.status === 404) {
      return Promise.reject();
    }

    console.error(error);
    return Promise.reject(`Could not fetch Asset Mainstream master`);
  }
};

export const createReutersConnectDeliverable = async (
  deliverableId: string,
  assetId: string,
  content: CreateReutersConnectMaster
): Promise<ReutersConnectMaster> => {
  try {
    const result = await genericUpdate<CreateReutersConnectMaster>(
      deliverableId,
      assetId,
      API_PATH_REUTERSCONNECT,
      {
        seen_on_channel: content.seen_on_channel,
      }
    );
    return result as ReutersConnectMaster;
  } catch (error) {
    console.error(error);
    return Promise.reject(
      `Could not create Asset Reuters Connect Master, see browser console`
    );
  }
};

export const updateReutersConnectDeliverable = async (
  deliverableId: string,
  assetId: string,
  content: ReutersConnectMaster
): Promise<ReutersConnectMaster> => {
  try {
    return genericUpdate<ReutersConnectMaster>(
      deliverableId,
      assetId,
      API_PATH_REUTERSCONNECT,
      content
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not update Asset Reuters Connect Master`);
  }
};

export const deleteReutersConnectDeliverable = async (
  deliverableId: string,
  assetId: string
): Promise<void> => {
  try {
    await axios.delete<void>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_REUTERSCONNECT}`
    );
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not delete Asset Reuters Connect Master`);
  }
};

async function genericUpdate<T>(
  deliverableId: string,
  assetId: string,
  apiPath: string,
  update: T
): Promise<T> {
  const { status, data } = await axios.put<ResponseWrapper<T>>(
    `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${apiPath}`,
    update,
    {
      validateStatus: (status) => status == 200 || status == 409,
    }
  );

  switch (status) {
    case 200:
      return data.data;
    case 409:
      return Promise.reject(
        "There was a conflict, somebody else has updated in the meantime. Please reload and try again."
      );
    default:
      return Promise.reject(
        `Got an unknown response ${status} from the server`
      );
  }
}
