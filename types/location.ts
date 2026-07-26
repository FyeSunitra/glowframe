export interface GeoName {
  id: number
  nameTh: string
  nameEn: string
}

export type Province = GeoName
export type District = GeoName

export interface Subdistrict extends GeoName {
  zipCode: number
}
