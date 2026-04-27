import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService }    from './content.service';
import { ContentBlock }      from './content-block.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([ContentBlock])],
  controllers: [ContentController],
  providers:   [ContentService],
  exports:     [ContentService],
})
export class ContentModule {}
