export interface ChangelogEntry {
  date: string;
  summary: {
    added: number;
    removed: number;
    updated: number;
    total_beers: number;
  };
  added: Array<{
    name: string;
    beer_url: string;
    brewery?: string;
    abv?: number;
    rating?: number;
  }>;
  removed: Array<{
    name: string;
    beer_url: string;
  }>;
  updated: Array<{
    name: string;
    beer_url: string;
    changes: {
      rating?: {
        old: number;
        new: number;
      };
      abv?: {
        old: number;
        new: number;
      };
      ibu?: {
        old: number;
        new: number;
      };
    };
  }>;
}

export interface Changelog {
  changes: ChangelogEntry[];
}
