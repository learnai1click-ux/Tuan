import React from "react";
import { C } from "../theme";

// "Lướt": con quái vật điện thoại, hiện thân của sự xao nhãng.
export const Monster: React.FC<{
  size?: number;
  glow?: number; // 0..1
  grin?: number; // 0..1 độ mở miệng
  t?: number; // frame để rung nhẹ
  style?: React.CSSProperties;
}> = ({ size = 260, glow = 1, grin = 0.5, t = 0, style }) => {
  const wob = Math.sin(t / 5) * 3;
  return (
    <svg
      viewBox="-40 -40 280 420"
      width={size}
      height={(size * 420) / 280}
      style={{ overflow: "visible", filter: `drop-shadow(0 0 ${30 * glow}px rgba(255,60,90,${0.65 * glow})) drop-shadow(0 0 ${70 * glow}px rgba(139,92,246,${0.5 * glow}))`, ...style }}
    >
      {/* chân tay mảnh */}
      <path d={`M40 300 Q30 ${340 + wob} 20 360`} stroke="#2b1d3d" strokeWidth={10} strokeLinecap="round" fill="none" />
      <path d={`M160 300 Q170 ${340 - wob} 180 360`} stroke="#2b1d3d" strokeWidth={10} strokeLinecap="round" fill="none" />
      <path d={`M0 150 Q-30 ${180 + wob} -25 220`} stroke="#2b1d3d" strokeWidth={10} strokeLinecap="round" fill="none" />
      <path d={`M200 150 Q240 ${120 - wob} 235 80`} stroke="#2b1d3d" strokeWidth={10} strokeLinecap="round" fill="none" />
      {/* thân điện thoại */}
      <rect x={0} y={0} width={200} height={320} rx={34} fill="#140d1f" stroke="#3d2a57" strokeWidth={6} />
      <rect x={14} y={22} width={172} height={276} rx={22} fill="url(#scr)" />
      <defs>
        <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1f6b" />
          <stop offset="1" stopColor="#1b0f33" />
        </linearGradient>
      </defs>
      <rect x={80} y={8} width={40} height={6} rx={3} fill="#3d2a57" />
      {/* mắt đỏ xếch */}
      <path d="M40 120 L92 138 L88 152 L42 140 Z" fill={C.red} />
      <path d="M160 120 L108 138 L112 152 L158 140 Z" fill={C.red} />
      {/* miệng răng cưa */}
      <path
        d={`M45 ${200} L65 ${200 + 18 * grin} L85 200 L100 ${200 + 22 * grin} L115 200 L135 ${200 + 18 * grin} L155 200`}
        stroke={C.red}
        strokeWidth={6}
        fill="none"
        strokeLinejoin="round"
      />
      {/* biểu tượng thông báo */}
      <circle cx={186} cy={14} r={20} fill={C.red} />
      <text x={186} y={22} fontSize={24} fontWeight={800} fill="#fff" textAnchor="middle" fontFamily="sans-serif">
        99
      </text>
    </svg>
  );
};
