'use client';

import { useState } from 'react';
import { GhostButton } from './ui/Button';

export function CreatePostmortemPRButton({
  orgId,
  incidentId,
}: {
  orgId: string;
  incidentId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setPrUrl(null);

    try {
      const res = await fetch(
        `/api/orgs/${orgId}/incidents/${incidentId}/postmortem/pr`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (!data.prUrl) {
        throw new Error('No PR URL returned from server');
      }

      setPrUrl(data.prUrl);
      // Optional: automatically open a new tab
      // window.open(data.prUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create PR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <GhostButton
        onClick={handleClick}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating...' : 'Create PR'}
      </GhostButton>

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

      {prUrl && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-xs text-emerald-400 mb-1">
            ✓ PR created successfully!
          </p>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-300 hover:text-emerald-200 underline break-all"
          >
            {prUrl}
          </a>
        </div>
      )}
    </div>
  );
}
