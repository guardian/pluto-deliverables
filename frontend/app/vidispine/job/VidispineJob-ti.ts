/**
 * This module was automatically generated by `ts-interface-builder`
 */
import * as t from "ts-interface-checker";
// tslint:disable:object-literal-key-quotes

export const JobMetadata = t.iface([], {
  key: "string",
  value: "string",
});

export const JobStepProgress = t.iface([], {
  value: "number",
  total: t.opt("number"),
  unit: t.opt("string"),
});

export const VidispineJobStep = t.iface([], {
  description: t.opt("string"),
  number: t.opt("number"),
  status: t.union(
    t.lit("NONE"),
    t.lit("READY"),
    t.lit("STARTED"),
    t.lit("STARTED_ASYNCHRONOUS"),
    t.lit("STARTED_PARALLEL"),
    t.lit("STARTED_PARALLEL_ASYNCHRONOUS"),
    t.lit("STARTED_SUBTASKS"),
    t.lit("FINISHED"),
    t.lit("FAILED_RETRY"),
    t.lit("FAILED_TOTAL"),
    t.lit("WAITING"),
    t.lit("DISAPPEARED")
  ),
  attempts: t.opt("number"),
  timestamp: t.opt("string"),
  progress: t.opt("JobStepProgress"),
});

export const VidispineJobLog = t.iface([], {
  task: t.array("VidispineJobStep"),
});

export const VidispineJobIF = t.iface([], {
  jobId: "string",
  user: t.opt("string"),
  started: t.opt("string"),
  finished: t.opt("string"),
  status: t.union(
    t.lit("READY"),
    t.lit("STARTED"),
    t.lit("VIDINET_JOB"),
    t.lit("FINISHED"),
    t.lit("FINISHED_WARNING"),
    t.lit("FAILED_TOTAL"),
    t.lit("WAITING"),
    t.lit("ABORTED_PENDING"),
    t.lit("ABORTED")
  ),
  type: t.union(
    t.lit("NONE"),
    t.lit("IMPORT"),
    t.lit("PLACEHOLDER_IMPORT"),
    t.lit("RAW_IMPORT"),
    t.lit("AUTO_IMPORT"),
    t.lit("SHAPE_IMPORT"),
    t.lit("SIDECAR_IMPORT"),
    t.lit("ESSENCE_VERSION"),
    t.lit("TRANSCODE"),
    t.lit("TRANSCODE_RANGE"),
    t.lit("CONFORM"),
    t.lit("TIMELINE"),
    t.lit("THUMBNAIL"),
    t.lit("ANALYZE"),
    t.lit("SHAPE_UPDATE"),
    t.lit("RAW_TRANSCODE"),
    t.lit("EXPORT"),
    t.lit("COPY_FILE"),
    t.lit("MOVE_FILE"),
    t.lit("DELETE_FILE"),
    t.lit("LIST_ITEMS"),
    t.lit("FILE_ANALYZE"),
    t.lit("IMF_ANALYZE")
  ),
  priority: t.union(t.lit("HIGH"), t.lit("MEDIUM"), t.lit("LOW")),
  currentStep: t.opt("VidispineJobStep"),
  data: t.opt(t.array("JobMetadata")),
  steps: t.opt(t.array("VidispineJobStep")),
  totalSteps: t.opt("number"),
  log: t.opt("VidispineJobLog"),
});

const exportedTypeSuite: t.ITypeSuite = {
  JobMetadata,
  JobStepProgress,
  VidispineJobStep,
  VidispineJobLog,
  VidispineJobIF,
};
export default exportedTypeSuite;
