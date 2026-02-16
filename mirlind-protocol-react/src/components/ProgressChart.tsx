import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  date?: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  unit?: string;
  target?: number;
  height?: number;
}

export function ProgressChart({
  data,
  title,
  color = '#10b981',
  unit = '',
  target,
  height = 200,
}: ProgressChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), target || 0);
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;
  const width = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) =>
    padding.left + (index / (data.length - 1 || 1)) * width;
  const getY = (value: number) =>
    padding.top + innerHeight - ((value - minValue) / range) * innerHeight;

  // Create path for line
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
    .join(' ');

  // Create area path
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
      
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padding.left}
            y1={padding.top + innerHeight * tick}
            x2={chartWidth - padding.right}
            y2={padding.top + innerHeight * tick}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="4"
          />
        ))}

        {/* Target line */}
        {target && (
          <>
            <line
              x1={padding.left}
              y1={getY(target)}
              x2={chartWidth - padding.right}
              y2={getY(target)}
              stroke={color}
              strokeDasharray="8 4"
              opacity={0.5}
            />
            <text
              x={chartWidth - padding.right + 5}
              y={getY(target) + 4}
              fill={color}
              fontSize="12"
            >
              Target
            </text>
          </>
        )}

        {/* Area under line */}
        <motion.path
          d={areaPath}
          fill={color}
          opacity={0.1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Data points */}
        {data.map((d, i) => (
          <motion.g
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r={6}
              fill="#1e293b"
              stroke={color}
              strokeWidth={2}
            />
            <title>
              {d.label}: {d.value}{unit} {d.date ? `(${d.date})` : ''}
            </title>
          </motion.g>
        ))}

        {/* X-axis labels */}
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, i) => (
          <text
            key={i}
            x={getX(i === 0 ? 0 : data.length - 1)}
            y={chartHeight - 10}
            fill="#94a3b8"
            fontSize="12"
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((tick) => {
          const value = minValue + range * (1 - tick);
          return (
            <text
              key={tick}
              x={padding.left - 10}
              y={padding.top + innerHeight * tick + 4}
              fill="#94a3b8"
              fontSize="12"
              textAnchor="end"
            >
              {Math.round(value)}{unit}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
