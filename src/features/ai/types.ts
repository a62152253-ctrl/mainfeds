import { DocBlock, Priority } from '../../types/workspace';

export type AiActionType =
  | 'summarize'
  | 'continue'
  | 'rewrite'
  | 'translate'
  | 'tasks'
  | 'fix'
  | 'generate'
  | 'chat';

export type AiToneType =
  | 'professional'
  | 'concise'
  | 'creative'
  | 'academic'
  | 'casual';

export interface GeneratedTaskProposal {
  title: string;
  priority: Priority;
  tag: string;
  dueDate?: string;
}

export interface AiExecutionResult {
  ok: boolean;
  content: string;
  tasks?: GeneratedTaskProposal[];
  blocks?: Partial<DocBlock>[];
  error?: string;
}

export interface AiPromptPreset {
  id: string;
  title: string;
  prompt: string;
  icon: string;
  action: AiActionType;
}
