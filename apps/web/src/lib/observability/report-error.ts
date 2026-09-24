import * as Sentry from '@sentry/astro';

type ReportErrorContext = {
  readonly feature: string;
  readonly tags?: Readonly<Record<string, string>>;
  readonly extra?: Readonly<Record<string, unknown>>;
};

export function reportError(message: string, cause: unknown, context: ReportErrorContext): void {
  const error = cause instanceof Error ? cause : new Error(message);
  Sentry.captureException(error, {
    tags: { feature: context.feature, ...context.tags },
    extra: { reportMessage: message, ...context.extra, cause },
  });
}
