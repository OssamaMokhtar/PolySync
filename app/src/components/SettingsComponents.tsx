import { useState, useEffect } from 'react';
import { Crown, Download, Trash2 } from 'lucide-react';
import { SubscriptionTier, TIER_FEATURES, UserSubscription } from '../types';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { apiFetch } from '../api';

interface SubscriptionStatusProps {
  userId: string;
}

export function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const subRef = doc(db, 'users', userId, 'subscription', 'current');
        const snap = await getDoc(subRef);
        if (snap.exists()) setSubscription(snap.data() as UserSubscription);
      } catch {}
      finally { setLoading(false); }
    };
    fetchSub();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-[#121215]/90 backdrop-blur-xl border border-[#27272A] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-4 h-4 text-[#F59E0B]" />
          <h3 className="text-sm font-semibold">Subscription</h3>
        </div>
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#27272A] border-t-[#F59E0B] mx-auto" />
      </div>
    );
  }

  const tier = subscription?.tier || 'free';
  const features = TIER_FEATURES[tier as SubscriptionTier] || [];

  return (
    <div className="bg-[#121215]/90 backdrop-blur-xl border border-[#27272A] rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Crown className="w-4 h-4 text-[#F59E0B]" />
        <h3 className="text-sm font-semibold">Subscription</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tier === 'free' ? 'bg-[#27272A] text-[#71717A]' : tier === 'premium' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#EC4899]/20 text-[#EC4899]'}`}>
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </span>
      </div>

      <div className="mb-3">
        <div className="text-xs text-[#71717A] mb-1">Your tier includes:</div>
        <div className="space-y-1">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {tier === 'free' && (
        <p className="w-full mt-3 text-xs text-[#A1A1AA]">Premium isn't available yet. Everything you use today stays free.</p>
      )}
    </div>
  );
}

interface ExportButtonProps {
  userId: string;
}

export function ExportButton({ userId }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const res = await apiFetch('/api/fitness/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error('Export failed');
      const body = format === 'csv' ? await res.text() : JSON.stringify(await res.json(), null, 2);
      const url = URL.createObjectURL(new Blob([body], { type: format === 'csv' ? 'text/csv' : 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `polysync-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Your export has downloaded.');
    } catch {
      setStatus("We couldn't export your data. Check your connection and try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-[#121215]/90 backdrop-blur-xl border border-[#27272A] rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Download className="w-4 h-4 text-[#00A3FF]" />
        Export Your Data
      </h3>
      <p className="text-xs text-[#71717A] mb-3">
        Download your workout history, progress data, and profile as JSON or CSV.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('json')}
          disabled={exporting}
          className="flex-1 py-2 rounded-xl bg-[#0D0D14] border border-[#27272A] text-sm text-[#E4E4E7] hover:border-[#00A3FF]/30 transition disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {exporting ? 'Exporting...' : 'Export as JSON'}
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="flex-1 py-2 rounded-xl bg-[#0D0D14] border border-[#27272A] text-sm text-[#E4E4E7] hover:border-[#00A3FF]/30 transition disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {exporting ? 'Exporting...' : 'Export as CSV'}
        </button>
      </div>
      {status && <p role="status" className="text-xs text-[#A1A1AA] mt-2">{status}</p>}
    </div>
  );
}

interface DeleteAccountButtonProps {
  userId: string;
}

export function DeleteAccountButton({ userId }: DeleteAccountButtonProps) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleDelete = async () => {
    if (typed !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await apiFetch('/api/fitness/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      setStatus(res.ok ? 'Your data has been deleted.' : "We couldn't delete your data. Nothing was removed. Try again, or contact support.");
    } catch {
      setStatus("We couldn't reach the server. Nothing was removed. Try again when you're online.");
    } finally {
      setDeleting(false);
      setTyped('');
    }
  };

  return (
    <div className="bg-[#121215]/90 border border-[#EF4444]/20 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 text-sm text-[#F87171] font-medium mb-2">
        <Trash2 className="w-4 h-4" aria-hidden="true" />
        Delete account
      </div>
      <p className="text-xs text-[#A1A1AA] mb-3">
        Deletes your profile, plans, workouts, check-ins and chat history. This can't be undone.
      </p>
      <label htmlFor="delete-confirm" className="block text-xs text-[#A1A1AA] mb-1">Type DELETE to confirm</label>
      <input
        id="delete-confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="w-full min-h-[44px] mb-2 bg-[#0D0D14] border border-[#27272A] rounded-lg px-3 text-sm text-[#E4E4E7]"
      />
      <button
        onClick={handleDelete}
        disabled={deleting || typed !== 'DELETE'}
        className="w-full min-h-[44px] rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#F87171] text-sm font-medium hover:bg-[#EF4444]/20 transition disabled:opacity-60"
      >
        {deleting ? 'Deleting…' : 'Delete my data'}
      </button>
      {status && <p role="status" className="text-xs text-[#E4E4E7] mt-2">{status}</p>}
    </div>
  );
}
