/**
 * Archetype Types for ReputeOS
 */

export type PersonalArchetype = 
  | 'Thought Leader'
  | 'Visionary'
  | 'Mentor'
  | 'Disruptor'
  | 'Storyteller'
  | 'Analyst'
  | 'Builder'
  | 'Advocate'
  | 'Innovator'
  | 'Strategist';

export interface ArchetypeDefinition {
  id: string;
  name: PersonalArchetype;
  description: string;
  characteristics: string[];
  contentStyle: string;
  bestPlatforms: string[];
  followabilityScore: number;
}
