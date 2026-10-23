export type SupportedLanguage = 'javascript' | 'typescript' | 'html' | 'json' | 'python';

export interface CodeBlockData {
  language: SupportedLanguage;
  code: string;
  output?: string;
  hasExecuted?: boolean;
}
