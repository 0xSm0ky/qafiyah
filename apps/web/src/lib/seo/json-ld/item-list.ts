type ListItemNode<T> = {
  readonly '@type': 'ListItem';
  readonly position: number;
  readonly item: T;
};

export type ItemListNode<T> = {
  readonly '@type': 'ItemList';
  readonly name?: string;
  readonly numberOfItems: number;
  readonly itemListElement: readonly ListItemNode<T>[];
};

export function buildItemList<T>(
  items: readonly T[],
  options?: { readonly name?: string }
): ItemListNode<T> {
  return {
    '@type': 'ItemList',
    ...(options?.name === undefined ? {} : { name: options.name }),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      item,
    })),
  };
}
