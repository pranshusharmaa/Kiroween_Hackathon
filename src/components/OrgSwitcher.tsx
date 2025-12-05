'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Org = {
  id: string;
  name: string;
  slug: string;
  billingPlan?: string;
  createdAt?: string;
  role?: string;
};

export function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch('/api/orgs', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load orgs');
        const data = await res.json();
        // API shape: { orgs: [...] }
        setOrgs(data.orgs ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrgs();
  }, []);

  if (loading) {
    return <div className="text-xs text-gray-400">Loading orgs…</div>;
  }

  if (!orgs.length) {
    return <div className="text-xs text-gray-400">No organizations</div>;
  }

  const handleChange = (slug: string) => {
    router.push(`/orgs/${slug}/incidents`);
  };

  const defaultSlug = orgs[0]?.slug ?? '';

  return (
    <select
      className="bg-slate-900 text-sm text-gray-100 border border-orange-500/40 rounded-md px-3 py-1.5 hover:border-orange-500/60 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors"
      defaultValue={defaultSlug}
      onChange={(e) => handleChange(e.target.value)}
    >
      {orgs.map((org) => (
        <option key={org.id} value={org.slug} className="bg-slate-900">
          {org.name} {org.role ? `(${org.role})` : ''}
        </option>
      ))}
    </select>
  );
}
