import * as cheerio from 'cheerio';
import {
  SEOAnalysisRequest,
  SEOAnalysisResult,
  MetaTagAnalysis,
  KeywordAnalysis,
  HeadingStructure,
  ImageAnalysis,
  SEOScore,
  SEOConfig,
  HeadingHierarchy
} from '../types/seo.types';

export class SEOAnalyzer {
  private config: SEOConfig = {
    title: {
      minLength: 30,
      maxLength: 60,
      weight: 0.20 // 20% of total score
    },
    description: {
      minLength: 120,
      maxLength: 160,
      weight: 0.20 // 20% of total score
    },
    keywords: {
      minDensity: 1,
      maxDensity: 3,
      weight: 0.20 // 20% of total score
    },
    headings: {
      weight: 0.20 // 20% of total score
    },
    images: {
      weight: 0.20 // 20% of total score
    }
  };

  async analyze(request: SEOAnalysisRequest, html: string): Promise<SEOAnalysisResult> {
    const startTime = Date.now();

    // Parse HTML content with cheerio
    const $ = cheerio.load(html);

    // Perform analyses
    const metaTags = this.analyzeMetaTags($);
    const keywords = this.analyzeKeywords($);
    const headings = this.analyzeHeadings($);
    const images = this.analyzeImages($);

    // Calculate overall score
    const score = this.calculateOverallScore(metaTags, keywords, headings, images);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metaTags, keywords, headings, images);

    const executionTime = Date.now() - startTime;

