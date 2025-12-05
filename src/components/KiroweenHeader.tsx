'use client';

import { useRouter } from 'next/navigation';
import { OrgSwitcher } from './OrgSwitcher';

interface KiroweenHeaderProps {
  orgSlug: string;
}

export function KiroweenHeader({ orgSlug }: KiroweenHeaderProps) {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push(`/orgs/${orgSlug}/incidents`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-gradient-to-r from-[#050712] via-[#090b16] to-[#050712] backdrop-blur-xl px-4 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left side - Logo and branding */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-90 transition-all duration-200 group"
        >
          {/* Pumpkin icon badge */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-orange-400/10 text-xl transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(248,113,113,0.6)] group-hover:scale-105">
            🎃
          </div>
          
          {/* Text block */}
          <div className="text-left">
            <div className="text-lg font-semibold text-zinc-50 tracking-tight">
              Runbook Revenant
            </div>
            <div className="text-xs text-zinc-400 hidden sm:block">
              Bringing runbooks back from the dead
            </div>
          </div>
        </button>

        {/* Right side - Edition pill and org switcher */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-orange-500/50 bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-300 transition-colors hover:bg-orange-500/20 hover:border-orange-400">
            <span>✨</span>
            <span>Kiroween Edition</span>
          </div>
          <OrgSwitcher />
        </div>
      </div>
      
      {/* Mobile edition pill - below header on small screens */}
      <div className="sm:hidden mt-2 flex justify-end">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/50 bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-300">
          <span>✨</span>
          <span>Kiroween Edition</span>
        </div>
      </div>
    </header>
  );
}
