import React, { useState } from "react";
import type { StayItem } from "../../types/stay";
import { Sparkles, ChevronUp, ChevronDown, Navigation, Phone, ExternalLink } from "lucide-react";

interface NearbyStaysDrawerProps {
  stays: StayItem[];
  selectedStayId: string | null;
  onSelectStay: (stay: StayItem) => void;
}

export const NearbyStaysDrawer: React.FC<NearbyStaysDrawerProps> = ({
  stays,
  selectedStayId,
  onSelectStay,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!stays || stays.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 left-6 md:left-auto md:w-[480px] z-30 transition-all duration-300">
      <div className="bg-slate-900/95 text-white rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
        {/* 드로어 헤더 */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-xs md:text-sm text-gray-100 flex items-center gap-1.5">
                화면 중심 인근 청정 숙소 10선
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  Bortle ≤ 5
                </span>
              </h3>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white p-1 rounded-lg">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* 가로 스크롤 카드 리스트 */}
        {isExpanded && (
          <div className="p-3 overflow-x-auto flex gap-3 scrollbar-thin scrollbar-thumb-slate-700">
            {stays.map((stay, idx) => {
              const isSelected = selectedStayId === stay.id;
              const naverSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(stay.title)}`;

              return (
                <div
                  key={stay.id}
                  onClick={() => onSelectStay(stay)}
                  className={`flex-shrink-0 w-60 rounded-xl bg-slate-800/90 border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-cyan-400 ring-2 ring-cyan-400/30 bg-slate-800"
                      : "border-white/5 hover:border-white/20"
                  }`}
                >
                  {/* 상단 썸네일 */}
                  <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                    {stay.firstimage ? (
                      <img
                        src={stay.firstimage}
                        alt={stay.title}
                        className="w-full h-full object-cover transition transform hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        사진 정보 없음
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-slate-950/80 text-cyan-400 font-extrabold text-[11px] border border-cyan-400/40">
                      #{idx + 1}
                    </span>
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-gray-200">
                      {stay.bortleName.split(" ")[0]}
                    </span>
                  </div>

                  {/* 카드 내용 */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span className="text-cyan-300 font-medium truncate">{stay.regionTag}</span>
                        <span className="flex items-center gap-0.5 text-gray-300 font-mono text-[10px]">
                          <Navigation className="w-2.5 h-2.5 text-cyan-400" /> {stay.distanceKm}km
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-white truncate mb-1" title={stay.title}>
                        {stay.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mb-2" title={stay.addr1}>
                        {stay.addr1}
                      </p>
                    </div>

                    {/* 하단 버튼 */}
                    <div className="flex gap-1.5 pt-2 border-t border-white/5">
                      {stay.tel && (
                        <a
                          href={`tel:${stay.tel}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-cyan-300 flex items-center justify-center transition"
                          title="전화 걸기"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <a
                        href={naverSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        네이버 예약 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
