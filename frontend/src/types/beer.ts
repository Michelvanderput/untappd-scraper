export interface BeerData {
  name: string;
  beer_url: string;
  image_url: string | null;
  style: string | null;
  brewery: string | null;
  brewery_url: string | null;
  category: string;
  subcategory: string | null;
  abv: number | null;
  ibu: number | null;
  rating: number | null;
  container: string | null;
}

export interface ApiResponse {
  beers: BeerData[];
  count: number;
}

export type RandomizerMode = 'all' | 'high-abv' | 'top-rated' | 'low-abv' | 'high-ibu';
