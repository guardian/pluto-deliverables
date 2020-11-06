import axios from "axios";
import { FileEntry } from "./FileEntry";

//corresponds to UploadSlot in the deliverable-receiver project
interface UploadSlot {
  uuid: string;
  upload_path_relative: string;
  project_id: number;
  expiry: number;
}

/**
 * attempts to initiate an upload and return the uuid of it.
 * the promise fails on error and must be caught
 * @param projectId project id that the upload is for
 * @param forPath path that the files should go to
 */
async function InitiateUpload(
  projectId: number,
  forPath: string
): Promise<string> {
  try {
    const payload = JSON.stringify({
      project_id: projectId,
      drop_folder: forPath,
    });

    const response = await axios({
      method: "post",
      url: "/deliverable-receiver/initiate",
      baseURL: "/",
      data: payload,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      const slotInfo = <UploadSlot>response.data.result;
      return slotInfo.uuid;
    } else {
      throw `unexpected response code ${response.status}`;
    }
  } catch (error) {
    console.error("Could not initiate upload: ", error);
    if (error.response) {
      throw `server error ${error.response.status}: ${error.response.data}`;
    } else if (error.request) {
      throw `no response from server`;
    } else {
      throw `internal error, see console log`;
    }
  }
}

async function UploadFromEntry(
  entry: FileEntry,
  index: number,
  uploadSlotId: string,
  updateCb: (updated: FileEntry, index: number) => void
) {
  const localEntry: FileEntry = Object.assign({}, entry);
  localEntry.lastError = "Starting upload";
  updateCb(localEntry, index);

  const targetUrl = `/deliverable-receiver/upload?uploadId=${uploadSlotId}&fileName=${entry.filename}`;
  console.debug("uploading to ", targetUrl);

  let response: Response;
  try {
    const token = localStorage.getItem("pluto:access-token");
    response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: `Bearer ${token}`,
      },
      body: entry.rawFile,
    });
  } catch (err) {
    console.error("Upload failed: ", err);
    localEntry.lastError = err.toString();
    updateCb(localEntry, index);
    throw "upload failed";
  }

  switch (response.status) {
    case 413:
      localEntry.lastError = "chunk size is too large";
      updateCb(localEntry, index);
      throw "upload failed";
    case 500 | 400:
      try {
        const responseBody = await response.json();
        if (responseBody.detail) {
          localEntry.lastError = responseBody.detail;
        } else {
          localEntry.lastError = responseBody.toString();
        }
        updateCb(localEntry, index);
      } catch (err) {
        console.warn("could not parse error json: ", err);
        localEntry.lastError = "server error, see browser console";
        updateCb(localEntry, index);
      }
      throw "upload failed";
    case 503:
      localEntry.lastError = "server not responding, retrying...";
      updateCb(localEntry, index);
      return new Promise((resolve, reject) =>
        window.setTimeout(() => {
          UploadFromEntry(entry, index, uploadSlotId, updateCb)
            .then(resolve)
            .catch((err) => reject(err));
        }, 2000)
      );
    case 403:
      localEntry.lastError = "permission denied";
      updateCb(localEntry, index);
      throw "upload failed";
    case 200:
      const responseBody = await response.json();
      console.log(responseBody);
      localEntry.lastError = "Upload completed";
      updateCb(localEntry, index);
  }
}

export { UploadFromEntry, InitiateUpload };
