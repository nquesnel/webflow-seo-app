// SEO Analysis Types

export interface SEOAnalysisRequest {
  pageId: string;
  siteId: string;
  html?: string; // Optional HTML content if provided
}

export interface MetaTagAnalysis {
  title: {
    content: string;
    length: number;
    score: number;
    issues: string[];
  };
  description: {
    content: string;
    length: number;
    score: number;
    issues: string[];
  };
}

export interface KeywordAnalysis {
  totalWords: number;
  keywordOccurrences: Map<string, number>;
  density: number;
  score: number;
  issues: string[];
  topKeywords: Array<{
    keyword: string;
    count: number;
    density: number;
  }>;
}

export interface HeadingStructure {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  hierarchy: HeadingHierarchy[];
  score: number;
  issues: string[];
}

export interface HeadingHierarchy {
  level: number;
  text: string;
  order: number;
}

export interface ImageAnalysis {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  score: number;
  issues: string[];
  missingAltImages: string[]; // URLs or src of images missing alt text
}

export interface SEOScore {
  overall: number;
  breakdown: {
    metaTags: number;
    keywords: number;
    headings: number;
    images: number;
  };
}

export interface SEOAnalysisResult {
  pageId: string;
  siteId: string;
  timestamp: Date;
  score: SEOScore;
  metaTags: MetaTagAnalysis;
  keywords: KeywordAnalysis;
  headings: HeadingStructure;
  images: ImageAnalysis;
  recommendations: string[];
  executionTime: number; // in milliseconds
}

export interface SEOConfig {
  title: {
    minLength: number;
    maxLength: number;
    weight: number; // Weight in overall score calculation
  };
  description: {
    minLength: number;
    maxLength: number;
    weight: number;
  };
  keywords: {
    minDensity: number;
    maxDensity: number;
    weight: number;
  };
  headings: {
    weight: number;
  };
  images: {
    weight: number;
  };
}