import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MoviesService } from './movies.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  getMovie(@Param('id', ParseIntPipe) movieId: number) {
    return this.moviesService.getMovie(movieId);
  }
}
