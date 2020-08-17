interface Project {
    project_id: string; //this field is deprecated
    pluto_core_project_id: number;  //this is now the correct project id
    commission_id: number;
    name: string;
    created: string;
    local_open_uri: string;
    local_path: string;
}

interface Deliverable {
    id: bigint,
    type: number|null,
    filename: string,
    size: bigint,
    access_dt: string,
    modified_dt: string,
    changed_dt: string,
    job_id: string|null,
    item_id: string|null,
    deliverable: bigint,
    has_ongoing_job: boolean|null,
    status: bigint,
    type_string: string|null,
    version: bigint|null,
    duration: string|null,
    size_string: string,
    status_string: string
}

//can't be more specific than this. each key is the section name and each value is an array of (id, name) pairs
type DeliverableTypes = {[index:string] : [number,string][]};