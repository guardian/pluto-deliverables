import axios from "axios";
import Cookies from "js-cookie";

/**
 * calls the pluto-deliverables API to create the given project
 * @param projectId
 * @param commissionId
 * @param name
 */
export const createProjectDeliverable = async (
  projectId: number,
  commissionId: number,
  name: string
): Promise<Deliverable | number> => {
  const csrftoken = Cookies.get("csrftoken");
  if (!csrftoken) {
    console.warn("Could not find a csrf token! Request will probably fail");
  }

  try {
    const response = await axios.post<Deliverable>(
      `/api/bundle/new`,
      {
        pluto_core_project_id: projectId,
        commission_id: commissionId,
        name: name,
      },
      {
        headers: {
          "X-CSRFToken": csrftoken,
        },
        validateStatus: (status) =>
          status == 200 || status == 201 || status == 409,
      }
    );

    if (response.status == 200) {
      return response.data;
    } else if (response.status == 409) {
      //conflict - the given bundle already exists, so just return the project id
      return projectId;
    }

    throw "Could not create Project deliverable";
  } catch (error) {
    if (error?.response?.status === 404) {
      return Promise.reject();
    }
    console.error(error);
    return Promise.reject(error);
  }
};
