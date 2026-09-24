'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { reportError } from '@/lib/observability/report-error';

type IslandErrorBoundaryProps = {
  readonly feature: string;
  readonly fallback: ReactNode;
  readonly children: ReactNode;
};

type IslandErrorBoundaryState = {
  readonly hasError: boolean;
};

export class IslandErrorBoundary extends Component<
  IslandErrorBoundaryProps,
  IslandErrorBoundaryState
> {
  override state: IslandErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): IslandErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    reportError('react island crashed', error, {
      feature: this.props.feature,
      extra: { componentStack: info.componentStack },
    });
  }

  override render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
