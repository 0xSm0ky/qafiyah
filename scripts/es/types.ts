export type DocDigest = { readonly id: string; readonly hash: string };

export type AliasSnapshot = {
  readonly alias: string;
  readonly settings: unknown;
  readonly mappings: unknown;
  readonly docCount: number;
  readonly docs: readonly DocDigest[];
};

export type Snapshot = {
  readonly takenAt: string;
  readonly aliases: readonly AliasSnapshot[];
};
