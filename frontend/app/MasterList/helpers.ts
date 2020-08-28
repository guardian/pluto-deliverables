import axios from "axios";

const API = "/api";
const API_DELIVERABLE = `${API}/bundle`;
const API_PATH_GNM = "gnmwebsite";
const API_PATH_YOUTUBE = "youtube";
const API_PATH_DAILYMOTION = "dailymotion";
const API_PATH_MAINSTREAM = "mainstream";

export const getDeliverableGNM = async (
  deliverableId: bigint,
  assetId: bigint
): Promise<GuardianMaster> => {
  try {
    const { status, data } = await axios.get<GuardianMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_GNM}/logs`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset GNM Website ${assetId}.`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

export const getDeliverableYoutube = async (
  deliverableId: bigint,
  assetId: bigint
): Promise<YoutubeMaster> => {
  try {
    const { status, data } = await axios.get<YoutubeMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_YOUTUBE}/logs`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Youtube master ${assetId}.`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

export const getDeliverableDailymotion = async (
  deliverableId: bigint,
  assetId: bigint
): Promise<DailymotionMaster> => {
  try {
    const { status, data } = await axios.get<DailymotionMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_DAILYMOTION}/logs`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Dailymotion master ${assetId}.`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

export const getDeliverableMainstream = async (
  deliverableId: bigint,
  assetId: bigint
): Promise<MainstreamMaster> => {
  try {
    const { status, data } = await axios.get<MainstreamMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_MAINSTREAM}/logs`
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not fetch Asset Mainstream master ${assetId}.`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};
