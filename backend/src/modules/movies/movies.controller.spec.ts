import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';

// --- Mock setup ---
// We mock the entire MoviesService since the controller's job is just to delegate.
// Alternative: you could use jest.spyOn() on a real MoviesService instance,
// but that would require providing all of MoviesService's own dependencies (PrismaService, etc.).
// For a controller unit test, a plain mock object is simpler.
const mockMoviesService = {
  getMovie: jest.fn<(id: number) => Promise<typeof mockMovie>>(),
};

const mockMovie = {
  posterPath: '/inception.jpg',
  originalTitle: 'Inception',
  originalLanguage: 'en',
  runtime: 148,
  tmdbId: 27205,
};

describe('MoviesController', () => {
  let controller: MoviesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        // Replace the real service with our mock.
        // The controller receives this mock via DI, just like it would a real service.
        { provide: MoviesService, useValue: mockMoviesService },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    jest.clearAllMocks();
  });

  describe('getMovie', () => {
    it('should return a movie from the service', async () => {
      mockMoviesService.getMovie.mockResolvedValue(mockMovie);

      // The controller receives `movieId` already parsed as a number by ParseIntPipe.
      // In unit tests we call the method directly, so ParseIntPipe is not involved.
      // ParseIntPipe validation is tested in e2e tests where the full HTTP pipeline runs.
      const result = await controller.getMovie(1);

      expect(result).toEqual(mockMovie);
    });

    it('should pass the movieId to the service', async () => {
      mockMoviesService.getMovie.mockResolvedValue(mockMovie);

      await controller.getMovie(42);

      // Verify the controller forwards the correct id to the service.
      // This is the main thing a controller unit test checks — correct delegation.
      // Alternative: some teams skip controller unit tests entirely since they're thin wrappers,
      // and rely on e2e tests instead. Both approaches are valid.
      expect(mockMoviesService.getMovie).toHaveBeenCalledWith(42);
    });

    it('should propagate NotFoundException from the service', async () => {
      // When the service throws, the controller should let the exception bubble up.
      // NestJS exception filters will convert it to a proper HTTP 404 response.
      // Alternative: you could test this via e2e test with supertest to verify
      // the actual HTTP status code (404) — but that's a different test layer.
      mockMoviesService.getMovie.mockRejectedValue(new NotFoundException('Movie #999 not found'));

      await expect(controller.getMovie(999)).rejects.toThrow(NotFoundException);
    });
  });
});
