// ========================
// FRAMES Public Portfolio Layout (Placeholder)
// ========================
// Will be fully built in Phase 6.
// For now: fetches and displays public portfolio data.

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioApi } from '@/lib/api';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AlertCircle } from 'lucide-react';
import type { PortfolioData } from '@/types';

const PortfolioLayout: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    loadPortfolio(username);
  }, [username]);

  const loadPortfolio = async (slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await portfolioApi.getPublic(slug) as PortfolioData;
      setPortfolio(data);
    } catch {
      setError('Portfolio not found or not published yet.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading portfolio..." />;
  }

  if (error || !portfolio) {
    return (
      <div className="h-screen bg-frames-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-display font-medium text-white mb-2">
          Portfolio Unavailable
        </h2>
        <p className="text-zinc-500 text-sm max-w-sm mb-8 leading-relaxed">
          {error || 'This portfolio could not be found.'}
        </p>
        <a
          href="/"
          className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors text-sm"
        >
          Go Home
        </a>
      </div>
    );
  }

  // Scaffold — full premium portfolio view will be built in Phase 6
  return (
    <div className="min-h-screen bg-frames-bg text-white">
      {/* Two-panel layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Sidebar — Fixed on desktop */}
        <aside className="lg:w-[35%] lg:max-w-md lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-frames-border p-8 lg:p-12 flex flex-col justify-center">
          {/* Profile Image */}
          {portfolio.profileImageUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800 mb-6">
              <img
                src={portfolio.profileImageUrl}
                alt={portfolio.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">
            {portfolio.name}
          </h1>
          <p className="text-zinc-400 text-lg mb-4">{portfolio.role}</p>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            {portfolio.bio}
          </p>

          {portfolio.location && (
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              📍 {portfolio.location}
            </p>
          )}
        </aside>

        {/* Right Content — Scrollable */}
        <main className="flex-1 lg:ml-[35%] p-8 lg:p-12">
          {/* Projects */}
          {portfolio.projects.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-8">
                My Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.projects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative rounded-xl overflow-hidden border border-frames-border bg-frames-surface aspect-video cursor-pointer hover:border-zinc-700 transition-all"
                  >
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <span className="text-zinc-700 text-sm">{project.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        <p className="text-white font-medium text-sm">{project.title}</p>
                        <p className="text-zinc-400 text-xs">{project.contentType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {portfolio.tools.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-8">
                Tools & Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {portfolio.tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Contact */}
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-8">
              Let's Connect
            </h2>
            <p className="text-zinc-400 text-sm">
              {portfolio.contactEmail && (
                <a
                  href={`mailto:${portfolio.contactEmail}`}
                  className="text-white hover:text-accent-gold transition-colors underline underline-offset-4"
                >
                  {portfolio.contactEmail}
                </a>
              )}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PortfolioLayout;
