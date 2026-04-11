import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OnboardingController } from './onboarding.controller';
import { OnboardingService }    from './onboarding.service';
import { OnboardingSession }    from './onboarding.entity';
import { AiModule }             from '../ai/ai.module';

@Module({
  imports:     [TypeOrmModule.forFeature([OnboardingSession]), AiModule],
  controllers: [OnboardingController],
  providers:   [OnboardingService],
  exports:     [OnboardingService],
})
export class OnboardingModule {}
