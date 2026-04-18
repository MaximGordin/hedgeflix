import { Controller, Get, Headers, Param, ParseIntPipe } from '@nestjs/common';
import { MoviesService } from './movies.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  // @TODO Parse Accept-Language header — browsers send "en-US,en;q=0.9,ru;q=0.8",
  // but DB expects "en". Works now because frontend sends clean locale, but breaks for
  // direct API calls (Swagger, curl, mobile apps). Add ParseLocalePipe or parse manually.
  getMovie(@Param('id', ParseIntPipe) movieId: number, @Headers('accept-language') locale: string) {
    return this.moviesService.getMovie(movieId, locale);
  }
}
