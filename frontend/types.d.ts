interface Project {
  project_id: string; //this field is deprecated
  pluto_core_project_id: number; //this is now the correct project id
  commission_id: number;
  name: string;
  created: string;
  local_open_uri: string;
  local_path: string;
}

interface Deliverable {
  id: bigint;
  type: number | null;
  filename: string;
  size: bigint;
  access_dt: string;
  modified_dt: string;
  changed_dt: string;
  job_id: string | null;
  item_id: string | null;
  deliverable: bigint;
  has_ongoing_job: boolean | null;
  status: bigint;
  type_string: string | null;
  version: bigint | null;
  duration: string | null;
  size_string: string;
  status_string: string;
}

interface GuardianMaster {
  mediaAtomId?: string;
  uploadStatus: string;
  productionOffice: string;
  tags: string[];
  publicationDate: string;
  websiteTitle: string;
  websiteDescription: string;
  primaryTone: string;
  publicationStatus: string;
}

interface YoutubeMaster {
  youtubeID: string;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string[];
  publicationDate: string;
  youtubeCategories?: string[];
  youtubeChannels?: string[];
}

interface DailymotionMaster {
  dailymotionUrl: string;
  dailymotionTitle: string;
  dailymotionDescription: string;
  dailymotionCategory?: number;
  dailymotionTags: string[];
  publicationDate: string;
  uploadStatus: string;
  dailymotionNoMobileAccess: boolean;
  dailymotionContainsAdultContent: boolean;
}

interface MainstreamMaster {
  mainstreamTitle: string;
  mainstreamDescription: string;
  mainstreamTags: string[];
  mainstreamRulesContainsAdultContent: boolean;
  uploadStatus: string;
}

type MasterGroups = "gnmwebsite" | "youtube" | "dailymotion" | "mainstream";

interface CreatedMaster {
  id: number;
  sent: boolean;
  publicationFailed: boolean;
  sentDate: string;
  platform: string;
  link: string;
  tags: string[];
}

interface Master extends Partial<CreatedMaster> {
  group: MasterGroups;
}

//can't be more specific than this. each key is the section name and each value is an array of (id, name) pairs
type DeliverableTypes = { [index: string]: [number, string][] };

declare module "*.png" {
  const content: any;
  export default content;
}

declare module "*.jpg" {
  const content: any;
  export default content;
}

declare module "*.css" {
  const content: any;
  export default content;
}

type ProductionOffice = "UK" | "US" | "Aus";

type PrimaryTone =
  | "News"
  | "Explainer"
  | "Documentary"
  | "Comment"
  | "Analysis"
  | "Feature"
  | "Interview"
  | "Performance";

type PublicationStatus = "Unpublished" | "Published" | "Superceded";
