import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum OnboardingStep {
  START    = 'start',
  TYPE     = 'type',
  GOAL     = 'goal',
  DATA     = 'data',
  GENERATE = 'generate',
  PUBLISH  = 'publish',
  DONE     = 'done',
}

export enum BusinessType {
  SOLAR    = 'solar',
  SERVICES = 'services',
  OTHER    = 'other',
}

export enum BusinessGoal {
  LEADS   = 'leads',
  SALES   = 'sales',
  RESERVE = 'reserve',
}

@Entity('onboarding_sessions')
export class OnboardingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: OnboardingStep, default: OnboardingStep.START })
  step: OnboardingStep;

  @Column({ type: 'enum', enum: BusinessType, nullable: true })
  businessType: BusinessType | null;

  @Column({ type: 'enum', enum: BusinessGoal, nullable: true })
  businessGoal: BusinessGoal | null;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  generatedSite: Record<string, unknown> | null;

  @Column({ default: false })
  published: boolean;

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
