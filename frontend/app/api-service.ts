import axios from "axios";

const API = "/api";
const API_DELIVERABLES = `${API}/deliverables`;

export const getProjectDeliverables = async (
  projectId: number
): Promise<Deliverable[]> => {
  try {
    const { status, data } = await axios.get<Deliverable[]>(
      `${API_DELIVERABLES}?project_id=${projectId}`
    );

    if (status === 200) {
      return data;
    }

    throw new Error(`Could not fetch Project deliverables. ${status}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
