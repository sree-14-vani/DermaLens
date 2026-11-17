import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanFace, Trash2, Eye, Info } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { listAnalyses, getSignedImageUrl, deleteAnalysis } from '@/services/api';
import type { SkinAnalysis } from '@/types';
import { formatDate, severityLabels } from '@/lib/utils';

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SkinAnalysis | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await listAnalyses();
        setAnalyses(rows);
        const urls: Record<string, string> = {};
        await Promise.all(
          rows.map(async (a) => {
            try {
              urls[a.id] = await getSignedImageUrl(a.image_path);
            } catch {
              /* thumbnail unavailable */
            }
          }),
        );
        setThumbs(urls);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your analyses.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await supabase.storage.from('face-images').remove([pendingDelete.image_path]);
      await deleteAnalysis(pendingDelete.id);
      setAnalyses((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setError('Could not delete this analysis. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">Analysis History</h1>
          <p className="mt-1 text-sm text-navy-400">
            {analyses.length} saved anal{analyses.length === 1 ? 'ysis' : 'yses'}
          </p>
        </div>
        <Link to="/dashboard/analysis">
          <Button>New analysis</Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {analyses.length === 0 ? (
        <EmptyState
          icon={<ScanFace className="h-7 w-7" />}
          title="No analyses yet"
          description="When you run your first AI skin analysis, the record will appear here with its image and status."
          action={
            <Link to="/dashboard/analysis">
              <Button>Run your first analysis</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {analyses.map((a) => (
            <Card key={a.id} hover className="overflow-hidden">
              <div className="aspect-[4/3] bg-mist">
                {thumbs[a.id] ? (
                  <img src={thumbs[a.id]} alt="Analysed face" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-navy-300">
                    <ScanFace className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-700">{formatDate(a.created_at)}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      a.status === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-1 flex min-h-[20px] items-center gap-1.5 text-xs text-navy-400">
                  {a.status === 'complete' && a.acne_severity ? (
                    severityLabels[a.acne_severity]
                  ) : (
                    <>
                      <Info className="h-3.5 w-3.5" /> Awaiting AI model results
                    </>
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/dashboard/analysis?review=${a.id}`)}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(a)} aria-label="Delete analysis">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete this analysis?">
        <p className="text-sm leading-relaxed text-navy-500">
          This permanently removes the analysis record and its photo. This cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
