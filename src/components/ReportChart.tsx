interface DataPoint {
  date: string;
  confidence: number;
  clarity: number;
  emotionalIntensity: number;
}

interface Props {
  data: DataPoint[];
}

const W = 320;
const H = 160;
const PAD = { top: 12, right: 12, bottom: 28, left: 24 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function toPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export default function ReportChart({ data }: Props) {
  if (data.length === 0) return null;

  if (data.length === 1) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-textSecondary">More sessions will show trends here.</p>
        <div className="flex gap-4 text-xs text-textMuted">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green" /> Confidence: {data[0].confidence}</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue" /> Clarity: {data[0].clarity}</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber" /> Intensity: {data[0].emotionalIntensity}</span>
        </div>
      </div>
    );
  }

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * CHART_W;
  const yScale = (v: number) => PAD.top + CHART_H - ((v - 1) / 9) * CHART_H;

  const confPoints = data.map((d, i) => ({ x: xScale(i), y: yScale(d.confidence) }));
  const clarPoints = data.map((d, i) => ({ x: xScale(i), y: yScale(d.clarity) }));
  const intePoints = data.map((d, i) => ({ x: xScale(i), y: yScale(d.emotionalIntensity) }));

  const yLabels = [1, 4, 7, 10];

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        {/* Grid */}
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yScale(v)}
              x2={PAD.left + CHART_W} y2={yScale(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text x={PAD.left - 4} y={yScale(v) + 4} textAnchor="end" fill="#5A5850" fontSize="9">{v}</text>
          </g>
        ))}

        {/* Lines */}
        <path d={toPath(confPoints)} fill="none" stroke="#2D8A5E" strokeWidth="2" strokeLinejoin="round" />
        <path d={toPath(clarPoints)} fill="none" stroke="#3A7BD5" strokeWidth="2" strokeLinejoin="round" />
        <path d={toPath(intePoints)} fill="none" stroke="#D4953A" strokeWidth="2" strokeLinejoin="round" />

        {/* Dots */}
        {confPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2D8A5E" />)}
        {clarPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3A7BD5" />)}
        {intePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#D4953A" />)}

        {/* X axis dates (first and last) */}
        <text x={xScale(0)} y={H - 4} textAnchor="middle" fill="#5A5850" fontSize="8">
          {data[0].date.slice(5)}
        </text>
        <text x={xScale(data.length - 1)} y={H - 4} textAnchor="middle" fill="#5A5850" fontSize="8">
          {data[data.length - 1].date.slice(5)}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-textMuted">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-green" />Confidence</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-blue" />Clarity</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber" />Intensity</span>
      </div>
    </div>
  );
}
