"use client";

import { motion } from "framer-motion";

interface MiniChartProps {
  data: number[];
  color: string;
  label: string;
  height?: number;
}

export default function MiniChart({ data, color, label, height = 80 }: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 300;
  const h = height;
  const pad = 8;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const area = `${pad},${h - pad} ${polyline} ${w - pad},${h - pad}`;

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs tracking-widest uppercase text-white/30 mb-3">{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon points={area} fill={`url(#grad-${label})`} />
        {/* Line */}
        <motion.polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Last point dot */}
        <circle
          cx={points[points.length - 1].split(",")[0]}
          cy={points[points.length - 1].split(",")[1]}
          r="3"
          fill={color}
        />
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-white/20">Jan</span>
        <span className="text-[10px] text-white/20">Mar</span>
      </div>
    </div>
  );
}
