import * as Sentry from '@sentry/astro';

Sentry.init({
  dsn: 'https://acbece4802d36f6e2904c8d673635c0d@o4511571113148416.ingest.us.sentry.io/4511594177560576',
  enabled: !import.meta.env.DEV,
  environment: import.meta.env.DEV ? 'development' : 'production',
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: true,
    cookies: false,
    httpHeaders: { request: true, response: true },
    httpBodies: ['incomingRequest', 'outgoingRequest', 'incomingResponse', 'outgoingResponse'],
    urlQueryParams: false,
    graphQL: { document: true, variables: true },
    genAI: { inputs: true, outputs: true },
    databaseQueryData: true,
    stackFrameVariables: true,
    frameContextLines: 7,
  },
  beforeSend: (event) => {
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers.cookie;
      }
    }
    return event;
  },
});
