import axios from "axios";
import {FileEntry} from "./FileEntry";

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
async function InitiateUpload(projectId:number, forPath:string):Promise<string> {
    try {
        const payload = JSON.stringify({
            project_id: projectId,
            drop_folder: forPath
        });

        const response = await axios({
            method:"post",
            url: "/deliverable-receiver/initiate",
            baseURL: "/",
            data: payload,
            headers: {
                "Content-Type": "application/json"
            }
        });

        if(response.status===200) {
            const slotInfo = <UploadSlot>response.data.result;
            return slotInfo.uuid
        } else {
            throw `unexpected response code ${response.status}`
        }
    } catch (error) {
        console.error("Could not initiate upload: ", error);
        if(error.response) {
            throw `server error ${error.response.status}: ${error.response.data}`
        } else if(error.request) {
            throw `no response from server`
        } else {
            throw `internal error, see console log`
        }
    }
}

async function UploadFromEntry(entry:FileEntry, index:number, uploadSlotId: string, updateCb:(updated:FileEntry, index:number)=>void) {
    const localEntry:FileEntry = Object.assign({}, entry);
    localEntry.lastError = "Starting upload";
    updateCb(localEntry, index);

    const targetUrl = `/deliverable-receiver/upload?uploadId=${uploadSlotId}&fileName=${entry.filename}`;
    console.debug("uploading to ", targetUrl);
    // axios({
    //     method: "post",
    //     url: targetUrl,
    //     baseURL: "/",
    //     headers: {
    //         "Content-Type": "application/octet-stream"
    //     },
    //     data: entry.rawFile.stream()
    // });
    return fetch(targetUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream",
        },
        body: entry.rawFile
    }).then( (response) => response.json() )
        .then( (success)=>{
            console.log("Upload completed successfully");
            localEntry.lastError = "Upload completed";
            updateCb(localEntry, index);
        })
        .catch( (err)=>{
            console.error("Upload failed: ", err);
            localEntry.lastError = err.toString();
            updateCb(localEntry, index);
        })
}

export {UploadFromEntry, InitiateUpload};