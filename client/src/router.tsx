// ========================
// FRAMES Router
// ========================

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Lazy-load feature pages for code splitting
const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const EditorLayout = lazy(() => import('@/features/editor/EditorLayout'));
const OnboardingFlow = lazy(() => import('@/features/onboarding/OnboardingFlow'));
const PortfolioLayout = lazy(() => import('@/features/portfolio/PortfolioLayout'));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingScreen message="Loading..." />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <AuthPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/editor',
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
    element: (
      <SuspenseWrapper>
        <PortfolioLayout />
      </SuspenseWrapper>
    ),
  },
  // Alias: /@username → /portfolio/username
  {
    path: '/@:username',
    element: <Navigate to="/portfolio/:username" replace />,
    loader: ({ params }) => {
      return null; // Handled by Navigate
    },
  },
  // Legacy route support: /v/username → /portfolio/username
  {
    path: '/v/:username',
    loader: ({ params }) => {
      return null;
    },
    element: <RedirectToPortfolio />,
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

// Redirect helper for legacy /v/ routes
function RedirectToPortfolio() {
  const params = new URL(window.location.href);
  const pathParts = params.pathname.split('/');
  const username = pathParts[pathParts.length - 1];
  return <Navigate to={`/portfolio/${username}`} replace />;
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
