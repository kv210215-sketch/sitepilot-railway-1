import { Body, Controller, Get, Post } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie } from './schemas/movie.schema';

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) { }

    @Get()
    findAll(): Promise<Movie[]> {
        return this.moviesService.findAll();
    }

    @Post()
    create(@Body() body: Partial<Movie>): Promise<Movie> {
        return this.moviesService.create(body);
    }
}
