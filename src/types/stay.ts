export interface StayItem {
  id: string;
  title: string;
  addr1: string;
  addr2: string;
  tel: string;
  firstimage: string;
  lat: number;
  lon: number;
  lpValue: number;
  bortle: number;
  bortleName: string;
  regionTag: string;
  areacode: string;
  sigungucode: string;
  distanceKm?: number;
}
