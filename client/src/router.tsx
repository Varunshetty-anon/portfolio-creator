// ========================
// FRAMES Router
// ========================

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, redirect } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Lazy-load feature pages for code splitting
const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const EditorLayout = lazy(() => import('@/features/editor/EditorLayout'));
const OnboardingFlow = lazy(() => import('@/features/onboarding/OnboardingFlow'));
const PortfolioLayout = lazy(() => import('@/features/portfolio/PortfolioLayout'));
const TestPlayerPage = lazy(() => import('@/features/portfolio/TestPlayerPage'));
const AuditPortfolio = lazy(() => import('@/features/portfolio/AuditPortfolio'));
const VisionPrototype = lazy(() => import('@/features/vision/VisionPrototype'));
const VisionA = lazy(() => import('@/features/vision/VisionA'));
const VisionB = lazy(() => import('@/features/vision/VisionB'));
const VisionC = lazy(() => import('@/features/vision/VisionC'));

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
  {
    path: '/audit-player',
    element: (
      <SuspenseWrapper>
        <TestPlayerPage />
      </SuspenseWrapper>
    )
  },
  {
    path: '/audit-portfolio',
    element: (
      <SuspenseWrapper>
        <AuditPortfolio />
      </SuspenseWrapper>
    )
  },
  {
    path: '/vision',
    element: (
      <SuspenseWrapper>
        <VisionPrototype />
      </SuspenseWrapper>
    )
  },
  {
    path: '/vision-a',
    element: (
      <SuspenseWrapper>
        <VisionA />
      </SuspenseWrapper>
    )
  },
  {
    path: '/vision-b',
    element: (
      <SuspenseWrapper>
        <VisionB />
      </SuspenseWrapper>
    )
  },
  {
    path: '/vision-c',
    element: (
      <SuspenseWrapper>
        <VisionC />
      </SuspenseWrapper>
    )
  },
  // Alias: /@username → /portfolio/username
  // React Router v6 doesn't support partial dynamic segments (/@:username)
  {
    path: '/:handle',
    loader: ({ params }) => {
      const handle = params.handle || '';
      if (handle.startsWith('@')) {
        return redirect(`/portfolio/${handle.slice(1)}`);
      }
      // If it doesn't start with @, let it fall through to 404 (by throwing or returning null)
      // Actually loader can't easily fallback to the next route in v6 if matched.
      // We should throw a 404 Response.
      throw new Response('Not Found', { status: 404 });
    },
    errorElement: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
  // Legacy route support: /v/username → /portfolio/username
  {
    path: '/v/:username',
    loader: ({ params }) => redirect(`/portfolio/${params.username}`),
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
