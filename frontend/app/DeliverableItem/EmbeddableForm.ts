interface EmbeddableFormProps<T, U> {
  content?: T;
  deliverableId: bigint;
  bundleId: number;
  didUpdate: (newValue?: T) => void;
  copySource?: U;
}

export type { EmbeddableFormProps };
