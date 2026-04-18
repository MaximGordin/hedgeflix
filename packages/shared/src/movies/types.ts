export type RatingSource = 'tmdb' | 'imdb' | 'rotten_tomatoes' | 'metacritic';

export type MovieDetailResponse = {
  title: string;
  originalTitle: string;
  language: string;
  overview: string | null;
  tagline: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  runtime: number | null;
  revenue: number;
  budget: number;
  certification: string | null;
  productionCountries: string[];
  genres: { name: string; slug: string }[];
  ratings: { source: RatingSource; score: number | null; value: string; voteCount: number | null }[];
};
