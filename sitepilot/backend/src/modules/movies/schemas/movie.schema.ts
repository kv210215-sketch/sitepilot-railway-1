import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovieDocument = HydratedDocument<Movie>;

@Schema({ timestamps: true })
export class Movie {
    @Prop({ required: true })
    title: string;

    @Prop()
    year?: number;

    @Prop([String])
    genres?: string[];
}

export const MovieSchema = SchemaFactory.createForClass(Movie);