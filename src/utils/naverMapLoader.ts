declare global {
  interface Window {
    __naver_map_init__?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadNaverMapScript(keyId: string): Promise<void> {
  if (window.naver && window.naver.maps) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // 기존 스크립트가 있다면 제거
    const existing = document.getElementById("naver-map-script");
    if (existing) {
      existing.remove();
    }

    // 전역 콜백 등록
    const callbackName = "__naver_map_init__";
    window[callbackName] = () => {
      delete window[callbackName];
      if (window.naver && window.naver.maps) {
        resolve();
      } else {
        reject(new Error("네이버 지도 SDK 초기화에 실패했습니다."));
      }
    };

    const script = document.createElement("script");
    script.id = "naver-map-script";
    script.type = "text/javascript";
    // 공식 문서 표준: ncpKeyId 파라미터 사용
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      keyId.trim()
    )}&submodules=geocoder&callback=${callbackName}`;
    script.async = true;

    script.onerror = () => {
      delete window[callbackName];
      reject(
        new Error(
          "네이버 지도 API 스크립트 로드에 실패했습니다. Client ID (ncpKeyId) 및 NCP 콘솔의 Web 서비스 URL 설정을 확인해주세요."
        )
      );
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
