import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Upload,
  Wand2,
  Download,
  RotateCcw,
  Info,
  Loader2,
  MoveHorizontal,
  Camera,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/* Tuned, identity-preserving adjustments: mild exposure/contrast/clarity only.
   No face reshaping, no skin smoothing — the goal is a clearer photo, not a different face. */
async function enhanceImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process this image.');
  ctx.filter = 'brightness(1.06) contrast(1.08) saturate(1.05)';
  ctx.drawImage(bitmap, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

export default function EnhancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('That image is larger than 10 MB. Please choose a smaller photo.');
      return;
    }
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setEnhancedUrl(null);
  };

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const url = await enhanceImage(file);
      setEnhancedUrl(url);
      setPosition(50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setError('');
    setPosition(50);
  };

  const download = () => {
    if (!enhancedUrl || !file) return;
    const a = document.createElement('a');
    a.href = enhancedUrl;
    a.download = `acne lyze-enhanced-${file.name.replace(/\.[^.]+$/, '')}.jpg`;
    a.click();
  };

  const moveHandle = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => moveHandle(e.clientX);
    const onTouch = (e: TouchEvent) => e.touches[0] && moveHandle(e.touches[0].clientX);
    const stop = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, [dragging, moveHandle]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-700 sm:text-3xl">AI Image Enhancement</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-400">
          Improve lighting, clarity and color balance of your facial photos — while fully
          preserving identity, facial structure and natural skin texture.
        </p>
      </div>

      <Card className="flex items-start gap-3 border-powder-200 bg-powder-50 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" />
        <p className="text-sm leading-relaxed text-navy-600">
          AcneLyze enhancement applies gentle, identity-preserving corrections only — no
          beauty filters, no skin smoothing and no changes to your facial features.
        </p>
      </Card>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!originalUrl ? (
        <Card className="p-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-200 bg-mist px-6 py-16 text-center transition-colors hover:border-navy-300 hover:bg-powder-50"
          >
            <Upload className="h-10 w-10 text-navy-300" />
            <p className="mt-4 text-sm font-semibold text-navy-600">Upload a facial photo to enhance</p>
            <p className="mt-1 text-xs text-navy-400">JPG, PNG or WebP · up to 10 MB</p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-6">
            {enhancedUrl ? (
              <>
                <div
                  ref={containerRef}
                  className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-2xl bg-mist"
                  onMouseDown={(e) => {
                    setDragging(true);
                    moveHandle(e.clientX);
                  }}
                  onTouchStart={(e) => {
                    setDragging(true);
                    if (e.touches[0]) moveHandle(e.touches[0].clientX);
                  }}
                >
                  <img
                    src={enhancedUrl}
                    alt="Enhanced"
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                  />
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                    draggable={false}
                  />
                  <div
                    className="compare-handle absolute inset-y-0 z-10 w-0.5 bg-white shadow-lg"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-navy-600 shadow-card-hover">
                      <MoveHorizontal className="h-5 w-5" />
                    </div>
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-navy-800/70 px-3 py-1 text-xs font-semibold text-white">
                    Before
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-peach-300 px-3 py-1 text-xs font-semibold text-navy-700">
                    After
                  </span>
                </div>
                <p className="mt-3 text-center text-xs text-navy-400">
                  Drag the handle to compare original and enhanced versions
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="aspect-[4/5] w-full rounded-2xl object-cover"
                />
                {processing && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-navy-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Enhancing your photo…
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-navy-700">Enhancement controls</h2>
              <div className="mt-5 space-y-3">
                {!enhancedUrl ? (
                  <Button className="w-full" loading={processing} onClick={process}>
                    <Wand2 className="h-4 w-4" /> Enhance image
                  </Button>
                ) : (
                  <>
                    <Button className="w-full" onClick={download}>
                      <Download className="h-4 w-4" /> Download enhanced image
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setEnhancedUrl(null)}>
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                  </>
                )}
                <Button variant="ghost" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Choose a different photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Start over
                </Button>
              </div>
            </Card>

            <Card className="bg-mist p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">
                What enhancement does
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-navy-600">
                <li>· Gently improves exposure and contrast</li>
                <li>· Balances color for a clearer photo</li>
                <li>· Keeps facial structure and skin texture untouched</li>
                <li>· Processes entirely on your device — the photo is never uploaded</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
