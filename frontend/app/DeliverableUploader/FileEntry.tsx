interface FileEntry {
  filename: string;
  progress: number;
  lastError: string;
  rawFile: File;
  sha1?:string;
}

export type { FileEntry };
