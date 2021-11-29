interface EmbeddableFormProps<T> {
  content?: T;
  deliverableId: string;
  bundleId: string;
  didUpdate: (newValue: T) => void;
}

export type { EmbeddableFormProps };
