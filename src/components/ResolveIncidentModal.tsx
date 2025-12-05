'use client';

import { useState } from 'react';
import { Card } from './ui/Card';
import { PrimaryButton, GhostButton } from './ui/Button';

interface ResolveIncidentModalProps {
  incidentId: string;
  incidentTitle: string;
  orgId: string;
  onClose: () => void;
  onResolved: () => void;
}

export function ResolveIncidentModal({
  incidentId,
  incidentTitle,
  orgId,
  onClose,
  onResolved,
}: ResolveIncidentModalProps) {
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!resolutionSummary.trim()) {
      setError('Please provide a resolution summary');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // First, change status to RESOLVED
      const statusRes = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'RESOLVED',
          reason: 'Incident resolved',
        }),
      });

      if (!statusRes.ok) {
        throw new Error('Failed to update incident status');
      }

      // Then, add resolution details as an action
      const actionRes = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKind: 'RESOLUTION_DOCUMENTED',
          label: 'Incident Resolved',
          details: JSON.stringify({
            summary: resolutionSummary,
            rootCause: rootCause || 'Not specified',
            mitigation: mitigation || 'Not specified',
          }),
        }),
      });

      if (!actionRes.ok) {
        throw new Error('Failed to document resolution');
      }

      onResolved();
      onClose();
    } catch (err: any) {
      console.error('Failed to resolve incident:', err);
      setError(err.message || 'Failed to resolve incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_60px_rgba(248,113,113,0.3)]">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Resolve Incident</h2>
            <p className="text-sm text-zinc-400 mt-1">{incidentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 text-xl transition-colors"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Resolution Summary <span className="text-red-400">*</span>
            </label>
            <textarea
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              placeholder="How was this incident resolved? (e.g., Rolled back deployment, increased connection pool size)"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
              rows={3}
              disabled={submitting}
            />
            <p className="text-xs text-zinc-500 mt-1">
              This will be shown to engineers working on similar incidents
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Root Cause (Optional)
            </label>
            <textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="What caused this incident? (e.g., Database connection pool exhaustion due to N+1 query)"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Mitigation Steps (Optional)
            </label>
            <textarea
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              placeholder="What steps were taken to resolve this? (e.g., 1. Rolled back deployment, 2. Increased pool size, 3. Optimized query)"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
              rows={4}
              disabled={submitting}
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg">💡</span>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Why document resolution?</p>
                <p className="text-blue-400/80">
                  Your resolution details will help future responders quickly resolve similar incidents.
                  They'll see your solution in the "Haunted History" section.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <GhostButton onClick={onClose} disabled={submitting}>
            Cancel
          </GhostButton>
          <PrimaryButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Resolving...' : 'Resolve Incident'}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
