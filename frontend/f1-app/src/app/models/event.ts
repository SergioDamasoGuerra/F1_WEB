export interface Circuit {
  id: number;
  name: string;
  type?: string;
  imageUrl?: string;
  infoUrl?: string;
}

export interface Country {
  id: number;
  code: string;
  name: string;
  flagUrl?: string;
}

export interface Event {
  id: number;
  name: string;
  officialName: string;
  year: number;
  dateStart: string;
  dateEnd: string;
  isCancelled: boolean;
  status: 'done' | 'current' | 'upcoming' | 'cancelled';
  countryId: number;
  country?: Country;
  circuitId: number;
  circuit?: Circuit;
}


/*
export interface EventAPI {
  circuit_key: number;
  circuit_info_url: string;
  circuit_image: string;
  circuit_short_name: string;
  circuit_type: string;
  country_code: string;
  country_flag: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  is_cancelled: boolean;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
}
*/
