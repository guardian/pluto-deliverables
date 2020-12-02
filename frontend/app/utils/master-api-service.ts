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

export const resyncToPublished = async (bundleId:string, assetId:String):Promise<void> => {
  try {
    await axios.post(`${API_DELIVERABLE}/${bundleId}/asset/${assetId}/atomresync`);
  } catch (err) {
    console.error(err);
    try {
      if (err.response && err.response.hasOwnProperty("data") && err.response.data.hasOwnProperty("details")) {
          return Promise.reject(err.response.data.details)
      }
      return Promise.reject("see browser console for details")
    } catch (responseErr) {
      console.error("Caught error when handling response: ", responseErr);
    }
    return Promise.reject(`see browser console for details`)
  }
}

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
    const { status, data } = await axios.put<DailymotionMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_DAILYMOTION}`,
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

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not create Asset Dailymotion Master`);
    }
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
    const { status, data } = await axios.put<DailymotionMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_DAILYMOTION}`,
      dailymotionMaster
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not update Asset Dailymotion Master`);
    }
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
    const { status, data } = await axios.put<MainstreamMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_MAINSTREAM}`,
      {
        mainstream_title,
        mainstream_description,
        mainstream_tags,
        mainstream_rules_contains_adult_content,
      }
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not create Asset Mainstream Master`);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(`Could not create Asset Mainstream Master`);
  }
};

export const updateMainstreamDeliverable = async (
  deliverableId: string,
  assetId: string,
  mainstreamMaster: MainstreamMaster
): Promise<MainstreamMaster> => {
  try {
    const { status, data } = await axios.put<MainstreamMaster>(
      `${API_DELIVERABLE}/${deliverableId}/asset/${assetId}/${API_PATH_MAINSTREAM}`,
      mainstreamMaster
    );

    if (status === 200) {
      return data;
    } else {
      throw new Error(`Could not update Asset Mainstream Master`);
    }
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
