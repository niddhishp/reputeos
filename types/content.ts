/**
 * Content Types for ReputeOS
 */

export type ContentPlatform = 'linkedin' | 'twitter' | 'medium' | 'op_ed' | 'keynote';

export interface ContentGenerationRequest {
  clientId: string;
  topic: string;
  platform: ContentPlatform;
  templateId?: string;
  keyPoints?: string[];
  callToAction?: string;
}

export interface ContentGenerationResponse {
  success: boolean;
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
    platform: ContentPlatform;
    topic: string;
  };
}
