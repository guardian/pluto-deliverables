import axios from "axios";

const API = "/api";
const API_DELIVERABLE = `${API}/bundle`;
const API_PATH_GNM = "gnmwebsite";
const API_PATH_YOUTUBE = "youtube";
const API_PATH_DAILYMOTION = "dailymotion";
const API_PATH_MAINSTREAM = "mainstream";

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

export const putGNMDeliverable = async (
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
