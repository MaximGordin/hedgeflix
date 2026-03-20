import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// --- Mock setup ---
// We create a partial mock of PrismaService — only the parts MoviesService actually uses.
// Alternative: you could use jest.mocked() with a full auto-mock of PrismaService,
// but explicit partial mocks are easier to read and maintain.
const mockPrismaService = {
  movie: {
    findUnique: jest.fn<(args: unknown) => Promise<typeof mockMovie | null>>(),
  },
};

// Sample movie data returned by the mock.
// Matches the `select` fields in MoviesService.getMovie().
const mockMovie = {
  posterPath: '/inception.jpg',
  originalTitle: 'Inception',
  originalLanguage: 'en',
  runtime: 148,
  tmdbId: 27205,
};

describe('MoviesService', () => {
  let service: MoviesService;

  beforeEach(async () => {
    // Create an isolated NestJS DI container for each test.
    // Alternative: you could instantiate MoviesService directly with `new MoviesService(mockPrisma)`,
    // but using Test.createTestingModule mirrors real NestJS DI behavior
    // and scales better when services have multiple dependencies.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        // Replace PrismaService with our mock.
        // This means MoviesService will receive mockPrismaService instead of a real DB connection.
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  // Reset mock state between tests so they don't affect each other.
  // Alternative: you could use jest.clearAllMocks() in afterEach(),
  // but doing it in beforeEach keeps setup and cleanup together.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovie', () => {
    it('should return a movie when it exists', async () => {
      // Arrange: tell the mock what to return
      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);

      // Act: call the real service method (with mocked Prisma underneath)
      const result = await service.getMovie(1);

      // Assert: check the returned data
      expect(result).toEqual(mockMovie);

      // Verify Prisma was called with the correct arguments.
      // This ensures the service passes the right query to the ORM.
      // Alternative: if you only care about the return value and not _how_ it was fetched,
      // you can skip this assertion. It couples the test to implementation details,
      // but for ORM calls it's useful to catch accidental query changes.
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          posterPath: true,
          originalTitle: true,
          originalLanguage: true,
          runtime: true,
          tmdbId: true,
        },
      });
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      // Arrange: Prisma returns null when no record is found
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      // Act & Assert: verify the service throws NotFoundException.
      // Alternative: you could use try/catch instead of rejects.toThrow(),
      // but the matcher syntax is more concise and idiomatic in Jest.
      await expect(service.getMovie(999)).rejects.toThrow(NotFoundException);
    });

    it('should include movieId in the error message', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      // Check the exact error message — useful to ensure helpful error messages for API consumers.
      // Alternative: you could just check the exception type (as above) if the message isn't important.
      await expect(service.getMovie(42)).rejects.toThrow('Movie #42 not found');
    });

    it('should call findUnique exactly once', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);

      await service.getMovie(1);

      // Ensure no duplicate DB queries — catches accidental double-fetching.
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
