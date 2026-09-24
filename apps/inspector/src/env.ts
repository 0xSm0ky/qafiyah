import { DEV_INSPECTOR_PORT, DEV_WEB_PORT } from '@qafiyah/config';

export const INSPECTOR_PORT = Number(process.env['INSPECTOR_PORT'] ?? DEV_INSPECTOR_PORT);
export const WEB_BASE_URL = process.env['WEB_BASE_URL'] ?? `http://localhost:${DEV_WEB_PORT}`;
