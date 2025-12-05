'use client';

import { OrgSwitcher } from '@/components/OrgSwitcher';
import { useParams, useRouter } from 'next/navigation';

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const handleLogoClick = () => {
    router.push(`/orgs/${orgSlug}/incidents`);
  };

  return (
    <div className="min-h-screen bg-[#050712] text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur px-4 py-3 flex items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="text-2xl">🎃</span>
          <div>
            <div className="font-semibold text-lg text-zinc-50">
              Runbook Revenant
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                Bringing runbooks back from the dead
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-300 border border-orange-500/40">
                Kiroween Edition
              </span>
            </div>
          </div>
        </button>
        <OrgSwitcher />
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">{children}</main>
    </div>
  );
}
