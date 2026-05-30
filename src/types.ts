export interface InternalLinkPair {
  url: string;
  anchorText: string;
}

export interface ExternalSource {
  url: string;
  description: string;
}

export interface BlogInputs {
  focusKeyword: string;
  blogTopic: string;
  targetAudience: string;
  referenceDocument?: string;
  internalLinksText: string;
  toneSelection: string;
  customDirectives?: string;
  smartExternalLinks: boolean;
  provider?: "gemini" | "openrouter";
}

export interface ScoreItem {
  check: string;
  pass: boolean;
}

export interface ScoreSummary {
  basic_seo: ScoreItem[];
  additional_seo: ScoreItem[];
  title_readability: ScoreItem[];
  content_readability: ScoreItem[];
}

export interface BlogOutput {
  seo_title: string;
  slug: string;
  meta_description: string;
  table_of_contents: string[];
  blog_post: string;
  score_summary: ScoreSummary;
}

export interface IndexingCheckResult {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  detail: string;
}

export interface IndexingResults {
  url: string;
  title: string;
  canonical: string | null;
  noindex: boolean;
  wordCount: number;
  htmlSizeBytes: number;
  checks: IndexingCheckResult[];
  summaryStatus: 'critical' | 'weak' | 'good';
}

export interface IndexingDiagnosis {
  rootCause: string;
  fixSteps: string[];
  timeline: string;
}
