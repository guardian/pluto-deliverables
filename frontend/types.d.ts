interface Project {
    project_id: string;
    name: string;
    created: string;
}

interface Deliverable {
    id: bigint,
    type: bigint|null,
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
