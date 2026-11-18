import React from "react";
import { Eye, EyeOff, Layers, Sliders, Info } from "lucide-react";

interface MapControlsProps {
  showOverlay: boolean;
  onToggleOverlay: () => void;
  opacity: number;
  onChangeOpacity: (val: number) => void;
  mapType: string;
  onChangeMapType: (type: string) => void;
  onToggleLegend: () => void;
  isLegendOpen: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showOverlay,
  onToggleOverlay,
  opacity,
  onChangeOpacity,
  mapType,
  onChangeMapType,
  onToggleLegend,
  isLegendOpen,
}) => {
  return (
    <div className="absolute top-6 right-6 z-30 flex flex-col gap-3">
      {/* 주 컨트롤 패널 */}
      <div className="bg-slate-900/90 text-white p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl w-72">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-sm tracking-wide">VIIRS 2025 광공해</span>
          </div>
          <button
            onClick={onToggleOverlay}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              showOverlay
                ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                : "bg-slate-800 hover:bg-slate-700 text-gray-400"
            }`}
          >
            {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showOverlay ? "오버레이 켬" : "오버레이 끔"}
          </button>
        </div>

        {/* 투명도 조절 슬라이더 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" /> 투명도
            </span>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            disabled={!showOverlay}
            onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* 지도 타입 전환 (네이버 지도 공식 MapTypeId: NORMAL, HYBRID, TERRAIN) */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <Layers className="w-3 h-3 text-cyan-400" /> 지도 형태
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "NORMAL", label: "일반" },
              { id: "HYBRID", label: "위성+라벨" },
              { id: "TERRAIN", label: "지형도" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => onChangeMapType(type.id)}
                className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                  mapType === type.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 하단 유틸리티 버튼 */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            onClick={onToggleLegend}
            className={`flex items-center gap-1 transition cursor-pointer ${
              isLegendOpen ? "text-cyan-300 font-semibold" : "text-gray-400 hover:text-white"
            }`}
          >
            <Info className="w-3.5 h-3.5" /> 범례 {isLegendOpen ? "닫기" : "보기"}
          </button>
        </div>
      </div>
    </div>
  );
};
