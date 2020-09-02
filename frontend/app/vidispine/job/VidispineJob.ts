import VidispineJobTI from "./VidispineJob-ti";
import { createCheckers } from "ts-interface-checker";

interface JobMetadata {
  key: string;
  value: string;
}

interface JobStepProgress {
  value: number;
  total: number;
  unit?: string;
}

interface VidispineJobStep {
  description?: string;
  number: number;
  status:
    | "NONE"
    | "READY"
    | "STARTED"
    | "STARTED_ASYNCHRONOUS"
    | "STARTED_PARALLEL"
    | "STARTED_PARALLEL_ASYNCHRONOUS"
    | "STARTED_SUBTASKS"
    | "FINISHED"
    | "FAILED_RETRY"
    | "FAILED_FATAL"
    | "WAITING"
    | "DISAPPEARED";
  attempts?: number;
  timestamp?: string;
  progress?: JobStepProgress;
}

interface VidispineJobLog {
  task: VidispineJobStep[];
}

interface VidispineJob {
  jobId: string;
  user?: string;
  started?: string;
  finished?: string;
  //these enum values are correct as of Vidispine 5.3.1
  status:
    | "READY"
    | "STARTED"
    | "VIDINET_JOB"
    | "FINISHED"
    | "FINISHED_WARNING"
    | "FAILED_TOTAL"
    | "WAITING"
    | "ABORTED_PENDING"
    | "ABORTED";
  type:
    | "NONE"
    | "IMPORT"
    | "PLACEHOLDER_IMPORT"
    | "RAW_IMPORT"
    | "AUTO_IMPORT"
    | "SHAPE_IMPORT"
    | "SIDECAR_IMPORT"
    | "ESSENCE_VERSION"
    | "TRANSCODE"
    | "TRANSCODE_RANGE"
    | "CONFORM"
    | "TIMELINE"
    | "THUMBNAIL"
    | "ANALYZE"
    | "SHAPE_UPDATE"
    | "RAW_TRANSCODE"
    | "EXPORT"
    | "COPY_FILE"
    | "MOVE_FILE"
    | "DELETE_FILE"
    | "LIST_ITEMS"
    | "FILE_ANALYZE"
    | "IMF_ANALYZE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  currentStep?: JobMetadata;
  data?: VidispineJobStep[];
  totalSteps: number;
  log?: VidispineJobLog;
}

