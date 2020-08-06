import axios from "axios";

const API = "/api";
const API_DELIVERABLE = `${API}/deliverable`;
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

export const deleteProjectDeliverable = async (
  projectId: number,
  deliverableIds: bigint[]
): Promise<void> => {
  try {
    // Added, otherwise the error "CSRF Failed: CSRF token missing or incorrect." occurs
    axios.defaults.xsrfCookieName = "csrftoken";
    axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";

    await axios.delete<void>(`${API_DELIVERABLE}?project_id=${projectId}`, {
      data: deliverableIds,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
