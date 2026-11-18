import os
import json
import requests
from PIL import Image

def generate_gangwon_30_stays():
    print("[1/3] David J. Lorenz 2025 광공해 위성 지도 래스터 로드...")
    asia_path = "assets/asia2025.png"
    Image.MAX_IMAGE_PIXELS = None
    lp_img = Image.open(asia_path)

    # Plate Carree 픽셀 변환 (Lat 5~75, Lon 60~180, 120 px/deg)
    def get_lp_value(lat, lon):
        x = int(round((lon - 60.0) * 120.0))
        y = int(round((75.0 - lat) * 120.0))
        x = max(0, min(x, lp_img.width - 1))
        y = max(0, min(y, lp_img.height - 1))
        return lp_img.getpixel((x, y))

    def value_to_bortle(val):
        # David J. Lorenz 인공광/자연광 비율 기반 Bortle Scale 매핑
        # 1: 인공광 0 (자연 칠흑)
        # 2: 0.05 ~ 0.1배 (Bortle 2, 진정한 어두운 밤하늘)
        # 3, 4: 0.1 ~ 0.33배 (Bortle 3, 시골 밤하늘, 은하수 선명)
        # 5, 6, 7: 0.33 ~ 1.8배 (Bortle 4, 시골/교외 전환)
        # 8, 9: 1.8 ~ 5.6배 (Bortle 5, 교외 밤하늘, 은하수 윤곽)
        if val <= 1:
            return 1, "Bortle 1 (완전 자연 칠흑)"
        elif val == 2:
            return 2, "Bortle 2 (어두운 밤하늘)"
        elif val in (3, 4):
            return 3, "Bortle 3 (시골 밤하늘, 은하수 선명)"
        elif val in (5, 6, 7):
            return 4, "Bortle 4 (교외 밤하늘, 은하수 뚜렷)"
        elif val in (8, 9):
            return 5, "Bortle 5 (교외 밤하늘, 은하수 윤곽)"
        elif val in (10, 11):
            return 6, "Bortle 6 (밝은 교외)"
        elif val in (12, 13):
            return 7, "Bortle 7 (도시권)"
        else:
            return 8, "Bortle 8~9 (도심 중심부)"

    print("[2/3] 한국관광공사 KorService2 API 호출 중...")
    key = "73a0a469b97c3f3600460c66dbd858d7834410891af39c1d584e1eaa9050a777"
    base_url = "https://apis.data.go.kr/B551011/KorService2"

    all_items = {}

    # 1. searchStay2 (기본 숙박 데이터)
    try:
        r = requests.get(f"{base_url}/searchStay2", params={
            "serviceKey": key, "numOfRows": 100, "pageNo": 1,
            "MobileOS": "ETC", "MobileApp": "StarlightStay",
            "_type": "json", "areaCode": 32
        }, timeout=10)
        items = r.json().get("response", {}).get("body", {}).get("items", {}).get("item", [])
        for it in items:
            all_items[it["contentid"]] = it
    except Exception as e:
        print(f"searchStay2 error: {e}")

    # 2. searchKeyword2 (펜션, 캠핑, 야영, 휴양림, 글램핑 등)
    keywords = ["펜션", "캠핑", "야영", "글램핑", "휴양림", "리조트", "게스트하우스"]
    for kw in keywords:
        try:
            r = requests.get(f"{base_url}/searchKeyword2", params={
                "serviceKey": key, "numOfRows": 50, "pageNo": 1,
                "MobileOS": "ETC", "MobileApp": "StarlightStay",
                "_type": "json", "areaCode": 32, "keyword": kw
            }, timeout=10)
            res_items = r.json().get("response", {}).get("body", {}).get("items", "")
            if isinstance(res_items, dict):
                ilist = res_items.get("item", [])
                if not isinstance(ilist, list): ilist = [ilist]
                for it in ilist:
                    all_items[it["contentid"]] = it
        except Exception as e:
            print(f"searchKeyword2 ({kw}) error: {e}")

    print(f"  - 총 수집된 강원도 숙박/야영 시설: {len(all_items)}개")

    # Bortle Scale 평가 및 필터링
    bortle5_candidates = []
    for it in all_items.values():
        mapx = it.get("mapx")
        mapy = it.get("mapy")
        if not mapx or not mapy:
            continue
        try:
            lat = float(mapy)
            lon = float(mapx)
        except ValueError:
            continue

        lp_val = get_lp_value(lat, lon)
        bortle_rank, bortle_name = value_to_bortle(lp_val)

        # 도심 해안가 바다 좌표 튀는 케이스(예: 속초 시내 해변 바로 앞) 보정
        addr = it.get("addr1", "")
        if "속초시" in addr and bortle_rank <= 2:
            bortle_rank = 6
            bortle_name = "Bortle 6 (밝은 교외)"

        if bortle_rank <= 5:
            # 주요 지역별 특징 태그 생성
            region_tag = "청정 산간"
            if "영월" in addr: region_tag = "별마로천문대권"
            elif "평창" in addr: region_tag = "대관령/육백마지기권"
            elif "정선" in addr: region_tag = "함백산/가리왕산권"
            elif "화천" in addr: region_tag = "조경철천문대권"
            elif "양구" in addr: region_tag = "국토정중앙천문대권"
            elif "인제" in addr: region_tag = "점봉산/원대리권"
            elif "홍천" in addr: region_tag = "팔봉산/오대산자락"
            elif "횡성" in addr: region_tag = "태기산권"
            elif "고성" in addr: region_tag = "DMZ 청정해변"

            bortle5_candidates.append({
                "id": it.get("contentid"),
                "title": it.get("title", "").strip(),
                "addr1": addr.strip(),
                "addr2": it.get("addr2", "").strip(),
                "tel": it.get("tel", "").strip(),
                "firstimage": it.get("firstimage", "") or it.get("firstimage2", ""),
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "lpValue": lp_val,
                "bortle": bortle_rank,
                "bortleName": bortle_name,
                "regionTag": region_tag,
                "areacode": it.get("areacode", "32"),
                "sigungucode": it.get("sigungucode", "")
            })

    # 정렬: 1순위 대표 사진 보유, 2순위 Bortle 등급 우수, 3순위 광공해 수치 낮음
    bortle5_candidates.sort(key=lambda x: (
        0 if x["firstimage"] else 1,
        x["bortle"],
        x["lpValue"],
        x["title"]
    ))

    # 중복 숙소명 정돈 후 상위 30개 선별
    unique_30 = []
    seen_titles = set()
    for s in bortle5_candidates:
        clean_title = s["title"].split("(")[0].strip()
        if clean_title in seen_titles:
            continue
        seen_titles.add(clean_title)
        unique_30.append(s)
        if len(unique_30) == 30:
            break

    # 30개가 안 채워졌을 경우 중복 필터 완화
    if len(unique_30) < 30:
        for s in bortle5_candidates:
            if s not in unique_30:
                unique_30.append(s)
                if len(unique_30) == 30:
                    break

    print(f"\n[3/3] 강원도 Bortle 5 이하 숙박시설 30개 엄선 완료!\n")
    for idx, stay in enumerate(unique_30, 1):
        img_badge = "📸" if stay["firstimage"] else "  "
        print(f"{idx:2d}. [{stay['bortleName']}] [{stay['regionTag']}] {stay['title']}")
        print(f"    - 주소: {stay['addr1']}")
        print(f"    - 좌표: ({stay['lat']}, {stay['lon']}) | 연락처: {stay['tel'] or '정보없음'} | {img_badge}")

    out_file = "public/assets/gangwon_bortle5_stays.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(unique_30, f, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON 저장 완료: {out_file} (정확히 {len(unique_30)}개)")

if __name__ == "__main__":
    generate_gangwon_30_stays()
