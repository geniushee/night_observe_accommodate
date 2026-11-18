import type { StayItem } from "../types/stay";

// 두 위경도 좌표 간의 구면 거리 계산 (Haversine 공식, 단위: km)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구 평균 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 주요 시군구 코드별 중심 좌표 테이블 (1차 빠른 선별용 Centroid)
// "areacode_sigungucode": { lat, lon, name }
const REGION_CENTROIDS: Record<string, { lat: number; lon: number; name: string }> = {
  // 강원특별자치도 (areaCode: 32)
  "32_1": { lat: 37.7519, lon: 128.876, name: "강릉시" },
  "32_2": { lat: 38.3806, lon: 128.4678, name: "고성군" },
  "32_4": { lat: 37.4499, lon: 129.1652, name: "삼척시" },
  "32_6": { lat: 38.1054, lon: 128.0016, name: "양구군" },
  "32_7": { lat: 38.0754, lon: 128.6189, name: "양양군" },
  "32_8": { lat: 37.1837, lon: 128.4619, name: "영월군" },
  "32_10": { lat: 38.0697, lon: 128.1704, name: "인제군" },
  "32_11": { lat: 37.3806, lon: 128.6608, name: "정선군" },
  "32_12": { lat: 38.1468, lon: 127.3134, name: "철원군" },
  "32_14": { lat: 37.1641, lon: 128.9856, name: "태백시" },
  "32_15": { lat: 37.3705, lon: 128.3903, name: "평창군" },
  "32_16": { lat: 37.6972, lon: 127.8887, name: "홍천군" },
  "32_17": { lat: 38.1062, lon: 127.7082, name: "화천군" },
  "32_18": { lat: 37.4918, lon: 127.9853, name: "횡성군" },

  // 경상북도 (areaCode: 35)
  "35_14": { lat: 36.6579, lon: 129.1126, name: "영양군" },
  "35_15": { lat: 35.9733, lon: 128.9385, name: "영천시" },
  "35_18": { lat: 36.4364, lon: 129.0573, name: "청송군" },
  "35_20": { lat: 36.8931, lon: 128.7325, name: "봉화군" },
  "35_16": { lat: 36.9936, lon: 129.4003, name: "울진군" },

  // 충청북도 (areaCode: 33)
  "33_3": { lat: 36.9846, lon: 128.3655, name: "단양군" },
  "33_7": { lat: 37.1326, lon: 128.1913, name: "제천시" },
};

/**
 * 화면 중심에서 가장 가까운 10개 숙박시설을 선별하는 함수
 *
 * [최적화 2단계 파이프라인]
 * 1단계: 주소코드(시군구) 중심점과 화면 중심 간의 거리를 비교하여 인접 상위 4개 시군구를 1차 선별
 * 2단계: 선별된 시군구에 속한 숙소들 중에서만 정밀 거리(Haversine)를 계산하여 가장 가까운 10개 추출
 */
export function getTop10NearestStays(
  stays: StayItem[],
  centerLat: number,
  centerLon: number
): StayItem[] {
  if (!stays || stays.length === 0) return [];

  // 1단계: 지도 중심과 가장 가까운 인접 시군구 상위 4개 선정
  const regionDistances = Object.entries(REGION_CENTROIDS).map(([codeKey, centroid]) => {
    return {
      codeKey,
      dist: calculateDistanceKm(centerLat, centerLon, centroid.lat, centroid.lon),
    };
  });
  regionDistances.sort((a, b) => a.dist - b.dist);
  const nearestRegionKeys = new Set(regionDistances.slice(0, 4).map((r) => r.codeKey));

  // 2단계: 1차 선정된 시군구에 속한 숙소만 후보군으로 수집
  let candidates = stays.filter((s) => {
    const key = `${s.areacode}_${s.sigungucode}`;
    return nearestRegionKeys.has(key);
  });

  // 후보군이 10개 미만일 경우 전체 숙소 풀에서 거리 계산하여 안전하게 보충
  if (candidates.length < 10) {
    candidates = stays;
  }

  // 3단계: 화면 중심점과의 정밀 거리 계산 및 정렬 후 상위 10개 반환
  const candidatesWithDist = candidates.map((s) => ({
    ...s,
    distanceKm: calculateDistanceKm(centerLat, centerLon, s.lat, s.lon),
  }));

  candidatesWithDist.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  return candidatesWithDist.slice(0, 10);
}
