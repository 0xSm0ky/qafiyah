import { poemUrl } from '@/lib/urls';

type AdjacentPoemRef = {
  readonly title: string;
  readonly slug: string;
};

type AdjacentPoemsSource = {
  readonly prev?: AdjacentPoemRef | undefined;
  readonly next?: AdjacentPoemRef | undefined;
};

export type AdjacentPoemsView = {
  readonly prevHref: string | undefined;
  readonly prevTitle: string | undefined;
  readonly nextHref: string | undefined;
  readonly nextTitle: string | undefined;
  readonly hidden: boolean;
};

export function deriveAdjacentPoems(poem: AdjacentPoemsSource): AdjacentPoemsView {
  return {
    prevHref: poem.prev ? poemUrl(poem.prev.slug) : undefined,
    prevTitle: poem.prev?.title,
    nextHref: poem.next ? poemUrl(poem.next.slug) : undefined,
    nextTitle: poem.next?.title,
    hidden: poem.prev === undefined && poem.next === undefined,
  };
}
