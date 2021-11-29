interface MasterFormProps<T, C> {
  isEditing: boolean;
  master: T;
  isReadOnly: boolean;
  isDirty: boolean;
  copySource?: C;
  saveRequested: (updated: T) => void;
  editCancelled?: () => void;
}

export type { MasterFormProps };
