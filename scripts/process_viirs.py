import os
import io
import math
import json
import requests
import numpy as np
from PIL import Image

def process():
    print("[1/4] VIIRS 2025 아시아 광공해 원본 확인 및 다운로드...")
    asia_path = "assets/asia2025.png"
    url = "https://djlorenz.github.io/astronomy/lp2025/Asia2025B.png"

    if os.path.exists(asia_path):
        print(f"  - 로컬 파일 사용: {asia_path}")
        Image.MAX_IMAGE_PIXELS = None
        src_img = Image.open(asia_path)
    else:
        print(f"  - 원본 다운로드 중: {url}")
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        with open(asia_path, "wb") as f:
            f.write(resp.content)
        Image.MAX_IMAGE_PIXELS = None
        src_img = Image.open(io.BytesIO(resp.content))
        print(f"  - 원본 저장 완료: {asia_path}")

    print(f"  - 원본 크기: {src_img.size}, 모드: {src_img.mode}")

    # David Lorenz 아시아 지도 좌표계 (Plate Carrée, EPSG:4326)
    # 범위: 위도 5°N ~ 75°N, 경도 60°E ~ 180°E (120 pixels/degree)
    AS_LAT_MIN, AS_LAT_MAX = 5.0, 75.0
    AS_LON_MIN, AS_LON_MAX = 60.0, 180.0
    PPD = 120  # pixels per degree

    # 대한민국 전역 (마라도 남단 ~ 고성 DMZ 북단, 서해 백령도 ~ 동해 독도)
    LAT_MIN, LAT_MAX = 33.0, 38.9
    LON_MIN, LON_MAX = 124.5, 132.0

    print(f"[2/4] 대한민국 영역 추출 (위도 {LAT_MIN}~{LAT_MAX}, 경도 {LON_MIN}~{LON_MAX}) 및 Web Mercator 투영 변환...")
    out_width = int(round((LON_MAX - LON_MIN) * PPD))   # 900 px
    out_height = int(round((LAT_MAX - LAT_MIN) * PPD))  # 708 px

    palette = src_img.getpalette()
    palette_rgb = [palette[i:i+3] for i in range(0, len(palette), 3)]

    def lat_to_merc(lat_deg):
        r = math.radians(lat_deg)
        return math.log(math.tan(math.pi / 4.0 + r / 2.0))

    def merc_to_lat(merc):
        return math.degrees(2.0 * math.atan(math.exp(merc)) - math.pi / 2.0)

    y_merc_min = lat_to_merc(LAT_MIN)
    y_merc_max = lat_to_merc(LAT_MAX)

    v_norm = np.linspace(0.0, 1.0, out_height)
    merc_ys = y_merc_max - v_norm * (y_merc_max - y_merc_min)
    lats = np.array([merc_to_lat(my) for my in merc_ys])

    src_y_indices = np.clip(np.round((AS_LAT_MAX - lats) * PPD).astype(np.int32), 0, src_img.height - 1)
    u_norm = np.linspace(0.0, 1.0, out_width)
    lons = LON_MIN + u_norm * (LON_MAX - LON_MIN)
    src_x_indices = np.clip(np.round((lons - AS_LON_MIN) * PPD).astype(np.int32), 0, src_img.width - 1)

    min_sx, max_sx = src_x_indices.min(), src_x_indices.max()
    min_sy, max_sy = src_y_indices.min(), src_y_indices.max()
    crop_p = src_img.crop((min_sx, min_sy, max_sx + 1, max_sy + 1))
    crop_arr = np.array(crop_p)

    rel_y = src_y_indices - min_sy
    rel_x = src_x_indices - min_sx
    warped_p = crop_arr[np.ix_(rel_y, rel_x)]

    print("[3/4] 알파 채널(투명도) 최적화...")
    rgba_img = np.zeros((out_height, out_width, 4), dtype=np.uint8)

    for idx in range(256):
        mask = (warped_p == idx)
        if not np.any(mask):
            continue
        rgb = palette_rgb[idx] if idx < len(palette_rgb) else [0, 0, 0]

        if idx == 0:
            # 경계선
            alpha = 40
        elif idx == 1:
            # 자연 밤하늘 / 광공해 0 -> 완전 투명화하여 네이버 지도 노출
            alpha = 0
        elif idx == 2:
            alpha = 75
        elif idx == 3:
            alpha = 120
        else:
            # 광공해 발광 지역 (선명하면서 도로망과 지명이 투과되는 반투명)
            alpha = 180

        rgba_img[mask, 0] = rgb[0]
        rgba_img[mask, 1] = rgb[1]
        rgba_img[mask, 2] = rgb[2]
        rgba_img[mask, 3] = alpha

    output_png = "public/assets/korea_lp2025.png"
    out_pil = Image.fromarray(rgba_img, mode="RGBA")
    out_pil.save(output_png, format="PNG", optimize=True)

    meta = {
        "title": "Korea Light Pollution 2025 (VIIRS)",
        "source": "David J. Lorenz (VIIRS 2025)",
        "bounds": {
            "south": LAT_MIN,
            "north": LAT_MAX,
            "west": LON_MIN,
            "east": LON_MAX
        },
        "width": out_width,
        "height": out_height
    }
    output_meta = "public/assets/korea_lp2025_meta.json"
    with open(output_meta, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print(f"[4/4] 완료!")
    print(f"  - 이미지: {output_png} ({out_width}x{out_height}, {os.path.getsize(output_png)/1024:.1f} KB)")
    print(f"  - 메타데이터: {output_meta}")

if __name__ == "__main__":
    process()
