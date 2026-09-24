export type PageSubject = {
  readonly shape: string;
  readonly path: string;
  readonly html: string;
};

export type FieldResult = {
  readonly label: string;
  readonly value: string;
  readonly ok: boolean;
};

export type Inspector = {
  readonly id: string;
  readonly title: string;
  inspect(subject: PageSubject): readonly FieldResult[];
};
