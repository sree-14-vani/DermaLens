import { severityLabels } from '@/lib/utils';
import type { AnalysisRegionResult } from '@/types';

/* Region label overlay positions (percent of face image box) */
const regionMarkers: { region: AnalysisRegionResult['region']; label: string; x: number; y: number }[] = [
  { region: 'forehead', label: 'Forehead', x: 50, y: 14 },
  { region: 'left_cheek', label: 'Left cheek', x: 24, y: 55 },
  { region: 'right_cheek', label: 'Right cheek', x: 76, y: 55 },
  { region: 'nose', label: 'Nose', x: 50, y: 55 },
  { region: 'chin', label: 'Chin', x: 50, y: 85 },
];

const severityColor: Record<string, string> = {
  mild: 'bg-amber-400',
  moderate: 'bg-orange-500',
  severe: 'bg-red-500',
  very_severe: 'bg-red-700',
};

export default function RegionMap({
  imageUrl,
  regions,
}: {
  imageUrl: string | null;
  regions: AnalysisRegionResult[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-mist">
      {imageUrl ? (
        <img src={imageUrl} alt="Analysed face" className="aspect-[4/5] w-full object-cover" />
      ) : (
        <div className="aspect-[4/5] w-full" />
      )}
      {regions.length > 0 &&
        regionMarkers.map((marker) => {
          const result = regions.find((r) => r.region === marker.region);
          const color = result?.severity ? severityColor[result.severity] : 'bg-navy-400';
          const tooltip =
            result?.severity != null
              ? severityLabels[result.severity] ?? result.severity
              : result?.findings ?? 'No findings returned';
          return (
            <div
              key={marker.region}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            >
              <span className={`block h-4 w-4 rounded-full ring-2 ring-white ${color} opacity-90`} />
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy-800 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {marker.label}: {tooltip}
                {result?.confidence != null && ` (${Math.round(result.confidence * 100)}%)`}
              </span>
            </div>
          );
        })}
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-800/70 px-3 py-1 text-[11px] font-medium text-white">
        Hover markers for region findings
      </span>
    </div>
  );
}
