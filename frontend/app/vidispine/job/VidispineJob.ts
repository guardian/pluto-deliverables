import VidispineJobTI from "./VidispineJob-ti";
import { createCheckers } from "ts-interface-checker";

interface JobMetadata {
  key: string;
  value: string;
}

interface JobStepProgress {
  value: number;
  total?: number;
  unit?: string;
}

interface VidispineJobStep {
  description?: string;
  number?: number;
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
    | "FAILED_TOTAL"
    | "WAITING"
    | "DISAPPEARED";
  attempts?: number;
  timestamp?: string;
  progress?: JobStepProgress;
}

interface VidispineJobLog {
  task: VidispineJobStep[];
}

interface VidispineJobIF {
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
  currentStep?: VidispineJobStep;
  data?: JobMetadata[];
  steps?: VidispineJobStep[];
  log?: VidispineJobLog;
}

const {
  JobMetadata,
  JobStepProgress,
  VidispineJobStep,
  VidispineJobLog,
  VidispineJobIF,
} = createCheckers(VidispineJobTI);

class VidispineJob {
  data: VidispineJobIF;

  /**
   * try to construct a VidispineJob from an untyped object. Raises a VError if it does not validate
   * @param fromObject object to create from
   */
  constructor(fromObject: any) {
    VidispineJobIF.check(fromObject);
    this.data = fromObject as VidispineJobIF;
    return this;
  }

  /**
   * returns the values of all metadata keys matching the given key
   * @param key key to look for
   * @return a string array of values, which can be empty if metadata is defined but there are no matching keys
   */
  getMetadataArray(key: string): string[] | undefined {
    const maybeValues = this.data.data
      ? this.data.data.filter((entry) => entry.key === key)
      : undefined;
    return maybeValues ? maybeValues.map((entry) => entry.value) : undefined;
  }

  /**
   * returns a single metadata value, the first one matching the given key or undefined if there is no metadata or
   * no keys matching
   * @param key key to look for
   * @return the metadata value or undefined
   */
  getMetadata(key: string): string | undefined {
    const maybeValues = this.getMetadataArray(key);
    return maybeValues && maybeValues.length > 0 ? maybeValues[0] : undefined;
  }

  /**
   * returns true if the job is in any completed state
   */
  didFinish(): boolean {
    return (
      this.data.status == "FINISHED" ||
      this.data.status == "FINISHED_WARNING" ||
      this.data.status == "FAILED_TOTAL" ||
      this.data.status == "ABORTED_PENDING" ||
      this.data.status == "ABORTED"
    );
  }

  /**
   * returns true if the job is in a state that indicates successful completion
   */
  wasSuccess(): boolean {
    return (
      this.data.status == "FINISHED" || this.data.status == "FINISHED_WARNING"
    );
  }
}
export { VidispineJob };
