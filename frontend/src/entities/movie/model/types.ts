export type RatingSource = 'tmdb' | 'imdb' | 'rotten_tomatoes' | 'metacritic';

export type MovieDetailResponse = {
  title: string;
  originalTitle: string;
  language: string;
  overview: string;
  tagline: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  runtime: number | null;
  revenue: number;
  budget: number;
  certification: string | null;
  productionCountries: string[];
  genres: { name: string; slug: string }[];
  ratings: { source: RatingSource; score: string, value: string; voteCount: number | null }[];
};

