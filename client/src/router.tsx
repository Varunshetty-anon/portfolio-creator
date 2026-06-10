// ========================
// FRAMES Router
// ========================

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, redirect, useRouteError } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Lazy-load feature pages for code splitting
const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const EditorLayout = lazy(() => import('@/features/editor/EditorLayout'));
const OnboardingFlow = lazy(() => import('@/features/onboarding/OnboardingFlow'));
const PortfolioLayout = lazy(() => import('@/features/portfolio/PortfolioLayout'));
const AuditMedia = lazy(() => import('@/pages/AuditMedia'));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingScreen message="Loading..." />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <GlobalErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <AuthPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/editor',
    errorElement: <GlobalErrorBoundary />,
    element: (
      <ProtectedRoute requireOnboarded>
        <SuspenseWrapper>
          <EditorLayout />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding',
    errorElement: <GlobalErrorBoundary />,
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <OnboardingFlow />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/portfolio/:username',
    errorElement: <GlobalErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <PortfolioLayout />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/audit-videos',
    errorElement: <GlobalErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <AuditMedia />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/404',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
  // Custom clean URL support (e.g. domain.com/username)
  // React Router will match specific routes (/editor, /onboarding) first.
  // Anything else falls through to here, functioning as a native URL shortener.
  {
    path: '/:username',
    errorElement: <GlobalErrorBoundary />,
    element: (
      <SuspenseWrapper>
        <PortfolioLayout />
      </SuspenseWrapper>
    ),
  },
  // Legacy route support: /v/username → /portfolio/username
  {
    path: '/v/:username',
    loader: ({ params }) => redirect(`/${params.username}`),
  },
  {
    path: '/portfolio/:username',
    loader: ({ params }) => redirect(`/${params.username}`),
  },
  // 404
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
]);

// Automatically catch chunk loading errors and hard reload the page
function GlobalErrorBoundary() {
  const error = useRouteError() as any;
  
  // Detect chunk loading errors (Vite dynamic import failures after deployments)
  const isChunkLoadError = 
    error && 
    (error.message?.includes('Failed to fetch dynamically imported module') ||
     error.message?.includes('Importing a module script failed') ||
     error.name === 'ChunkLoadError');
     
  if (isChunkLoadError) {
    // Prevent infinite reload loop by setting a brief session storage flag
    const hasReloaded = sessionStorage.getItem('chunk_reload');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk_reload', 'true');
      window.location.reload();
      return null;
    }
  }

  return <NotFound />;
}

// Simple 404 page
function NotFound() {
  return (
    <div className="h-screen bg-frames-bg flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-6xl font-display font-bold text-white mb-4">404</h1>
      <p className="text-frames-text-muted text-lg mb-8">
        This page doesn't exist.
      </p>
      <a
        href="/"
        className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
      >
        Go Home
      </a>
    </div>
  );
}
