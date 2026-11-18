import { useState } from "react";
import { NaverMap } from "./components/Map/NaverMap";
import { MapControls } from "./components/Map/MapControls";
import { LegendPanel } from "./components/Map/LegendPanel";
import { NearbyStaysDrawer } from "./components/Map/NearbyStaysDrawer";
import type { StayItem } from "./types/stay";
import { Moon } from "lucide-react";

export function App() {
  // .env 환경변수에서 네이버 지도 Client ID 로드
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || "";

  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(0.85);
  const [mapType, setMapType] = useState("NORMAL");
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // 화면 중심 인근 상위 10개 숙소 목록 및 선택된 숙소 ID
  const [top10Stays, setTop10Stays] = useState<StayItem[]>([]);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);

  const handleSelectStay = (stay: StayItem) => {
    setSelectedStayId(stay.id);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 풀스크린 네이버 지도 (GroundOverlay + 중심 최단거리 10개 마커) */}
      <NaverMap
        clientId={clientId}
        showOverlay={showOverlay}
        opacity={opacity}
        mapType={mapType}
        onUpdateTop10Stays={setTop10Stays}
        selectedStayId={selectedStayId}
        onSelectStay={handleSelectStay}
      />

      {/* 2. 좌측 상단 플로팅 브랜드 로고 */}
      <header className="absolute top-6 left-6 z-30 pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-900/90 text-white px-4 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl shadow-md text-slate-950">
            <Moon className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                Starlight Stay
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                Bortle ≤ 5
              </span>
            </div>
            <p className="text-[11px] text-gray-400">화면 중심 인근 청정 숙소 10선 탐색</p>
          </div>
        </div>
      </header>

      {/* 3. 우측 상단 맵 컨트롤 패널 */}
      <MapControls
        showOverlay={showOverlay}
        onToggleOverlay={() => setShowOverlay((prev) => !prev)}
        opacity={opacity}
        onChangeOpacity={setOpacity}
        mapType={mapType}
        onChangeMapType={setMapType}
        onToggleLegend={() => setIsLegendOpen((prev) => !prev)}
        isLegendOpen={isLegendOpen}
      />

      {/* 4. 화면 중심 기준 가장 가까운 10개 숙소 가로 슬라이더 바텀 시트 */}
      <NearbyStaysDrawer
        stays={top10Stays}
        selectedStayId={selectedStayId}
        onSelectStay={handleSelectStay}
      />

      {/* 5. 좌측 하단 광공해 등급 범례 패널 */}
      <LegendPanel isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />
    </div>
  );
}

export default App;
