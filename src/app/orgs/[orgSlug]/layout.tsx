'use client';

import { KiroweenHeader } from '@/components/KiroweenHeader';
import { useParams } from 'next/navigation';

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Halloween night sky gradient background */}
      <div className="fixed inset-0 bg-[#050712] bg-[radial-gradient(circle_at_20%_20%,_rgba(248,113,113,0.08),_transparent_55%),radial-gradient(circle_at_80%_80%,_rgba(56,189,248,0.05),_transparent_55%)]" />
      
      {/* Ghost blob decorations - behind content */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top-left ghost */}
        <div className="absolute top-20 left-10 h-40 w-40 rounded-full bg-gradient-to-b from-purple-500/15 via-transparent to-transparent blur-3xl animate-ghost-float" />
        
        {/* Mid-right ghost with emoji */}
        <div className="absolute top-1/3 right-20 h-48 w-48 rounded-full bg-gradient-to-b from-orange-500/12 via-transparent to-transparent blur-3xl animate-ghost-float-slow">
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">
            👻
          </div>
        </div>
        
        {/* Bottom-left ghost */}
        <div className="absolute bottom-32 left-1/4 h-36 w-36 rounded-full bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-3xl animate-ghost-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content - above ghosts */}
      <div className="relative z-10 min-h-screen text-zinc-50">
        <KiroweenHeader orgSlug={orgSlug} />
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
