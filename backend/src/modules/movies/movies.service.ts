import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';

@Injectable()
export class MoviesService {
    constructor(
        @InjectModel(Movie.name)
        private readonly movieModel: Model<MovieDocument>,
    ) { }

    async findAll(): Promise<Movie[]> {
        return this.movieModel.find().lean();
    }

    async create(data: Partial<Movie>): Promise<Movie> {
        const created = new this.movieModel(data);
        return created.save();
    }
}
