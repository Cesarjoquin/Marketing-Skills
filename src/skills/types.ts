export interface SkillMetadata {
  dir: string;
  path: string;
  name: string;
  description: string;
}

export interface SkillValidationIssue {
  skill: string;
  errors: string[];
  warnings: string[];
}

export interface SkillValidationReport {
  passed: number;
  warnings: number;
  issues: number;
  results: SkillValidationIssue[];
}
