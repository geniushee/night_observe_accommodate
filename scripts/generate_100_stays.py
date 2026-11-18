import os
import json
import requests
from PIL import Image

def generate_100_bortle5_stays():
    print("[1/4] David J. Lorenz 2025 광공해 위성 지도 래스터 로드...")
    asia_path = "assets/asia2025.png"
    Image.MAX_IMAGE_PIXELS = None
    lp_img = Image.open(asia_path)

    def get_lp_value(lat, lon):
        x = int(round((lon - 60.0) * 120.0))
        y = int(round((75.0 - lat) * 120.0))
        x = max(0, min(x, lp_img.width - 1))
        y = max(0, min(y, lp_img.height - 1))
        return lp_img.getpixel((x, y))

    def value_to_bortle(val):
        if val <= 1:
            return 1, "Bortle 1 (완전 자연 칠흑)"
        elif val == 2:
            return 2, "Bortle 2 (진정한 어두운 밤하늘)"
        elif val in (3, 4):
            return 3, "Bortle 3 (시골 밤하늘, 은하수 선명)"
        elif val in (5, 6, 7):
            return 4, "Bortle 4 (시골/교외 전환, 은하수 뚜렷)"
        elif val in (8, 9):
            return 5, "Bortle 5 (교외 밤하늘, 은하수 윤곽)"
        elif val in (10, 11):
            return 6, "Bortle 6 (밝은 교외 밤하늘)"
        elif val in (12, 13):
            return 7, "Bortle 7 (도시/교외 전환)"
        else:
            return 8, "Bortle 8~9 (도심 중심부)"

    print("[2/4] 한국관광공사 KorService2 API에서 청정 지역 숙박 데이터 수집 중...")
    key = "73a0a469b97c3f3600460c66dbd858d7834410891af39c1d584e1eaa9050a777"
    base_url = "https://apis.data.go.kr/B551011/KorService2"

    all_items = {}

    # 주요 청정 밤하늘 지역: 강원(32), 경북(35: 영양, 영천, 청송, 봉화 등), 충북(33: 단양, 제천)
    target_areas = [
        (32, "강원특별자치도"),
        (35, "경상북도"),
        (33, "충청북도")
    ]

    # 1. searchStay2 조회
    for area_code, area_name in target_areas:
        print(f"  - {area_name} searchStay2 수집 중...")
        for page in range(1, 4):
            try:
                r = requests.get(f"{base_url}/searchStay2", params={
                    "serviceKey": key, "numOfRows": 50, "pageNo": page,
                    "MobileOS": "ETC", "MobileApp": "StarlightStay",
                    "_type": "json", "areaCode": area_code
                }, timeout=10)
                if r.status_code != 200:
                    continue
                data = r.json()
                items = data.get("response", {}).get("body", {}).get("items", "")
                if isinstance(items, dict):
                    ilist = items.get("item", [])
                    if not isinstance(ilist, list): ilist = [ilist]
                    for it in ilist:
                        if isinstance(it, dict) and it.get("contentid"):
                            all_items[it["contentid"]] = it
            except Exception as e:
                print(f"Error {area_name} p{page}: {e}")

    # 2. searchKeyword2 (펜션, 캠핑, 야영, 휴양림, 글램핑)
    keywords = ["캠핑", "펜션", "야영", "글램핑", "휴양림"]
    for area_code, area_name in target_areas:
        for kw in keywords:
            try:
                r = requests.get(f"{base_url}/searchKeyword2", params={
                    "serviceKey": key, "numOfRows": 40, "pageNo": 1,
                    "MobileOS": "ETC", "MobileApp": "StarlightStay",
                    "_type": "json", "areaCode": area_code, "keyword": kw
                }, timeout=10)
                if r.status_code != 200:
                    continue
                data = r.json()
                items = data.get("response", {}).get("body", {}).get("items", "")
                if isinstance(items, dict):
                    ilist = items.get("item", [])
                    if not isinstance(ilist, list): ilist = [ilist]
                    for it in ilist:
                        if isinstance(it, dict) and it.get("contentid"):
                            all_items[it["contentid"]] = it
            except Exception as e:
                pass

    print(f"  - 총 수집된 후보 숙박시설: {len(all_items)}개")

    print("[3/4] 광공해 래스터 기반 Bortle 5 이하 정밀 필터링...")
    bortle5_stays = []

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

        addr = it.get("addr1", "").strip()
        # 바다 인근 도심 좌표 보정 (속초/강릉 도심지 해변 바다 픽셀 오판정 방지)
        if any(city in addr for city in ["속초시", "포항시 남구", "강릉시 교동"]):
            continue

        lp_val = get_lp_value(lat, lon)
        bortle_rank, bortle_name = value_to_bortle(lp_val)

        if bortle_rank <= 5:
            # 지역 태그 분류
            region_tag = "청정 산간"
            if "영월" in addr: region_tag = "별마로천문대권"
            elif "평창" in addr: region_tag = "대관령/육백마지기권"
            elif "정선" in addr: region_tag = "함백산/가리왕산권"
            elif "화천" in addr: region_tag = "조경철천문대권"
            elif "양구" in addr: region_tag = "국토정중앙천문대권"
            elif "인제" in addr: region_tag = "점봉산/원대리권"
            elif "양양" in addr: region_tag = "구룡령/법수치권"
            elif "홍천" in addr: region_tag = "팔봉산/오대산자락"
            elif "횡성" in addr: region_tag = "태기산권"
            elif "영양" in addr: region_tag = "국제밤하늘보호공원권"
            elif "영천" in addr: region_tag = "보현산천문대권"
            elif "청송" in addr: region_tag = "주왕산 청정권"
            elif "봉화" in addr: region_tag = "백두대간수목원권"
            elif "단양" in addr: region_tag = "소백산천문대권"
            elif "제천" in addr: region_tag = "월악산 청정권"

            bortle5_stays.append({
                "id": it.get("contentid"),
                "title": it.get("title", "").strip(),
                "addr1": addr,
                "addr2": it.get("addr2", "").strip(),
                "tel": it.get("tel", "").strip(),
                "firstimage": it.get("firstimage", "") or it.get("firstimage2", ""),
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "lpValue": lp_val,
                "bortle": bortle_rank,
                "bortleName": bortle_name,
                "regionTag": region_tag,
                "areacode": str(it.get("areacode", "")),
                "sigungucode": str(it.get("sigungucode", ""))
            })

    # 중복 숙소명 제거
    unique_candidates = []
    seen_titles = set()
    for s in bortle5_stays:
        base_title = s["title"].split("(")[0].strip()
        if base_title in seen_titles:
            continue
        seen_titles.add(base_title)
        unique_candidates.append(s)

    # 정렬: 1순위 대표사진 보유, 2순위 Bortle 청정등급, 3순위 광공해 수치 낮음
    unique_candidates.sort(key=lambda x: (
        0 if x["firstimage"] else 1,
        x["bortle"],
        x["lpValue"],
        x["title"]
    ))

    target_count = min(100, len(unique_candidates))
    selected_100 = unique_candidates[:target_count]

    print(f"\n[4/4] Bortle 5 이하 숙박업소 {len(selected_100)}개 선별 완료!")
    out_file = "public/assets/bortle5_stays_100.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(selected_100, f, indent=2, ensure_ascii=False)

    print(f"✅ 저장 완료: {out_file} ({len(selected_100)}개, {os.path.getsize(out_file)/1024:.1f} KB)")

if __name__ == "__main__":
    generate_100_bortle5_stays()
