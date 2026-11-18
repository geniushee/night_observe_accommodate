import React, { useEffect, useRef, useState, useCallback } from "react";
import { loadNaverMapScript } from "../../utils/naverMapLoader";
import { getTop10NearestStays } from "../../utils/stayFilter";
import type { StayItem } from "../../types/stay";
import { AlertCircle, Key, Sparkles } from "lucide-react";

interface NaverMapProps {
  clientId: string;
  showOverlay: boolean;
  opacity: number;
  mapType: string;
  onOpenKeyModal: () => void;
  onUpdateTop10Stays?: (stays: StayItem[]) => void;
  selectedStayId?: string | null;
  onSelectStay?: (stay: StayItem) => void;
}

export const NaverMap: React.FC<NaverMapProps> = ({
  clientId,
  showOverlay,
  opacity,
  mapType,
  onOpenKeyModal,
  onUpdateTop10Stays,
  selectedStayId,
  onSelectStay,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoWindowRef = useRef<any>(null);

  const allStaysRef = useRef<StayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 100개 숙박 데이터 로드
  useEffect(() => {
    fetch("/assets/bortle5_stays_100.json")
      .then((res) => res.json())
      .then((data: StayItem[]) => {
        allStaysRef.current = data;
        if (mapInstanceRef.current) {
          updateMarkers();
        }
      })
      .catch((err) => console.error("숙박 데이터 로드 실패:", err));
  }, []);

  // 마커 갱신 함수 (화면 중심 기준 최단거리 10개)
  const updateMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver?.maps || allStaysRef.current.length === 0) return;

    const center = map.getCenter();
    const cLat = center.lat();
    const cLon = center.lng();

    // 주소코드 기반 1차 필터링 및 중심점 최근접 10개 선별
    const nearest10 = getTop10NearestStays(allStaysRef.current, cLat, cLon);

    // 부모에 업데이트 전달
    if (onUpdateTop10Stays) {
      onUpdateTop10Stays(nearest10);
    }

    // 기존 마커들 지도에서 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 신규 10개 마커 등록
    nearest10.forEach((stay, index) => {
      const rank = index + 1; // 1위 ~ 10위

      // 커스텀 HTML 마커 아이콘 디자인
      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(15, 23, 42, 0.95);
          color: white;
          padding: 4px 8px 4px 4px;
          border-radius: 9999px;
          border: 1.5px solid #00e5ff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 10px rgba(0,229,255,0.4);
          cursor: pointer;
          font-family: -apple-system, sans-serif;
          transform: translate(-50%, -100%);
          white-space: nowrap;
          transition: transform 0.15s ease;
        " onmouseover="this.style.transform='translate(-50%, -105%) scale(1.08)'" onmouseout="this.style.transform='translate(-50%, -100%) scale(1)'">
          <span style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            background: #00e5ff;
            color: #0f172a;
            font-size: 11px;
            font-weight: 800;
            border-radius: 50%;
          ">${rank}</span>
          <span style="font-size: 11px; font-weight: 600; color: #f1f5f9; padding-right: 2px;">
            ${stay.title.length > 9 ? stay.title.slice(0, 9) + "..." : stay.title}
          </span>
          <span style="font-size: 9px; color: #00e5ff; font-weight: bold; background: rgba(0,229,255,0.12); padding: 1px 4px; border-radius: 4px;">
            ${stay.bortleName.split(" ")[0]}
          </span>
        </div>
      `;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(stay.lat, stay.lon),
        map: map,
        icon: {
          content: markerHtml,
          anchor: new window.naver.maps.Point(0, 0),
        },
        zIndex: 100 - index,
      });

      // 마커 클릭 시 인포윈도우 오픈
      window.naver.maps.Event.addListener(marker, "click", () => {
        if (onSelectStay) onSelectStay(stay);

        const imgTag = stay.firstimage
          ? `<img src="${stay.firstimage}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px 8px 0 0;" alt="${stay.title}" />`
          : `<div style="width: 100%; height: 70px; background: #1e293b; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 11px;">사진 정보 없음</div>`;

        const naverSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(stay.title)}`;

        const infoContent = `
          <div style="
            width: 260px;
            background: #0f172a;
            color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.15);
            font-family: -apple-system, sans-serif;
          ">
            ${imgTag}
            <div style="padding: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 10px; color: #00e5ff; font-weight: bold; background: rgba(0,229,255,0.15); padding: 2px 6px; border-radius: 4px;">
                  ${stay.bortleName}
                </span>
                <span style="font-size: 11px; color: #94a3b8;">중심에서 ${stay.distanceKm}km</span>
              </div>
              <h4 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0; color: #f8fafc;">${stay.title}</h4>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 6px 0; line-height: 1.4;">${stay.addr1}</p>
              ${
                stay.tel
                  ? `<p style="font-size: 11px; color: #38bdf8; margin: 0 0 10px 0;">📞 <a href="tel:${stay.tel}" style="color: #38bdf8; text-decoration: none;">${stay.tel}</a></p>`
                  : ""
              }
              <div style="display: flex; gap: 6px;">
                <a href="${naverSearchUrl}" target="_blank" rel="noreferrer" style="
                  flex: 1;
                  text-align: center;
                  padding: 6px 0;
                  background: #00e5ff;
                  color: #0f172a;
                  font-size: 11px;
                  font-weight: bold;
                  text-decoration: none;
                  border-radius: 6px;
                ">네이버 검색/예약</a>
              </div>
            </div>
          </div>
        `;

        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.naver.maps.InfoWindow({
            content: infoContent,
            backgroundColor: "transparent",
            borderColor: "transparent",
            borderWidth: 0,
            anchorSize: new window.naver.maps.Size(0, 0),
          });
        } else {
          infoWindowRef.current.setContent(infoContent);
        }

        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [onUpdateTop10Stays, onSelectStay]);

  // 선택된 숙소로 지도 이동
  useEffect(() => {
    if (!selectedStayId || !mapInstanceRef.current || !window.naver?.maps) return;
    const stay = allStaysRef.current.find((s) => s.id === selectedStayId);
    if (stay) {
      const targetPos = new window.naver.maps.LatLng(stay.lat, stay.lon);
      mapInstanceRef.current.panTo(targetPos);
    }
  }, [selectedStayId]);

  // 지도 SDK 초기화
  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setError("네이버 지도 API Client ID (ncpKeyId)가 설정되지 않았습니다.");
      return;
    }

    setLoading(true);
    setError(null);

    loadNaverMapScript(clientId)
      .then(() => {
        if (!mapElementRef.current || !window.naver?.maps) return;

        // 대한민국 중심 좌표 (위도 36.5°N, 경도 128.2°E - 청정 산간 중심)
        const center = new window.naver.maps.LatLng(37.2, 128.4);

        const southKoreaBounds = new window.naver.maps.LatLngBounds(
          new window.naver.maps.LatLng(32.8, 124.0),
          new window.naver.maps.LatLng(39.0, 132.5)
        );

        const mapOptions = {
          center,
          zoom: 8,
          minZoom: 6,
          maxZoom: 18,
          maxBounds: southKoreaBounds,
          mapTypeId: window.naver.maps.MapTypeId[mapType] || window.naver.maps.MapTypeId.NORMAL,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.RIGHT_CENTER,
            style: window.naver.maps.ZoomControlStyle.SMALL,
          },
          scaleControl: true,
          scaleControlOptions: {
            position: window.naver.maps.Position.BOTTOM_RIGHT,
          },
          logoControlOptions: {
            position: window.naver.maps.Position.BOTTOM_LEFT,
          },
          mapDataControl: false,
        };

        const map = new window.naver.maps.Map(mapElementRef.current, mapOptions);
        mapInstanceRef.current = map;

        // GroundOverlay 생성
        const overlayBounds = new window.naver.maps.LatLngBounds(
          new window.naver.maps.LatLng(33.0, 124.5),
          new window.naver.maps.LatLng(38.9, 132.0)
        );

        const overlay = new window.naver.maps.GroundOverlay(
          "/assets/korea_lp2025.png",
          overlayBounds,
          {
            opacity,
            clickable: false,
          }
        );

        if (showOverlay) {
          overlay.setMap(map);
        }
        overlayInstanceRef.current = overlay;

        // 지도 이동 완료(idle) 시 화면 중심 기준 최단거리 10개 마커 자동 갱신
        const idleListener = window.naver.maps.Event.addListener(map, "idle", () => {
          updateMarkers();
        });

        // 창 크기 조절 대응
        const resizeListener = window.naver.maps.Event.addDOMListener(window, "resize", () => {
          map.autoResize();
        });

        setTimeout(() => {
          map.autoResize();
          updateMarkers();
        }, 150);

        setLoading(false);

        return () => {
          window.naver.maps.Event.removeListener(idleListener);
          window.naver.maps.Event.removeListener(resizeListener);
        };
      })
      .catch((err) => {
        console.error("Naver Map init error:", err);
        setError(err.message || "지도를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (overlayInstanceRef.current) {
        overlayInstanceRef.current.setMap(null);
        overlayInstanceRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [clientId]);

  // 오버레이 On/Off 토글
  useEffect(() => {
    if (!overlayInstanceRef.current || !mapInstanceRef.current) return;
    overlayInstanceRef.current.setMap(showOverlay ? mapInstanceRef.current : null);
  }, [showOverlay]);

  // 투명도 변경
  useEffect(() => {
    if (!overlayInstanceRef.current) return;
    overlayInstanceRef.current.setOpacity(opacity);
  }, [opacity]);

  // 지도 타입 변경
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps) return;
    const typeId = window.naver.maps.MapTypeId[mapType];
    if (typeId) {
      mapInstanceRef.current.setMapTypeId(typeId);
    }
  }, [mapType]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapElementRef}
        id="naver-map-container"
        className="w-full h-full bg-slate-950"
        style={{ width: "100%", height: "100%" }}
      />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20 text-white">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-cyan-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-bounce" />
            2025 광공해 및 청정 숙박 지도 로딩 중...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-20 p-6 text-center text-white">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold mb-2">네이버 지도 API 설정 안내</h2>
          <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
            {error}
            <br />
            NCP 콘솔의 <b>Application &gt; 인증 정보</b>에서 발급받은 <b>Client ID (ncpKeyId)</b>를 등록해 주세요.
          </p>
          <button
            onClick={onOpenKeyModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Key className="w-4 h-4" /> Client ID 입력하기
          </button>
        </div>
      )}
    </div>
  );
};
