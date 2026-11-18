import React from "react";
import { Info, X } from "lucide-react";

interface LegendPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const colorLevels = [
    { color: "#000000", border: "#555", label: "자연 밤하늘 (광공해 0, 최상급 은하수)", ratio: "< 0.05배" },
    { color: "#142f72", border: "transparent", label: "극미세 (Bortle 2, 맑은 은하수 디테일)", ratio: "0.18 ~ 0.33배" },
    { color: "#2154d8", border: "transparent", label: "청색 구역 (Bortle 3, 육안 은하수 뚜렷)", ratio: "0.33 ~ 0.60배" },
    { color: "#1fa12a", border: "transparent", label: "녹색 구역 (Bortle 4, 교외/시골 밤하늘)", ratio: "1.0 ~ 1.8배" },
    { color: "#b8a625", border: "transparent", label: "황색 구역 (Bortle 5, 은하수 윤곽 희미)", ratio: "3.2 ~ 5.6배" },
    { color: "#bf641e", border: "transparent", label: "주황 구역 (Bortle 6, 밝은 교외)", ratio: "5.6 ~ 10배" },
    { color: "#fb5a49", border: "transparent", label: "적색 구역 (Bortle 7, 도시권 밤하늘)", ratio: "18 ~ 32배" },
    { color: "#f2f2f2", border: "#888", label: "백색 구역 (Bortle 8~9, 도심 중심부)", ratio: "> 56배" },
  ];

  return (
    <div className="absolute bottom-6 left-6 z-30 max-w-sm w-full bg-slate-900/90 text-white p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm">2025 광공해 등급 안내</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        인공광 / 자연 밤하늘 밝기 비율 (David J. Lorenz VIIRS 2025)
      </p>

      <div className="space-y-2 text-xs">
        {colorLevels.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span
                className="w-4 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color, border: `1px solid ${item.border}` }}
              />
              <span className="text-gray-200 truncate">{item.label}</span>
            </div>
            <span className="text-gray-400 font-mono text-[11px] flex-shrink-0">{item.ratio}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-cyan-300/80">
        ✨ 짙은 청색~검정색 구역이 은하수 및 딥스카이 관측 명당입니다.
      </div>
    </div>
  );
};
