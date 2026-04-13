-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('UNSET', 'FEMALE', 'MALE', 'NON_BINARY');

-- AlterTable
ALTER TABLE "movie_ratings" ADD COLUMN     "vote_count" INTEGER;

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "production_countries" TEXT[];

-- AlterTable
ALTER TABLE "persons" DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'UNSET';

-- CreateIndex
CREATE INDEX "bookmarks_movie_id_idx" ON "bookmarks"("movie_id");

-- CreateIndex
CREATE INDEX "comments_movie_id_idx" ON "comments"("movie_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "movie_cast_person_id_idx" ON "movie_cast"("person_id");

-- CreateIndex
CREATE INDEX "movie_crew_person_id_idx" ON "movie_crew"("person_id");

-- CreateIndex
CREATE INDEX "movie_recommendations_target_id_idx" ON "movie_recommendations"("target_id");

-- CreateIndex
CREATE INDEX "movie_similar_target_id_idx" ON "movie_similar"("target_id");

-- CreateIndex
CREATE INDEX "person_images_person_id_idx" ON "person_images"("person_id");

-- CreateIndex
CREATE INDEX "user_ratings_movie_id_idx" ON "user_ratings"("movie_id");

-- CreateIndex
CREATE INDEX "watched_movies_movie_id_idx" ON "watched_movies"("movie_id");
