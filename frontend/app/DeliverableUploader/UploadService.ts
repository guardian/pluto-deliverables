import axios from "axios";
import { FileEntry } from "./FileEntry";
import shastream from "sha1-stream";
import crypto from "crypto";

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

async function ChunkedUploadFromEntry(
  entry: FileEntry,
  index: number,
  uploadSlotId: string,
  chunkSize: number,
  updateCb: (updated: FileEntry, index: number) => void
) {
  const uploadChunk = async (chunkIndex: number) => {
    const lastByte =
      (chunkIndex + 1) * chunkSize > entry.rawFile.size
        ? entry.rawFile.size
        : (chunkIndex + 1) * chunkSize;
    const blob = entry.rawFile.slice(chunkIndex * chunkSize, lastByte);
    let localEntry = Object.assign([], entry);
    let response: Response;
    const targetUrl = `/deliverable-receiver/upload?uploadId=${uploadSlotId}&fileName=${entry.filename}`;

    try {
      const token = localStorage.getItem("pluto:access-token");
      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          Authorization: `Bearer ${token}`,
          Range: `bytes=${chunkIndex * chunkSize}-${lastByte}/${
            entry.rawFile.size
          }`,
        },
        body: blob,
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
            uploadChunk(chunkIndex)
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
        const fractionComplete =
          ((chunkIndex + 1) * chunkSize) / entry.rawFile.size;
        localEntry.progress = Math.round(fractionComplete * 100.0);
        updateCb(localEntry, index);
    }
  };

  const chunksCount = Math.ceil(entry.rawFile.size / chunkSize);
  console.log(
    "chunked upload: there are ",
    chunksCount,
    " chunks for file of size ",
    entry.rawFile.size
  );
  for (let i = 0; i < chunksCount; i++) {
    console.log("uploading chunk ", i);
    await uploadChunk(i);
  }
}

async function GetSHA(entry: FileEntry): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");

    const reader = entry.rawFile.stream().getReader();

    reader.read().then(function processContent({ done, value }): Promise<void> {
      if (done) {
        resolve(hash.digest().toString("base64"));
        return new Promise<void>((resolve, reject) => resolve());
      }

      hash.update(value);
      return reader
        .read()
        .then(processContent)
        .catch((err) => reject(err));
    });
  });
}

async function RequestValidation(
  entry: FileEntry,
  uploadSlotId: string,
  sha1sum: string,
  attempt: number = 0
): Promise<boolean> {
  const targetUrl = `/deliverable-receiver/validate?uploadId=${uploadSlotId}&fileName=${
    entry.filename
  }&sum=${encodeURIComponent(sha1sum)}`;
  const token = localStorage.getItem("pluto:access-token");
  const response = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${token}`,
    },
  });
  const content = await response.text();
  switch (response.status) {
    case 200:
      console.log("Server reported successful validation for ", entry.filename);
      return true;
    case 409:
      console.log(
        "Server reported that checksums don't match for ",
        entry.filename,
        ": ",
        content
      );
      return false;
    case 403:
      console.error(
        "Server reported forbidden. Assuming expired credential and trying again in 3s..."
      );
      return new Promise<boolean>((resolve, reject) =>
        window.setTimeout(() => {
          RequestValidation(entry, uploadSlotId, sha1sum, attempt)
            .then(resolve)
            .catch(reject);
        }, 3000)
      );
    default:
      console.log("Unexpected error: ", content);
      let msg = content;
      try {
        const json = JSON.parse(content);
        msg = json.detail;
      } catch (err) {
        console.warn("could not parse error report as json: ", err);
      }
      throw msg;
  }
}

async function UploadAndValidate(
  entry: FileEntry,
  index: number,
  uploadSlotId: string,
  chunkSize: number,
  updateCb: (updated: FileEntry, index: number) => void
) {
  const [uploadResult, sha] = await Promise.all([
    ChunkedUploadFromEntry(entry, index, uploadSlotId, chunkSize, updateCb),
    GetSHA(entry),
  ]);

  console.log("Upload and local checksum completed: ", sha);

  const validationResult = await RequestValidation(entry, uploadSlotId, sha);
  if (validationResult) {
    console.log("Upload validated successfully");
  } else {
    console.log("Validation failed");
  }
  return validationResult;
}

export {
  ChunkedUploadFromEntry,
  GetSHA,
  InitiateUpload,
  RequestValidation,
  UploadAndValidate,
};