    return {
      pageId: request.pageId,
      siteId: request.siteId,
      timestamp: new Date(),
      score,
      metaTags,
      keywords,
      headings,
      images,
      recommendations,
      executionTime
    };
  }

  private analyzeMetaTags($: cheerio.Root): MetaTagAnalysis {
    // Get title
    const title = $('title').text().trim();
    const titleLength = title.length;
    const titleIssues: string[] = [];
    let titleScore = 100;

    if (titleLength === 0) {
      titleScore = 0;
      titleIssues.push('Missing title tag');
    } else if (titleLength < this.config.title.minLength) {
      titleScore = Math.max(0, titleScore - 30);
      titleIssues.push(`Title too short (${titleLength} chars, recommended: ${this.config.title.minLength}-${this.config.title.maxLength})`);
    } else if (titleLength > this.config.title.maxLength) {
      titleScore = Math.max(0, titleScore - 20);
      titleIssues.push(`Title too long (${titleLength} chars, recommended: ${this.config.title.minLength}-${this.config.title.maxLength})`);
    }

    // Get description
    const description = $('meta[name="description"]').attr('content') || '';
    const descriptionLength = description.length;
    const descriptionIssues: string[] = [];
    let descriptionScore = 100;

    if (descriptionLength === 0) {
      descriptionScore = 0;
      descriptionIssues.push('Missing meta description');
    } else if (descriptionLength < this.config.description.minLength) {
      descriptionScore = Math.max(0, descriptionScore - 30);
      descriptionIssues.push(`Description too short (${descriptionLength} chars, recommended: ${this.config.description.minLength}-${this.config.description.maxLength})`);
    } else if (descriptionLength > this.config.description.maxLength) {
      descriptionScore = Math.max(0, descriptionScore - 20);
      descriptionIssues.push(`Description too long (${descriptionLength} chars, recommended: ${this.config.description.minLength}-${this.config.description.maxLength})`);
    }

    return {
      title: {
        content: title,
        length: titleLength,
        score: titleScore,
        issues: titleIssues
      },
      description: {
        content: description,
        length: descriptionLength,
        score: descriptionScore,
        issues: descriptionIssues
      }
    };
  }

  private analyzeKeywords($: cheerio.Root): KeywordAnalysis {
    // Get all text content
    const bodyText = $('body').text();
    const words = bodyText.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Filter out short words

    const totalWords = words.length;
    const keywordMap = new Map<string, number>();

    // Count word occurrences
    words.forEach(word => {
      keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
    });

    // Get top keywords (excluding common stop words)
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'will', 'your', 'their', 'they', 'which', 'would']);
    const topKeywords = Array.from(keywordMap.entries())
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({
        keyword,
        count,
        density: (count / totalWords) * 100
      }));

    // Calculate average density of top keywords
    const avgDensity = topKeywords.length > 0
      ? topKeywords.reduce((sum, kw) => sum + kw.density, 0) / topKeywords.length
      : 0;

    const issues: string[] = [];
    let score = 100;

    if (totalWords < 300) {
      score = Math.max(0, score - 30);
      issues.push('Content too short (less than 300 words)');
    }

    if (avgDensity < this.config.keywords.minDensity) {
      score = Math.max(0, score - 20);
      issues.push(`Keyword density too low (${avgDensity.toFixed(2)}%, recommended: ${this.config.keywords.minDensity}-${this.config.keywords.maxDensity}%)`);
    } else if (avgDensity > this.config.keywords.maxDensity) {
      score = Math.max(0, score - 25);
      issues.push(`Keyword density too high (${avgDensity.toFixed(2)}%, recommended: ${this.config.keywords.minDensity}-${this.config.keywords.maxDensity}%)`);
    }

    return {
      totalWords,
      keywordOccurrences: keywordMap,
      density: avgDensity,
      score,
      issues,
      topKeywords
    };
  }

  private analyzeHeadings($: cheerio.Root): HeadingStructure {
    const headings: HeadingHierarchy[] = [];
    const headingCounts = {
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      h4Count: 0,
      h5Count: 0,
      h6Count: 0
    };

    // Find all headings
    let order = 0;
    $('h1, h2, h3, h4, h5, h6').each((index, element) => {
      const $heading = $(element);
      const tagName = (element as any).name.toUpperCase();
      const level = parseInt(tagName.substring(1));
      const text = $heading.text().trim();
      
      headings.push({ level, text, order: order++ });
      
      switch (level) {
        case 1: headingCounts.h1Count++; break;
        case 2: headingCounts.h2Count++; break;
        case 3: headingCounts.h3Count++; break;
        case 4: headingCounts.h4Count++; break;
        case 5: headingCounts.h5Count++; break;
        case 6: headingCounts.h6Count++; break;
      }
    });

    const issues: string[] = [];
    let score = 100;

    // Check H1 count
    if (headingCounts.h1Count === 0) {
      score = Math.max(0, score - 40);
      issues.push('Missing H1 tag');
    } else if (headingCounts.h1Count > 1) {
      score = Math.max(0, score - 30);
      issues.push(`Multiple H1 tags found (${headingCounts.h1Count}), should have only 1`);
    }

    // Check hierarchy
    let previousLevel = 0;
    let hierarchyBroken = false;
    headings.forEach(heading => {
      if (previousLevel > 0 && heading.level > previousLevel + 1) {
        hierarchyBroken = true;
      }
      previousLevel = heading.level;
    });

    if (hierarchyBroken) {
      score = Math.max(0, score - 20);
      issues.push('Heading hierarchy is broken (skipping levels)');
    }

    // Check if there are enough headings for content structure
    if (headings.length === 0) {
      score = 0;
      issues.push('No heading structure found');
    } else if (headings.length < 3) {
      score = Math.max(0, score - 20);
      issues.push('Limited heading structure (consider adding more headings for better content organization)');
    }

    return {
      ...headingCounts,
      hierarchy: headings,
      score,
      issues
    };
  }

  private analyzeImages($: cheerio.Root): ImageAnalysis {
    const images = $('img');
    const totalImages = images.length;
    let imagesWithAlt = 0;
    const missingAltImages: string[] = [];

    images.each((index, element) => {
      const $img = $(element);
      const alt = $img.attr('alt');
      const src = $img.attr('src') || 'unknown';
      
      if (alt && alt.trim().length > 0) {
        imagesWithAlt++;
      } else {
        missingAltImages.push(src);
      }
    });

    const imagesWithoutAlt = totalImages - imagesWithAlt;
    const issues: string[] = [];
    let score = 100;

    if (totalImages === 0) {
      // No penalty for no images, but note it
      issues.push('No images found on page');
    } else if (imagesWithoutAlt > 0) {
      const percentageMissing = (imagesWithoutAlt / totalImages) * 100;
      score = Math.max(0, 100 - percentageMissing);
      issues.push(`${imagesWithoutAlt} image(s) missing alt text (${percentageMissing.toFixed(0)}% of images)`);
    }

    return {
      totalImages,
      imagesWithAlt,
      imagesWithoutAlt,
      score,
      issues,
      missingAltImages: missingAltImages.slice(0, 10) // Limit to first 10
    };
  }

  private calculateOverallScore(
    metaTags: MetaTagAnalysis,
    keywords: KeywordAnalysis,
    headings: HeadingStructure,
    images: ImageAnalysis
  ): SEOScore {
    const metaScore = (metaTags.title.score + metaTags.description.score) / 2;
    
    const overall = Math.round(
      (metaScore * this.config.title.weight) +
      (metaScore * this.config.description.weight) +
      (keywords.score * this.config.keywords.weight) +
      (headings.score * this.config.headings.weight) +
      (images.score * this.config.images.weight)
    );

    return {
      overall: Math.min(100, Math.max(0, overall)),
      breakdown: {
        metaTags: Math.round(metaScore),
        keywords: keywords.score,
        headings: headings.score,
        images: images.score
      }
    };
  }

  private generateRecommendations(
    metaTags: MetaTagAnalysis,
    keywords: KeywordAnalysis,
    headings: HeadingStructure,
    images: ImageAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Meta tag recommendations
    if (metaTags.title.issues.length > 0) {
      recommendations.push(...metaTags.title.issues.map(issue => `Title: ${issue}`));
    }
    if (metaTags.description.issues.length > 0) {
      recommendations.push(...metaTags.description.issues.map(issue => `Description: ${issue}`));
    }

    // Keyword recommendations
    if (keywords.issues.length > 0) {
      recommendations.push(...keywords.issues.map(issue => `Keywords: ${issue}`));
    }

    // Heading recommendations
    if (headings.issues.length > 0) {
      recommendations.push(...headings.issues.map(issue => `Headings: ${issue}`));
    }

    // Image recommendations
    if (images.issues.length > 0) {
      recommendations.push(...images.issues.map(issue => `Images: ${issue}`));
    }

    // General recommendations based on score
    if (recommendations.length === 0) {
      recommendations.push('Great job! Your page SEO is well optimized.');
    }

    return recommendations;
  }
}