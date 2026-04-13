-- CreateEnum
CREATE TYPE "RatingSource" AS ENUM ('tmdb', 'imdb', 'rotten_tomatoes', 'metacritic');

-- AlterTable: convert source column from TEXT to RatingSource enum, preserving data
ALTER TABLE "movie_ratings"
  ALTER COLUMN "source" TYPE "RatingSource"
  USING "source"::"RatingSource";
