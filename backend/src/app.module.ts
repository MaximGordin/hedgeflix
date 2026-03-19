import { Module } from '@nestjs/common';
import { MoviesModule } from './modules/movies/movies.module.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MoviesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
