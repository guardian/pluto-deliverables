const apiBase = "https://api.dailymotion.com";

interface DailymotionChannelResponse {
  page: number;
  limit: number;
  explicit: boolean;
  total: number;
  has_more: boolean;
  list: DailyMotionChannel[];
}

async function fetchDailyMotionChannels() {
  //using fetch not axios here so our interceptors don't get in the way, log us out, leak credentials etc.
  const result = await fetch(`${apiBase}/channels`);
  switch (result.status) {
    case 200:
      const channelContent = (await result.json()) as DailymotionChannelResponse;
      return channelContent.list;
    default:
      const serverResponse = await result.text();
      console.error(
        "Could not communicate with DailyMotion: ",
        result.status,
        serverResponse
      );
      throw "Could not communicate with DailyMotion";
  }
}

export { fetchDailyMotionChannels };
