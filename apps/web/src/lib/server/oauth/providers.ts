const PROVIDER_NAMES = ['google', 'github'] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

type Provider = {
  readonly authorize: string;
  readonly token: string;
  readonly scope: string;
};

export const PROVIDERS: Readonly<Record<ProviderName, Provider>> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
  },
};

export function resolveProvider(raw: string | undefined): ProviderName | undefined {
  return PROVIDER_NAMES.find((candidate) => candidate === raw);
}

export function authorizeUrl(
  provider: ProviderName,
  state: string,
  redirectUri: string,
  clientId: string
): string {
  const url = new URL(PROVIDERS[provider].authorize);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', PROVIDERS[provider].scope);
  url.searchParams.set('state', state);
  return url.toString();
}
