/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "movies" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "imdb_id" TEXT,
    "original_title" TEXT NOT NULL,
    "original_language" TEXT NOT NULL,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "release_date" DATE,
    "runtime" INTEGER,
    "budget" BIGINT DEFAULT 0,
    "revenue" BIGINT DEFAULT 0,
    "popularity" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT,
    "homepage" TEXT,
    "awards_text" TEXT,
    "oscars_won" INTEGER DEFAULT 0,
    "total_wins" INTEGER DEFAULT 0,
    "total_nominations" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_translations" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "tagline" TEXT,

    CONSTRAINT "movie_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_ratings" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "movie_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_videos" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "site" TEXT NOT NULL DEFAULT 'YouTube',
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "official" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "movie_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_certifications" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "certification" TEXT NOT NULL,

    CONSTRAINT "movie_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre_translations" (
    "id" SERIAL NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genre_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_genres" (
    "movie_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "movie_genres_pkey" PRIMARY KEY ("movie_id","genre_id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "imdb_id" TEXT,
    "name" TEXT NOT NULL,
    "profile_path" TEXT,
    "birthday" DATE,
    "deathday" DATE,
    "place_of_birth" TEXT,
    "gender" INTEGER NOT NULL DEFAULT 0,
    "popularity" DOUBLE PRECISION DEFAULT 0,
    "known_for" TEXT,
    "homepage" TEXT,
    "awards_text" TEXT,
    "oscars_won" INTEGER DEFAULT 0,
    "total_wins" INTEGER DEFAULT 0,
    "total_nominations" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_translations" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT,
    "biography" TEXT,

    CONSTRAINT "person_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_images" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "person_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_cast" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "character" TEXT,
    "cast_order" INTEGER,

    CONSTRAINT "movie_cast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_crew" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "job" TEXT NOT NULL,

    CONSTRAINT "movie_crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_similar" (
    "source_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,

    CONSTRAINT "movie_similar_pkey" PRIMARY KEY ("source_id","target_id")
);

-- CreateTable
CREATE TABLE "movie_recommendations" (
    "source_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,

    CONSTRAINT "movie_recommendations_pkey" PRIMARY KEY ("source_id","target_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "user_id" INTEGER NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("user_id","movie_id")
);

-- CreateTable
CREATE TABLE "user_ratings" (
    "user_id" INTEGER NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ratings_pkey" PRIMARY KEY ("user_id","movie_id")
);

-- CreateTable
CREATE TABLE "watched_movies" (
    "user_id" INTEGER NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watched_movies_pkey" PRIMARY KEY ("user_id","movie_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "movies_imdb_id_key" ON "movies"("imdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "movie_translations_movie_id_language_key" ON "movie_translations"("movie_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "movie_ratings_movie_id_source_key" ON "movie_ratings"("movie_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "movie_videos_movie_id_key_key" ON "movie_videos"("movie_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "movie_certifications_movie_id_country_key" ON "movie_certifications"("movie_id", "country");

-- CreateIndex
CREATE UNIQUE INDEX "genres_tmdb_id_key" ON "genres"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "genre_translations_genre_id_language_key" ON "genre_translations"("genre_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "persons_tmdb_id_key" ON "persons"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "persons_imdb_id_key" ON "persons"("imdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_translations_person_id_language_key" ON "person_translations"("person_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "movie_cast_movie_id_person_id_character_key" ON "movie_cast"("movie_id", "person_id", "character");

-- CreateIndex
CREATE UNIQUE INDEX "movie_crew_movie_id_person_id_job_key" ON "movie_crew"("movie_id", "person_id", "job");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "movie_translations" ADD CONSTRAINT "movie_translations_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_ratings" ADD CONSTRAINT "movie_ratings_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_videos" ADD CONSTRAINT "movie_videos_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_certifications" ADD CONSTRAINT "movie_certifications_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_translations" ADD CONSTRAINT "genre_translations_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_translations" ADD CONSTRAINT "person_translations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_images" ADD CONSTRAINT "person_images_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_cast" ADD CONSTRAINT "movie_cast_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_cast" ADD CONSTRAINT "movie_cast_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_crew" ADD CONSTRAINT "movie_crew_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_crew" ADD CONSTRAINT "movie_crew_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_similar" ADD CONSTRAINT "movie_similar_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_similar" ADD CONSTRAINT "movie_similar_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_recommendations" ADD CONSTRAINT "movie_recommendations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_recommendations" ADD CONSTRAINT "movie_recommendations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watched_movies" ADD CONSTRAINT "watched_movies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watched_movies" ADD CONSTRAINT "watched_movies_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
