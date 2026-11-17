import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Upload,
  Camera,
  X,
  ScanFace,
  Info,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import {
  uploadFaceImage,
  createAnalysis,
  getAnalysis,
  getSignedImageUrl,
  deleteAnalysis,
} from '@/services/api';
import type { SkinAnalysis } from '@/types';
import { formatDate, severityLabels } from '@/lib/utils';

const PROGRESS_STEPS = [
  'Preparing your image securely',
  'Uploading to private storage',
  'Recording the analysis request',
  'Waiting for the AI model connection',
];

export default function AnalysisPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewId = searchParams.get('review');

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState<SkinAnalysis | null>(null);
  const [review, setReview] = useState<SkinAnalysis | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadReview = useCallback(
    async (id: string) => {
      setReviewLoading(true);
      try {
        const a = await getAnalysis(id);
        if (a) {
          setReview(a);
          const url = await getSignedImageUrl(a.image_path);
          setReviewUrl(url);
        }
      } catch {
        setReview(null);
      } finally {
        setReviewLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (reviewId) loadReview(reviewId);
    else {
      setReview(null);
      setReviewUrl(null);
    }
  }, [reviewId, loadReview]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCameraError(
        'Camera access was blocked or is unavailable on this device. You can upload a photo instead.',
      );
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(captured);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.92,
    );
  };

  const onFileChange = (f: File | null) => {
    setSubmitError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setSubmitError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setSubmitError('That image is larger than 10 MB. Please choose a smaller photo.');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setSubmitted(null);
    setSubmitError('');
    setProgress(0);
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setSubmitting(true);
    setSubmitError('');
    setProgress(0);
    const ticker = setInterval(() => {
      setProgress((p) => (p < 92 ? p + 4 : p));
    }, 220);
    try {
      const path = await uploadFaceImage(user.id, file);
      setProgress(70);
      const analysis = await createAnalysis(path);
      setProgress(100);
      setSubmitted(analysis);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while submitting your image. Please try again.',
      );
    } finally {
      clearInterval(ticker);
      setSubmitting(false);
    }
  };

  const handleDelete = async (a: SkinAnalysis) => {
    try {
      await supabaseRemove(a.image_path);
    } catch {
      /* ignore storage cleanup failure */
    }
    await deleteAnalysis(a.id);
    setSearchParams({});
    setReview(null);
    setReviewUrl(null);
  };

  const supabaseRemove = async (path: string) => {
    await supabase.storage.from('face-images').remove([path]);
  };

  /* ---------------- Review mode ---------------- */
  if (reviewId) {
    const hasResults = review?.status === 'complete' && review.acne_severity !== null;
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">Analysis review</h1>
            <p className="mt-1 text-sm text-navy-400">
              {review ? formatDate(review.created_at) : 'Loading…'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSearchParams({})}>
              New analysis
            </Button>
            {review && (
              <Button variant="danger" onClick={() => handleDelete(review)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        </div>

        {reviewLoading || (!review && reviewLoading) ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-navy-300" />
          </div>
        ) : !review ? (
          <Card className="p-10 text-center text-navy-400">This analysis could not be found.</Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              {reviewUrl ? (
                <img src={reviewUrl} alt="Analysed face" className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-mist text-navy-300">
                  <ScanFace className="h-10 w-10" />
                </div>
              )}
            </Card>
            <Card className="p-6">
              {hasResults ? (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-powder-100 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-navy-500">
                      Acne severity classification
                    </p>
                    <p className="mt-1 font-serif text-2xl text-navy-700">
                      {severityLabels[review.acne_severity as string]}
                    </p>
                  </div>
                  {review.detected_concerns && review.detected_concerns.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">
                        Detected skin concerns
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {review.detected_concerns.map((c) => (
                          <span key={c} className="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-500">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {review.affected_area && (
                    <div className="rounded-xl bg-mist p-4 text-sm text-navy-600">
                      <span className="font-semibold">Affected area:</span>{' '}
                      {review.affected_area.region} — {review.affected_area.extent}
                    </div>
                  )}
                  {review.summary && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Summary</h3>
                      <p className="mt-2 text-sm leading-relaxed text-navy-600">{review.summary}</p>
                    </div>
                  )}
                  {review.suggestions && review.suggestions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">
                        Personalized suggestions
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {review.suggestions.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-sm text-navy-600">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                    <Info className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="mt-4 font-semibold text-navy-700">Demo state — model not connected</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
                    Your image was saved securely and the analysis request was recorded, but
                    the AI model has not returned results yet. DermaLens only displays
                    outcomes produced by the real model — never fabricated predictions.
                  </p>
                  <Link to="/dashboard/routine" className="mt-6">
                    <Button variant="outline">
                      Build your routine in the meantime <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- New analysis mode ---------------- */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">AI Skin Analysis</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-400">
          Upload or capture a clear, well-lit photo of your face. Your image is stored
          privately and only you can see it.
        </p>
      </div>

      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed text-amber-800">
          <span className="font-semibold">Demo state:</span> the AI model is not connected
          yet. You can submit your photo and it will be stored securely with a recorded
          request — results appear automatically once the model goes live. DermaLens does
          not diagnose medical conditions and never shows invented predictions.
        </p>
      </Card>

      {submitError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input side */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-700">Choose your photo</h2>

          {!cameraOn && !previewUrl && (
            <div className="mt-4 space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-200 bg-mist px-6 py-12 text-center transition-colors hover:border-navy-300 hover:bg-powder-50"
              >
                <Upload className="h-9 w-9 text-navy-300" />
                <p className="mt-3 text-sm font-semibold text-navy-600">
                  Click to upload a facial photo
                </p>
                <p className="mt-1 text-xs text-navy-400">JPG, PNG or WebP · up to 10 MB</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" className="w-full" onClick={startCamera}>
                <Camera className="h-4 w-4" /> Use camera instead
              </Button>
              {cameraError && <p className="text-sm text-red-500">{cameraError}</p>}
            </div>
          )}

          {cameraOn && (
            <div className="mt-4 space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-navy-800">
                <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full scale-x-[-1] object-cover" />
                <div className="pointer-events-none absolute inset-8 rounded-[50%] border-2 border-white/60" />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={capturePhoto}>
                  <Camera className="h-4 w-4" /> Capture photo
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          )}

          {previewUrl && !cameraOn && (
            <div className="mt-4 space-y-4">
              <div className="relative overflow-hidden rounded-2xl">
                <img src={previewUrl} alt="Uploaded preview" className="aspect-[4/5] w-full object-cover" />
                <button
                  onClick={reset}
                  className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-navy-600 shadow-md transition-colors hover:text-navy-800"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="truncate text-xs text-navy-400">{file?.name}</p>
              <Button className="w-full" loading={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting…' : 'Submit for analysis'}
              </Button>
            </div>
          )}
        </Card>

        {/* Status side */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-700">Submission status</h2>
          {submitting && (
            <div className="mt-6">
              <div className="h-2.5 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-powder-300 to-lavender-300 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="mt-5 space-y-3">
                {PROGRESS_STEPS.map((s, i) => {
                  const threshold = ((i + 1) / PROGRESS_STEPS.length) * 100;
                  const active = progress >= threshold - 24;
                  return (
                    <li key={s} className="flex items-center gap-3 text-sm">
                      {active ? (
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-navy-300" />
                      )}
                      <span className={active ? 'text-navy-600' : 'text-navy-300'}>{s}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!submitting && !submitted && (
            <div className="mt-6 rounded-2xl bg-mist p-6 text-sm leading-relaxed text-navy-500">
              <p className="flex items-center gap-2 font-semibold text-navy-600">
                <ShieldCheck className="h-4 w-4" /> What happens to your photo
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-4">
                <li>Stored in a private, access-controlled space — only your account can view it.</li>
                <li>The analysis request is recorded and queued for the AI model.</li>
                <li>Results appear in your history as soon as the model returns them.</li>
                <li>You can delete any analysis, including its photo, at any time.</li>
              </ul>
            </div>
          )}

          {!submitting && submitted && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h3 className="mt-3 font-semibold text-navy-700">Submitted successfully</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">
                Your photo is saved securely and the analysis request has been recorded
                with a <span className="font-semibold">pending</span> status. You'll see
                results here the moment the AI model processes it.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => setSearchParams({ review: submitted.id })}>
                  View request <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={reset}>
                  Analyze another photo
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
