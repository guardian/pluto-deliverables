interface EmbeddableFormProps<T, U> {
  content?: T;
  deliverableId: string;
  bundleId: string;
  didUpdate: (newValue?: T) => void;
  copySource?: U;
}

export type { EmbeddableFormProps };
