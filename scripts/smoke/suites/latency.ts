import { API, WEB } from '../target';

import type { SurfaceName } from '../surfaces';

export type LatencyTarget = {
  readonly id: string;
  readonly url: string;
  readonly budgets: Readonly<Record<SurfaceName, number>>;
};

export const latencyTargets: readonly LatencyTarget[] = [
  { id: 'page', url: `${WEB}/poets`, budgets: { origin: 2000, stack: 1000, prod: 800 } },
  { id: 'api-list', url: `${API}/v1/poems`, budgets: { origin: 400, stack: 200, prod: 400 } },
  {
    id: 'search',
    url: `${API}/v1/search?q=%D8%AD%D8%A8`,
    budgets: { origin: 1000, stack: 600, prod: 1000 },
  },
];
