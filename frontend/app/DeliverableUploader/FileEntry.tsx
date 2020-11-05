interface FileEntry {
  filename: string;
  progress: number;
  lastError: string;
  rawFile: File;
}

export type { FileEntry };
