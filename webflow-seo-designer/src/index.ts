// SEO Analyzer for Webflow Designer Extension

interface SEOIssue {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  field?: string;
}

interface SEOScore {
  total: number;
  breakdown: {
    meta: number;
    headings: number;
    images: number;
    content: number;
  };
}

interface QuickFix {
  title: string;
  description: string;
  action: () => void;
}

// SEO Analysis Configuration
const SEO_CONFIG = {
  title: {
    min: 30,
    max: 60,
    optimal: 55
  },
  description: {
    min: 120,
    max: 160,
    optimal: 155
  },
  content: {
    minWords: 300,        // Minimum for any content
    targetWords: 600,     // Good target for most pages
    optimalWords: 1500    // Ideal for comprehensive content
  },
  readability: {
    targetScore: 60, // Flesch Reading Ease
    minScore: 30,
    maxScore: 70
  }
};

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  analyzePage();
});

// Real-time analysis function (only analyzes based on current input values)
async function analyzePageRealTime() {
  const titleInput = document.getElementById('page-title') as HTMLInputElement;
  const descInput = document.getElementById('page-description') as HTMLTextAreaElement;
  const keywordInput = document.getElementById('focus-keyword') as HTMLInputElement;
  
  if (!titleInput || !descInput) return;
  
  const issues: SEOIssue[] = [];
  const keyword = keywordInput?.value.toLowerCase().trim() || '';
  const title = titleInput.value;
  const description = descInput.value;
  
  // Check title
  if (!title) {
    issues.push({ type: 'error', message: 'Missing page title', field: 'title' });
  } else if (title.length < SEO_CONFIG.title.min) {
    issues.push({ type: 'warning', message: `Title too short (${title.length} chars, min ${SEO_CONFIG.title.min})`, field: 'title' });
  } else if (title.length > SEO_CONFIG.title.max) {
    issues.push({ type: 'warning', message: `Title too long (${title.length} chars, max ${SEO_CONFIG.title.max})`, field: 'title' });
  } else {
    issues.push({ type: 'success', message: 'Title length is optimal', field: 'title' });
  }
  
  // Check keyword in title
  if (keyword && title) {
    if (title.toLowerCase().includes(keyword)) {
      issues.push({ type: 'success', message: 'Focus keyword found in title' });
    } else {
      issues.push({ type: 'warning', message: 'Focus keyword not found in title' });
    }
  }
  
  // Check description
  if (!description) {
    issues.push({ type: 'error', message: 'Missing meta description', field: 'description' });
  } else if (description.length < SEO_CONFIG.description.min) {
    issues.push({ type: 'warning', message: `Description too short (${description.length} chars, min ${SEO_CONFIG.description.min})`, field: 'description' });
  } else if (description.length > SEO_CONFIG.description.max) {
    issues.push({ type: 'warning', message: `Description too long (${description.length} chars, max ${SEO_CONFIG.description.max})`, field: 'description' });
  } else {
    issues.push({ type: 'success', message: 'Description length is optimal', field: 'description' });
  }
  
  // Check keyword in description
  if (keyword && description) {
    if (description.toLowerCase().includes(keyword)) {
      issues.push({ type: 'success', message: 'Focus keyword found in description' });
    } else {
      issues.push({ type: 'warning', message: 'Focus keyword not found in description' });
    }
  }
  
  // Add placeholder for other checks that we got from initial page load
  const page = await webflow.getCurrentPage();
  if (page) {
    try {
      const rootElement = await webflow.getRootElement();
      if (rootElement) {
        const h1Count = await countHeadingsByLevel(rootElement, 1);
        if (h1Count === 0) {
          issues.push({ type: 'error', message: 'No H1 tag found on page' });
        } else if (h1Count > 1) {
          issues.push({ type: 'warning', message: `Multiple H1 tags found (${h1Count})` });
        } else {
          issues.push({ type: 'success', message: 'Single H1 tag found' });
        }
        
        const imageIssues = await checkImagesForAltText(rootElement);
        issues.push(...imageIssues);
      }
    } catch (error) {
      // Silently fail for real-time updates
    }
  }
  
  // Also update content quality in real-time
  await analyzeContentQuality();
  
  // Get content metrics for score calculation
  let contentAnalysis = undefined;
  if (contentCache) {
    contentAnalysis = {
      wordCount: contentCache.wordCount,
      readabilityScore: contentCache.readabilityScore
    };
  }
  
  // Calculate and display score with content analysis
  const score = calculateSEOScore(issues, contentAnalysis);
  displaySEOScore(score);
  displayRecommendations(issues, contentCache?.headings || []);
}

function setupEventListeners() {
  // Refresh button
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    // Clear cache on refresh
    contentCache = null;
    analyzePage();
  });

  // Meta field inputs
  const titleInput = document.getElementById('page-title') as HTMLInputElement;
  const descInput = document.getElementById('page-description') as HTMLTextAreaElement;
  const keywordInput = document.getElementById('focus-keyword') as HTMLInputElement;

  titleInput?.addEventListener('input', () => {
    updateCharCount('title', titleInput.value);
    enableUpdateButton();
    // Re-analyze in real-time
    analyzePageRealTime();
  });

  descInput?.addEventListener('input', () => {
    updateCharCount('desc', descInput.value);
    enableUpdateButton();
    // Re-analyze in real-time
    analyzePageRealTime();
  });

  keywordInput?.addEventListener('input', () => {
    // Clear cache when keyword changes
    contentCache = null;
    // Re-analyze when keyword changes
    analyzePageRealTime();
  });

  // Update meta button
  document.getElementById('update-meta')?.addEventListener('click', updateMetaTags);
}

async function analyzePage() {
  showLoading();
  
  try {
    // Get current page data
    const page = await webflow.getCurrentPage();
    if (!page) {
      showError('No page selected');
      return;
    }

    // Display page info
    displayPageInfo(page);

    // Get page SEO data
    const title = await page.getTitle() || '';
    const description = await page.getDescription() || '';
    
    // Populate meta fields
    const titleInput = document.getElementById('page-title') as HTMLInputElement;
    const descInput = document.getElementById('page-description') as HTMLTextAreaElement;
    
    if (titleInput) {
      titleInput.value = title;
      updateCharCount('title', title);
    }
    
    if (descInput) {
      descInput.value = description;
      updateCharCount('desc', description);
    }

    // Analyze page content
    const issues = await analyzePageContent(page);
    
    // Analyze content quality first to get metrics
    await analyzeContentQuality();
    
    // Get content metrics for score calculation
    let contentAnalysis = undefined;
    if (contentCache) {
      contentAnalysis = {
        wordCount: contentCache.wordCount,
        readabilityScore: contentCache.readabilityScore
      };
    }
    
    // Calculate SEO score with content analysis
    const score = calculateSEOScore(issues, contentAnalysis);
    
    // Display results
    displaySEOScore(score);
    displayRecommendations(issues, contentCache?.headings || []);
    
  } catch (error) {
    console.error('Analysis error:', error);
    showError('Failed to analyze page');
  }
}

async function displayPageInfo(page: any) {
  const pageInfo = document.getElementById('page-info');
  if (!pageInfo) return;

  const name = await page.getName();
  const slug = await page.getSlug();
  const isDraft = await page.isDraft();
  
  pageInfo.innerHTML = `
    <div class="page-info-content">
      <div class="page-info-item">
        <span class="page-info-label">Page Name:</span>
        <span class="page-info-value">${name || 'Untitled'}</span>
      </div>
      <div class="page-info-item">
        <span class="page-info-label">Slug:</span>
        <span class="page-info-value">/${slug || ''}</span>
      </div>
      <div class="page-info-item">
        <span class="page-info-label">Status:</span>
        <span class="page-info-value">${isDraft ? 'Draft' : 'Published'}</span>
      </div>
    </div>
  `;
}

async function analyzePageContent(page: any): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];
  
  // Get focus keyword
  const keywordInput = document.getElementById('focus-keyword') as HTMLInputElement;
  const keyword = keywordInput?.value.toLowerCase().trim() || '';
  
  // Check title
  const title = await page.getTitle() || '';
  if (!title) {
    issues.push({ type: 'error', message: 'Missing page title', field: 'title' });
  } else if (title.length < SEO_CONFIG.title.min) {
    issues.push({ type: 'warning', message: `Title too short (${title.length} chars, min ${SEO_CONFIG.title.min})`, field: 'title' });
  } else if (title.length > SEO_CONFIG.title.max) {
    issues.push({ type: 'warning', message: `Title too long (${title.length} chars, max ${SEO_CONFIG.title.max})`, field: 'title' });
  } else {
    issues.push({ type: 'success', message: 'Title length is optimal', field: 'title' });
  }
  
  // Check keyword in title
  if (keyword && title) {
    if (title.toLowerCase().includes(keyword)) {
      issues.push({ type: 'success', message: 'Focus keyword found in title' });
    } else {
      issues.push({ type: 'warning', message: 'Focus keyword not found in title' });
    }
  }
  
  // Check description
  const description = await page.getDescription() || '';
  if (!description) {
    issues.push({ type: 'error', message: 'Missing meta description', field: 'description' });
  } else if (description.length < SEO_CONFIG.description.min) {
    issues.push({ type: 'warning', message: `Description too short (${description.length} chars, min ${SEO_CONFIG.description.min})`, field: 'description' });
  } else if (description.length > SEO_CONFIG.description.max) {
    issues.push({ type: 'warning', message: `Description too long (${description.length} chars, max ${SEO_CONFIG.description.max})`, field: 'description' });
  } else {
    issues.push({ type: 'success', message: 'Description length is optimal', field: 'description' });
  }
  
  // Check keyword in description
  if (keyword && description) {
    if (description.toLowerCase().includes(keyword)) {
      issues.push({ type: 'success', message: 'Focus keyword found in description' });
    } else {
      issues.push({ type: 'warning', message: 'Focus keyword not found in description' });
    }
  }

  // Check for H1 tags on the page
  try {
    const rootElement = await webflow.getRootElement();
    if (rootElement) {
      const h1Count = await countHeadingsByLevel(rootElement, 1);
      
      if (h1Count === 0) {
        issues.push({ type: 'error', message: 'No H1 tag found on page' });
      } else if (h1Count > 1) {
        issues.push({ type: 'warning', message: `Multiple H1 tags found (${h1Count})` });
      } else {
        issues.push({ type: 'success', message: 'Single H1 tag found' });
      }
    }
  } catch (error) {
    console.error('Error checking H1 tags:', error);
  }

  // Check for images without alt text
  try {
    const rootElement = await webflow.getRootElement();
    if (rootElement) {
      const imageIssues = await checkImagesForAltText(rootElement);
      issues.push(...imageIssues);
    }
  } catch (error) {
    console.error('Error checking images:', error);
  }

  // Perform comprehensive keyword placement analysis
  if (keyword) {
    const keywordPlacement = await analyzeKeywordPlacement(page, keyword);
    issues.push(...keywordPlacement);
  }
  
  // Analyze links on the page
  try {
    const rootElement = await webflow.getRootElement();
    if (rootElement) {
      const linkAnalysis = await analyzeLinkStructure(rootElement);
      issues.push(...linkAnalysis);
    }
  } catch (error) {
    console.error('Error analyzing links:', error);
  }
  
  // Analyze technical SEO elements
  try {
    const technicalSEO = await analyzeTechnicalSEO(page);
    issues.push(...technicalSEO);
  } catch (error) {
    console.error('Error analyzing technical SEO:', error);
  }
  
  // Add content quality metrics if available
  if (contentCache?.contentQuality) {
    const quality = contentCache.contentQuality;
    
    // Check sentence length
    if (quality.longSentencePercentage > 25) {
      issues.push({ 
        type: 'warning', 
        message: `${quality.longSentencePercentage.toFixed(0)}% of sentences are too long (>20 words)` 
      });
    }
    
    // Check paragraph length
    if (quality.longParagraphs > 0) {
      issues.push({ 
        type: 'warning', 
        message: `${quality.longParagraphs} paragraph${quality.longParagraphs > 1 ? 's are' : ' is'} too long (>150 words)` 
      });
    }
    
    // Check passive voice
    if (quality.totalSentences > 0) {
      const passivePercentage = (quality.passiveVoiceCount / quality.totalSentences) * 100;
      if (passivePercentage > 10) {
        issues.push({ 
          type: 'info', 
          message: `High passive voice usage (${passivePercentage.toFixed(0)}% of sentences)` 
        });
      }
    }
    
    // Check transition words
    if (quality.totalSentences > 5) {
      const transitionPercentage = (quality.transitionWordCount / quality.totalSentences) * 100;
      if (transitionPercentage < 30) {
        issues.push({ 
          type: 'info', 
          message: `Low transition word usage (${transitionPercentage.toFixed(0)}%)` 
        });
      }
    }
    
    // Check consecutive sentence starts
    if (quality.consecutiveSentenceStarts >= 3) {
      issues.push({ 
        type: 'warning', 
        message: `${quality.consecutiveSentenceStarts} consecutive sentences start with the same word` 
      });
    }
  }

  return issues;
}

// Comprehensive keyword placement analysis
async function analyzeKeywordPlacement(page: any, keyword: string): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];
  const lowerKeyword = keyword.toLowerCase();
  
  try {
    // 1. Check keyword in URL/slug
    const slug = await page.getSlug();
    if (slug) {
      const slugWords = slug.toLowerCase().split(/[-_]/);
      const keywordWords = lowerKeyword.split(/\s+/);
      const keywordInSlug = keywordWords.every(word => 
        slugWords.some(slugWord => slugWord.includes(word))
      );
      
      if (keywordInSlug) {
        issues.push({ type: 'success', message: 'Focus keyword found in URL slug' });
      } else {
        issues.push({ type: 'warning', message: 'Focus keyword not found in URL slug' });
      }
    }
    
    // 2. Check keyword in H1
    const rootElement = await webflow.getRootElement();
    if (rootElement && contentCache?.headings) {
      const h1Headings = contentCache.headings.filter(h => h.level === 1);
      const h1WithKeyword = h1Headings.some(h => 
        h.text.toLowerCase().includes(lowerKeyword)
      );
      
      if (h1Headings.length > 0) {
        if (h1WithKeyword) {
          issues.push({ type: 'success', message: 'Focus keyword found in H1' });
        } else {
          issues.push({ type: 'warning', message: 'Focus keyword not found in H1' });
        }
      }
      
      // 3. Check keyword in H2/H3 subheadings
      const subheadings = contentCache.headings.filter(h => h.level === 2 || h.level === 3);
      const subheadingWithKeyword = subheadings.some(h => 
        h.text.toLowerCase().includes(lowerKeyword)
      );
      
      if (subheadings.length > 0) {
        if (subheadingWithKeyword) {
          issues.push({ type: 'success', message: 'Focus keyword found in subheadings (H2/H3)' });
        } else {
          issues.push({ type: 'info', message: 'Focus keyword not found in any subheadings' });
        }
      }
    }
    
    // 4. Check keyword in first paragraph (first 10% of content)
    if (contentCache?.text) {
      const words = contentCache.text.split(/\s+/);
      const first10PercentWords = Math.ceil(words.length * 0.1);
      const firstPart = words.slice(0, first10PercentWords).join(' ').toLowerCase();
      
      if (firstPart.includes(lowerKeyword)) {
        issues.push({ type: 'success', message: 'Focus keyword found in opening content' });
      } else {
        issues.push({ type: 'warning', message: 'Focus keyword not found in opening content (first 10%)' });
      }
    }
    
    // Note: Keyword in image alt text is now handled by checkImagesForAltText function
    
  } catch (error) {
    console.error('Error analyzing keyword placement:', error);
  }
  
  return issues;
}

// Note: This function is now replaced by the more comprehensive analyzeAllImages function

// Analyze technical SEO elements
async function analyzeTechnicalSEO(page: any): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];
  
  try {
    // 1. URL Slug Analysis (enhanced from basic check)
    const slug = await page.getSlug();
    if (slug) {
      // Check slug length
      if (slug.length > 60) {
        issues.push({ 
          type: 'warning', 
          message: `URL slug is too long (${slug.length} chars) - keep under 60 for better user experience` 
        });
      }
      
      // Check for stop words in slug
      const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
      const slugWords = slug.toLowerCase().split(/[-_]/);
      const stopWordsInSlug = slugWords.filter(word => stopWords.indexOf(word) !== -1);
      if (stopWordsInSlug.length > 2) {
        issues.push({ 
          type: 'info', 
          message: `URL contains ${stopWordsInSlug.length} stop words - consider removing for cleaner URLs` 
        });
      }
      
      // Check for special characters
      if (!/^[a-z0-9-]+$/.test(slug)) {
        issues.push({ 
          type: 'warning', 
          message: 'URL slug contains special characters or uppercase letters' 
        });
      }
      
      // Check for duplicate hyphens
      if (slug.includes('--')) {
        issues.push({ 
          type: 'warning', 
          message: 'URL slug contains duplicate hyphens' 
        });
      }
    }
    
    // 2. Check for meta robots
    // Note: In Webflow, this would typically be set in page settings
    // We can check if the page is set to be indexed
    try {
      const isDraft = await page.isDraft();
      if (isDraft) {
        issues.push({ 
          type: 'info', 
          message: 'Page is in draft mode - won\'t be indexed by search engines' 
        });
      }
    } catch (e) {
      // Silent fail if isDraft is not available
    }
    
    // 3. Check for Open Graph tags (basic check - would need DOM access for full check)
    const title = await page.getTitle();
    const description = await page.getDescription();
    
    // Basic OG tag recommendations based on standard meta tags
    if (title && description) {
      issues.push({ 
        type: 'info', 
        message: 'Consider adding Open Graph tags for better social sharing' 
      });
    }
    
    // 4. Page structure recommendations
    const rootElement = await webflow.getRootElement();
    if (rootElement) {
      // Check for structured data opportunities
      const hasArticleContent = contentCache?.wordCount && contentCache.wordCount > 500;
      const hasFAQContent = contentCache?.text && /\?[\s\S]{1,200}(answer|response|solution)/i.test(contentCache.text);
      
      if (hasArticleContent) {
        issues.push({ 
          type: 'info', 
          message: 'Long-form content detected - consider adding Article schema markup' 
        });
      }
      
      if (hasFAQContent) {
        issues.push({ 
          type: 'info', 
          message: 'Q&A content detected - consider adding FAQ schema markup' 
        });
      }
    }
    
    // 5. Language and locale
    // Note: Webflow typically handles this at site level
    issues.push({ 
      type: 'info', 
      message: 'Ensure language attributes are set in site settings for international SEO' 
    });
    
  } catch (error) {
    console.error('Technical SEO analysis error:', error);
  }
  
  return issues;
}

// Analyze link structure (internal vs external)
async function analyzeLinkStructure(element: any): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];
  const links = await collectAllLinks(element);
  
  // Check if any links were found
  
  // If no links found at all, return early with a message
  if (links.length === 0) {
    issues.push({ 
      type: 'info', 
      message: 'No links detected on page - add internal and external links for better SEO' 
    });
    return issues;
  }
  
  // In Webflow Designer, we need to check links differently
  // Internal links typically start with / or # or are relative
  const internalLinks = links.filter(link => {
    const href = link.href.toLowerCase();
    // Check for relative URLs, hash links, or paths starting with /
    return href.startsWith('/') || 
           href.startsWith('#') || 
           href.startsWith('../') ||
           href.startsWith('./') ||
           (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//'));
  });
  
  // External links are absolute URLs with http/https
  const externalLinks = links.filter(link => {
    const href = link.href.toLowerCase();
    return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');
  });
  
  // Internal link recommendations
  if (internalLinks.length === 0) {
    issues.push({ 
      type: 'warning', 
      message: 'No internal links found - add links to related pages' 
    });
  } else if (internalLinks.length < 3) {
    issues.push({ 
      type: 'info', 
      message: `Only ${internalLinks.length} internal link${internalLinks.length === 1 ? '' : 's'} found - consider adding more for better site navigation` 
    });
  } else {
    issues.push({ 
      type: 'success', 
      message: `Good internal linking (${internalLinks.length} links)` 
    });
  }
  
  // External link recommendations
  if (externalLinks.length === 0) {
    issues.push({ 
      type: 'info', 
      message: 'No external links found - consider linking to authoritative sources' 
    });
  } else {
    issues.push({ 
      type: 'success', 
      message: `${externalLinks.length} external link${externalLinks.length === 1 ? '' : 's'} to other sites` 
    });
    
    // Check for nofollow attributes
    const nofollowCount = externalLinks.filter(link => link.nofollow).length;
    if (nofollowCount > 0) {
      issues.push({ 
        type: 'info', 
        message: `${nofollowCount} external link${nofollowCount === 1 ? ' has' : 's have'} nofollow attribute` 
      });
    }
  }
  
  // Check for generic anchor text
  const genericAnchors = links.filter(link => {
    const text = link.text.toLowerCase().trim();
    const genericTexts = ['click here', 'here', 'read more', 'learn more', 'this', 'link'];
    return genericTexts.indexOf(text) !== -1;
  });
  
  if (genericAnchors.length > 0) {
    issues.push({ 
      type: 'warning', 
      message: `${genericAnchors.length} link${genericAnchors.length === 1 ? ' uses' : 's use'} generic anchor text (avoid "click here")` 
    });
  }
  
  return issues;
}

// Collect all links from the page
async function collectAllLinks(element: any): Promise<Array<{href: string, text: string, nofollow: boolean}>> {
  const links: Array<{href: string, text: string, nofollow: boolean}> = [];
  
  async function checkElement(el: any) {
    try {
      // Check if this is a link element
      if (el.getTag && typeof el.getTag === 'function') {
        const tag = await el.getTag();
        
        if (tag === 'a') {
          const href = await el.getAttribute('href');
          const rel = await el.getAttribute('rel');
          let linkText = '';
          
          // Extract link text
          if (el.getChildren && typeof el.getChildren === 'function') {
            const children = await el.getChildren();
            for (const child of children) {
              if (child.type === 'String') {
                const text = await child.getText();
                if (text) linkText += text + ' ';
              }
            }
          }
          
          if (href) {
            links.push({
              href: href,
              text: linkText.trim(),
              nofollow: rel?.includes('nofollow') || false
            });
          }
        }
      }
      
      // Check children
      if (el.getChildren && typeof el.getChildren === 'function') {
        const children = await el.getChildren();
        if (children && Array.isArray(children)) {
          for (const child of children) {
            await checkElement(child);
          }
        }
      }
    } catch (error) {
      // Silent fail for elements that don't support these methods
    }
  }
  
  await checkElement(element);
  return links;
}

async function countHeadingsByLevel(element: any, level: number): Promise<number> {
  let count = 0;
  
  try {
    // Check if this element is a Heading type
    if (element.type === 'Heading') {
      // Get the heading level (1-6)
      const headingLevel = await element.getHeadingLevel();
      if (headingLevel === level) {
        count++;
      }
    }
    
    // Recursively check children
    if (element.getChildren && typeof element.getChildren === 'function') {
      const children = await element.getChildren();
      if (children && Array.isArray(children)) {
        for (const child of children) {
          count += await countHeadingsByLevel(child, level);
        }
      }
    }
  } catch (error) {
    console.error('Error counting headings:', error);
  }
  
  return count;
}

interface ImageAnalysis {
  src: string;
  alt: string;
  filename: string;
  hasAlt: boolean;
  altLength: number;
  isGenericAlt: boolean;
  isDescriptiveFilename: boolean;
  hasKeyword?: boolean;
}

async function checkImagesForAltText(element: any): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = [];
  const images = await analyzeAllImages(element);
  
  if (images.length === 0) {
    issues.push({ type: 'info', message: 'No images found - consider adding visuals to enhance content' });
    return issues;
  }
  
  // Get focus keyword if available
  const keywordInput = document.getElementById('focus-keyword') as HTMLInputElement;
  const keyword = keywordInput?.value.toLowerCase().trim() || '';
  
  // Analyze images
  let imagesWithoutAlt = 0;
  let genericAltTexts = 0;
  let poorFilenames = 0;
  let tooShortAlt = 0;
  let tooLongAlt = 0;
  let keywordInAltCount = 0;
  
  images.forEach(img => {
    if (!img.hasAlt) {
      imagesWithoutAlt++;
    } else {
      if (img.isGenericAlt) genericAltTexts++;
      if (img.altLength < 5) tooShortAlt++;
      if (img.altLength > 125) tooLongAlt++;
      if (keyword && img.alt.toLowerCase().includes(keyword)) keywordInAltCount++;
    }
    if (!img.isDescriptiveFilename) poorFilenames++;
  });
  
  // Report issues in order of importance
  
  // Critical: Missing alt text
  if (imagesWithoutAlt > 0) {
    issues.push({ 
      type: 'error', 
      message: `${imagesWithoutAlt} of ${images.length} images missing alt text` 
    });
  } else {
    issues.push({ type: 'success', message: `All ${images.length} images have alt text` });
  }
  
  // Alt text quality issues
  if (genericAltTexts > 0) {
    issues.push({ 
      type: 'warning', 
      message: `${genericAltTexts} image${genericAltTexts > 1 ? 's use' : ' uses'} generic alt text (avoid "image", "photo", etc.)` 
    });
  }
  
  if (tooShortAlt > 0) {
    issues.push({ 
      type: 'warning', 
      message: `${tooShortAlt} image${tooShortAlt > 1 ? 's have' : ' has'} alt text that's too short (<5 chars)` 
    });
  }
  
  if (tooLongAlt > 0) {
    issues.push({ 
      type: 'info', 
      message: `${tooLongAlt} image${tooLongAlt > 1 ? 's have' : ' has'} alt text that's too long (>125 chars)` 
    });
  }
  
  // Filename issues
  if (poorFilenames > 0) {
    issues.push({ 
      type: 'info', 
      message: `${poorFilenames} image${poorFilenames > 1 ? 's have' : ' has'} non-descriptive filenames (e.g., IMG_1234.jpg)` 
    });
  }
  
  // Keyword optimization (only if keyword is set)
  if (keyword && images.length > 0) {
    if (keywordInAltCount === 0) {
      issues.push({ 
        type: 'info', 
        message: 'Focus keyword not found in any image alt text' 
      });
    } else if (keywordInAltCount > images.length / 2) {
      issues.push({ 
        type: 'warning', 
        message: `Keyword appears in ${keywordInAltCount} of ${images.length} alt texts - avoid over-optimization` 
      });
    }
  }
  
  // Image count recommendations based on content
  if (contentCache?.wordCount) {
    const recommendedImages = Math.ceil(contentCache.wordCount / 300); // 1 image per 300 words
    if (images.length < recommendedImages && images.length < 4) {
      issues.push({ 
        type: 'info', 
        message: `Consider adding ${recommendedImages - images.length} more image${recommendedImages - images.length > 1 ? 's' : ''} for better engagement` 
      });
    }
  }
  
  return issues;
}

// Comprehensive image analysis
async function analyzeAllImages(element: any): Promise<ImageAnalysis[]> {
  const images: ImageAnalysis[] = [];
  const genericAltPatterns = [
    'image', 'photo', 'picture', 'img', 'pic', 'graphic', 
    'banner', 'icon', 'logo', 'untitled', 'default'
  ];
  
  async function checkElement(el: any) {
    try {
      if (el.getTag && typeof el.getTag === 'function') {
        const tag = await el.getTag();
        
        if (tag === 'img') {
          const src = await el.getAttribute('src') || '';
          const alt = await el.getAttribute('alt') || '';
          
          // Extract filename from src
          const filename = src.split('/').pop()?.split('?')[0] || '';
          
          // Check if filename is descriptive
          const isDescriptiveFilename = !/^(IMG|DSC|DSCN|image|photo|picture|untitled)[-_]?\d+\.(jpg|jpeg|png|gif|webp)$/i.test(filename) 
            && filename.length > 8
            && !/^\d+\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
          
          // Check if alt text is generic
          const isGenericAlt = genericAltPatterns.some(pattern => 
            alt.toLowerCase().trim() === pattern || 
            alt.toLowerCase().trim() === `${pattern}.`
          );
          
          images.push({
            src,
            alt,
            filename,
            hasAlt: alt.trim().length > 0,
            altLength: alt.trim().length,
            isGenericAlt,
            isDescriptiveFilename
          });
        }
      }
      
      // Check children
      if (el.getChildren && typeof el.getChildren === 'function') {
        const children = await el.getChildren();
        if (children && Array.isArray(children)) {
          for (const child of children) {
            await checkElement(child);
          }
        }
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  await checkElement(element);
  return images;
}

function calculateSEOScore(issues: SEOIssue[], contentAnalysis?: { wordCount: number; readabilityScore: number }): SEOScore {
  // Check if keyword is provided
  const keywordInput = document.getElementById('focus-keyword') as HTMLInputElement;
  const hasKeyword = keywordInput?.value.trim().length > 0;
  
  // If no keyword, return N/A
  if (!hasKeyword) {
    return {
      total: -1, // Special value for N/A
      breakdown: {
        meta: 0,
        headings: 0,
        images: 0,
        content: 0
      }
    };
  }
  
  // Calculate scores for different components
  let metaScore = 0;
  let headingScore = 0;
  let imageScore = 0;
  let contentScore = 0;
  let keywordScore = 0;
  
  // Meta tags score (20% weight)
  const titleIssues = issues.filter(i => i.field === 'title');
  const descIssues = issues.filter(i => i.field === 'description');
  
  if (titleIssues.some(i => i.type === 'success')) metaScore += 50;
  if (descIssues.some(i => i.type === 'success')) metaScore += 50;
  
  // Heading score (15% weight)
  const h1Issues = issues.filter(i => i.message.includes('H1'));
  if (h1Issues.some(i => i.type === 'success')) headingScore = 100;
  else if (h1Issues.some(i => i.type === 'warning')) headingScore = 50;
  
  // Image score (10% weight)
  const imageIssues = issues.filter(i => i.message.includes('image'));
  if (imageIssues.some(i => i.type === 'success')) imageScore = 100;
  else if (imageIssues.some(i => i.type === 'warning')) imageScore = 50;
  
  // Content score (35% weight) - based on word count and readability
  if (contentAnalysis) {
    const { wordCount, readabilityScore } = contentAnalysis;
    
    // Word count scoring
    let wordScore = 0;
    if (wordCount >= SEO_CONFIG.content.optimalWords) wordScore = 100;
    else if (wordCount >= SEO_CONFIG.content.targetWords) wordScore = 85;
    else if (wordCount >= SEO_CONFIG.content.minWords) wordScore = 60;
    else wordScore = (wordCount / SEO_CONFIG.content.minWords) * 60;
    
    // Readability scoring
    let readScore = 0;
    if (readabilityScore >= 60 && readabilityScore <= 70) readScore = 100;
    else if (readabilityScore >= 50 && readabilityScore < 60) readScore = 85;
    else if (readabilityScore >= 30 && readabilityScore < 50) readScore = 70;
    else if (readabilityScore >= 70 && readabilityScore <= 80) readScore = 85;
    else readScore = 50;
    
    contentScore = (wordScore + readScore) / 2;
  }
  
  // Keyword optimization score (20% weight)
  const keywordInTitle = issues.some(i => i.type === 'success' && i.message.includes('keyword found in title'));
  const keywordInDesc = issues.some(i => i.type === 'success' && i.message.includes('keyword found in description'));
  
  if (keywordInTitle) keywordScore += 60;
  if (keywordInDesc) keywordScore += 40;
  
  // Calculate final weighted score
  const finalScore = (
    (metaScore * 0.20) +
    (headingScore * 0.15) +
    (imageScore * 0.10) +
    (contentScore * 0.35) +
    (keywordScore * 0.20)
  );
  
  return {
    total: Math.round(finalScore),
    breakdown: {
      meta: metaScore,
      headings: headingScore,
      images: imageScore,
      content: Math.round(contentScore)
    }
  };
}

function displaySEOScore(score: SEOScore) {
  const scoreValue = document.getElementById('score-value');
  const scoreLabel = document.getElementById('score-label');
  const scoreCircle = document.querySelector('.score-circle');
  
  // Handle N/A score
  if (score.total === -1) {
    if (scoreValue) scoreValue.textContent = 'N/A';
    if (scoreLabel) scoreLabel.textContent = 'Add Focus Keyword';
    if (scoreCircle) {
      scoreCircle.classList.remove('good', 'warning', 'poor');
      scoreCircle.classList.add('na');
    }
    return;
  }
  
  if (scoreValue) scoreValue.textContent = score.total.toString();
  
  // Update score styling
  if (scoreCircle) {
    scoreCircle.classList.remove('good', 'warning', 'poor', 'na');
    if (score.total >= 80) {
      scoreCircle.classList.add('good');
      if (scoreLabel) scoreLabel.textContent = 'Good SEO';
    } else if (score.total >= 60) {
      scoreCircle.classList.add('warning');
      if (scoreLabel) scoreLabel.textContent = 'Needs Improvement';
    } else {
      scoreCircle.classList.add('poor');
      if (scoreLabel) scoreLabel.textContent = 'Poor SEO';
    }
  }
}

function analyzeHeadingHierarchy(headings: HeadingInfo[]): SEOIssue[] {
  const issues: SEOIssue[] = [];
  
  if (headings.length === 0) {
    return issues;
  }
  
  // Sort headings by level for analysis
  const sortedHeadings = [...headings].sort((a, b) => a.level - b.level);
  
  // Check for hierarchy issues
  let previousLevel = 0;
  const levelCounts: { [key: number]: number } = {};
  
  for (const heading of sortedHeadings) {
    levelCounts[heading.level] = (levelCounts[heading.level] || 0) + 1;
    
    // Check for skipped levels
    if (heading.level > previousLevel + 1 && previousLevel > 0) {
      issues.push({
        type: 'warning',
        message: `Heading hierarchy issue: H${heading.level} appears without H${previousLevel + 1}`
      });
    }
    
    if (heading.level < previousLevel) {
      previousLevel = heading.level;
    } else if (heading.level > previousLevel) {
      previousLevel = heading.level;
    }
  }
  
  // Check for missing H2 if we have H1 and H3+
  if (levelCounts[1] && !levelCounts[2] && (levelCounts[3] || levelCounts[4] || levelCounts[5] || levelCounts[6])) {
    issues.push({
      type: 'warning',
      message: 'Missing H2 tags - use H2 for main sections under your H1'
    });
  }
  
  // Check for too many H1s (already handled in main analysis)
  
  return issues;
}

function displayRecommendations(issues: SEOIssue[], headings: HeadingInfo[]) {
  const recommendationsList = document.getElementById('recommendations-list');
  if (!recommendationsList) return;
  
  interface Recommendation {
    priority: number;
    type: 'error' | 'warning' | 'success' | 'info';
    title: string;
    description: string;
    action?: () => void;
  }
  
  const recommendations: Recommendation[] = [];
  
  // Get current metrics
  const wordCount = parseInt(document.getElementById('word-count')?.textContent || '0');
  const keywordInput = document.getElementById('focus-keyword') as HTMLInputElement;
  const hasKeyword = keywordInput?.value.trim().length > 0;
  
  // Priority 1: Focus keyword (if missing)
  if (!hasKeyword) {
    recommendations.push({
      priority: 1,
      type: 'error',
      title: '🎯 Add Focus Keyword',
      description: 'Required for SEO scoring - tells search engines what your page is about',
      action: () => {
        keywordInput?.focus();
      }
    });
  }
  
  // Priority 2: Critical errors
  issues.filter(i => i.type === 'error').forEach(issue => {
    if (issue.message.includes('No H1')) {
      recommendations.push({
        priority: 2,
        type: 'error',
        title: '🏗️ Add H1 Heading',
        description: 'Every page must have exactly one H1 tag',
        action: () => {
          alert('Add an H1 element to your page in Webflow Designer');
        }
      });
    } else if (issue.message.includes('Missing page title')) {
      recommendations.push({
        priority: 2,
        type: 'error',
        title: '🏷️ Add Page Title',
        description: 'Critical for search results - appears as the clickable link',
        action: () => {
          const titleInput = document.getElementById('page-title') as HTMLInputElement;
          titleInput?.focus();
        }
      });
    } else if (issue.message.includes('Missing meta description')) {
      recommendations.push({
        priority: 2,
        type: 'error',
        title: '📄 Add Meta Description',
        description: 'Improves click-through rates from search results',
        action: () => {
          const descInput = document.getElementById('page-description') as HTMLTextAreaElement;
          descInput?.focus();
        }
      });
    }
  });
  
  // Check for multiple H1s in warnings too (high priority warning)
  issues.filter(i => i.type === 'warning' && i.message.includes('Multiple H1')).forEach(issue => {
    const match = issue.message.match(/\((\d+)\)/);
    const count = match ? match[1] : 'multiple';
    recommendations.push({
      priority: 2.5, // Between errors and other warnings
      type: 'error', // Treat as error for visual importance
      title: '⚠️ Fix Multiple H1 Tags',
      description: `Found ${count} H1 tags - only use ONE H1 per page for the main title`,
      action: () => {
        alert('Review your H1 tags in Webflow Designer - keep only the main page title as H1');
      }
    });
  });
  
  // Priority 3: Content improvements
  if (wordCount < SEO_CONFIG.content.minWords) {
    recommendations.push({
      priority: 3,
      type: 'warning',
      title: '📝 Expand Your Content',
      description: `Add ${SEO_CONFIG.content.minWords - wordCount} more words (minimum 300 for SEO)`,
      action: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
  } else if (wordCount < SEO_CONFIG.content.targetWords) {
    recommendations.push({
      priority: 3,
      type: 'info',
      title: '📈 Optimize Content Length',
      description: `Add ${SEO_CONFIG.content.targetWords - wordCount} words to reach optimal 600`,
      action: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
  }
  
  // Priority 4: Heading hierarchy
  const hierarchyIssues = analyzeHeadingHierarchy(headings);
  hierarchyIssues.forEach(issue => {
    if (issue.message.includes('Missing H2')) {
      recommendations.push({
        priority: 4,
        type: 'warning',
        title: '📑 Add H2 Subheadings',
        description: 'Use H2 tags for main sections to improve content structure',
        action: () => {
          alert('Add H2 elements for your main sections in Webflow Designer');
        }
      });
    } else if (issue.message.includes('hierarchy issue')) {
      recommendations.push({
        priority: 4,
        type: 'warning',
        title: '🔢 Fix Heading Order',
        description: issue.message,
        action: () => {
          alert('Review your heading structure in Webflow Designer');
        }
      });
    }
  });
  
  // Priority 5: Keyword optimization
  if (hasKeyword && contentCache?.text) {
    const keyword = keywordInput.value.toLowerCase().trim();
    const keywordCount = (contentCache.text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;
    
    if (keywordDensity < 0.5 && wordCount > 50) {
      recommendations.push({
        priority: 5,
        type: 'warning',
        title: '🔍 Increase Keyword Usage',
        description: `Use "${keyword}" more often (currently ${keywordCount} times, ${keywordDensity.toFixed(1)}% density)`,
      });
    } else if (keywordDensity > 3) {
      recommendations.push({
        priority: 5,
        type: 'warning',
        title: '⚠️ Reduce Keyword Stuffing',
        description: `"${keyword}" used too often (${keywordDensity.toFixed(1)}% density, aim for 1-3%)`,
      });
    }
    
    // Check keyword in key locations
    if (!issues.some(i => i.message.includes('keyword found in title'))) {
      recommendations.push({
        priority: 5,
        type: 'warning',
        title: '💡 Add Keyword to Title',
        description: `Include "${keyword}" in your page title for better relevance`,
        action: () => {
          const titleInput = document.getElementById('page-title') as HTMLInputElement;
          titleInput?.focus();
        }
      });
    }
    
    // Check other keyword placement issues
    if (issues.some(i => i.message.includes('keyword not found in H1'))) {
      recommendations.push({
        priority: 5,
        type: 'warning',
        title: '🎯 Add Keyword to H1',
        description: `Include "${keyword}" in your main heading (H1) for better SEO`,
        action: () => {
          alert('Add your focus keyword to the H1 heading in Webflow Designer');
        }
      });
    }
    
    if (issues.some(i => i.message.includes('keyword not found in URL slug'))) {
      recommendations.push({
        priority: 5,
        type: 'info',
        title: '🔗 Optimize URL Slug',
        description: `Consider including "${keyword}" in your page URL for better relevance`,
        action: () => {
          alert('Update your page slug in Webflow page settings to include your focus keyword');
        }
      });
    }
    
    if (issues.some(i => i.message.includes('keyword not found in opening content'))) {
      recommendations.push({
        priority: 5,
        type: 'warning',
        title: '📝 Add Keyword Early',
        description: `Include "${keyword}" in the first 10% of your content`,
        action: () => {
          alert('Add your focus keyword near the beginning of your page content');
        }
      });
    }
  }
  
  // Priority 4.5: Link optimization (moved up from 6)
  issues.forEach(issue => {
    if (issue.message.includes('No internal links')) {
      recommendations.push({
        priority: 4.5,
        type: 'warning',
        title: '🔗 Add Internal Links',
        description: 'Link to other relevant pages on your site to improve navigation and SEO',
        action: () => {
          alert('Add links to related pages in your content using Webflow Designer');
        }
      });
    } else if (issue.message.includes('internal link') && issue.message.includes('consider adding more')) {
      recommendations.push({
        priority: 4.5,
        type: 'info',
        title: '➕ Add More Internal Links',
        description: issue.message,
        action: () => {
          alert('Consider linking to 3-5 related pages for better site structure');
        }
      });
    }
    
    if (issue.message.includes('No external links')) {
      recommendations.push({
        priority: 4.5,
        type: 'info',
        title: '🌐 Link to Sources',
        description: 'Add 1-2 links to authoritative external sources to build trust',
        action: () => {
          alert('Link to reputable sources that support your content');
        }
      });
    }
    
    if (issue.message.includes('generic anchor text')) {
      recommendations.push({
        priority: 6,
        type: 'warning',
        title: '✏️ Fix Generic Link Text',
        description: 'Replace "click here" with descriptive text that explains where the link goes',
        action: () => {
          alert('Update link text to be more descriptive in Webflow Designer');
        }
      });
    }
  });
  
  // Priority 7: Content quality improvements
  issues.forEach(issue => {
    if (issue.message.includes('sentences are too long')) {
      recommendations.push({
        priority: 7,
        type: 'warning',
        title: '✂️ Shorten Long Sentences',
        description: 'Break long sentences (20+ words) into shorter, clearer ones',
        action: () => {
          alert('Review your content and split sentences longer than 20 words for better readability');
        }
      });
    } else if (issue.message.includes('paragraph') && issue.message.includes('too long')) {
      recommendations.push({
        priority: 7,
        type: 'warning',
        title: '📄 Break Up Long Paragraphs',
        description: issue.message + ' - split into smaller paragraphs',
        action: () => {
          alert('Break paragraphs with 150+ words into smaller, more digestible chunks');
        }
      });
    } else if (issue.message.includes('passive voice')) {
      recommendations.push({
        priority: 7,
        type: 'info',
        title: '✍️ Use Active Voice',
        description: 'Rewrite passive sentences to be more direct and engaging',
        action: () => {
          alert('Change passive voice (e.g., "was written by") to active voice (e.g., "wrote")');
        }
      });
    } else if (issue.message.includes('transition word')) {
      recommendations.push({
        priority: 7,
        type: 'info',
        title: '🔗 Add Transition Words',
        description: 'Use words like "however", "therefore", "moreover" to connect ideas',
        action: () => {
          alert('Add transition words to improve content flow and readability');
        }
      });
    } else if (issue.message.includes('consecutive sentences start')) {
      recommendations.push({
        priority: 7,
        type: 'warning',
        title: '🔄 Vary Sentence Starts',
        description: issue.message + ' - rewrite for variety',
        action: () => {
          alert('Vary your sentence beginnings to make content more engaging');
        }
      });
    }
  });
  
  // Priority 8: Image optimization
  issues.forEach(issue => {
    if (issue.message.includes('images missing alt text')) {
      recommendations.push({
        priority: 3, // High priority - accessibility issue
        type: 'error',
        title: '🖼️ Add Missing Alt Text',
        description: issue.message + ' - critical for accessibility and SEO',
        action: () => {
          alert('Select images in Webflow Designer and add descriptive alt text');
        }
      });
    } else if (issue.message.includes('generic alt text')) {
      recommendations.push({
        priority: 8,
        type: 'warning',
        title: '✏️ Improve Alt Descriptions',
        description: 'Replace generic terms with descriptive text that explains the image content',
        action: () => {
          alert('Update alt text to describe what the image shows, not just "image" or "photo"');
        }
      });
    } else if (issue.message.includes('alt text that\'s too short')) {
      recommendations.push({
        priority: 8,
        type: 'warning',
        title: '📝 Expand Short Alt Text',
        description: 'Alt text should be at least 5 characters to be meaningful',
        action: () => {
          alert('Make alt text more descriptive - explain what the image shows');
        }
      });
    } else if (issue.message.includes('alt text that\'s too long')) {
      recommendations.push({
        priority: 8,
        type: 'info',
        title: '✂️ Shorten Long Alt Text',
        description: 'Keep alt text under 125 characters for best results',
        action: () => {
          alert('Trim alt text to be concise but descriptive (under 125 chars)');
        }
      });
    } else if (issue.message.includes('non-descriptive filenames')) {
      recommendations.push({
        priority: 8,
        type: 'info',
        title: '📁 Use SEO-Friendly Filenames',
        description: 'Replace generic filenames like IMG_1234.jpg with descriptive names',
        action: () => {
          alert('Rename images with descriptive filenames before uploading (e.g., red-running-shoes.jpg)');
        }
      });
    } else if (issue.message.includes('Consider adding') && issue.message.includes('more image')) {
      recommendations.push({
        priority: 8,
        type: 'info',
        title: '📸 Add More Images',
        description: issue.message,
        action: () => {
          alert('Add relevant images to break up text and improve engagement');
        }
      });
    } else if (issue.message.includes('avoid over-optimization')) {
      recommendations.push({
        priority: 8,
        type: 'warning',
        title: '⚠️ Reduce Keyword in Alt Text',
        description: 'Using your keyword in every alt text looks spammy',
        action: () => {
          alert('Use your keyword naturally in only 1-2 image alt texts, not all of them');
        }
      });
    }
  });
  
  // Priority 9: Technical SEO
  issues.forEach(issue => {
    if (issue.message.includes('URL slug is too long')) {
      recommendations.push({
        priority: 9,
        type: 'warning',
        title: '🔗 Shorten URL Slug',
        description: 'Keep URLs under 60 characters for better user experience',
        action: () => {
          alert('Edit page slug in Webflow page settings to be more concise');
        }
      });
    } else if (issue.message.includes('stop words')) {
      recommendations.push({
        priority: 9,
        type: 'info',
        title: '🧹 Clean Up URL',
        description: 'Remove unnecessary words like "the", "and", "in" from URL',
        action: () => {
          alert('Edit slug to remove stop words (e.g., "the-best-shoes-in-store" → "best-shoes-store")');
        }
      });
    } else if (issue.message.includes('special characters or uppercase')) {
      recommendations.push({
        priority: 9,
        type: 'warning',
        title: '⚠️ Fix URL Format',
        description: 'Use only lowercase letters, numbers, and hyphens in URLs',
        action: () => {
          alert('Update slug to use only lowercase letters and hyphens (no spaces or special characters)');
        }
      });
    } else if (issue.message.includes('duplicate hyphens')) {
      recommendations.push({
        priority: 9,
        type: 'warning',
        title: '➖ Fix Double Hyphens',
        description: 'Remove duplicate hyphens from URL for cleaner structure',
        action: () => {
          alert('Edit slug to remove double hyphens (-- should be -)');
        }
      });
    } else if (issue.message.includes('draft mode')) {
      recommendations.push({
        priority: 9,
        type: 'info',
        title: '📝 Page in Draft Mode',
        description: 'Publish page when ready for search engine indexing',
        action: () => {
          alert('Publish this page in Webflow when content is finalized');
        }
      });
    } else if (issue.message.includes('Open Graph tags')) {
      recommendations.push({
        priority: 9,
        type: 'info',
        title: '📱 Add Social Sharing Tags',
        description: 'Open Graph tags improve how your page appears when shared on social media',
        action: () => {
          alert('Add Open Graph settings in Webflow page settings for better social previews');
        }
      });
    } else if (issue.message.includes('Article schema')) {
      recommendations.push({
        priority: 9,
        type: 'info',
        title: '📄 Add Article Schema',
        description: 'Help search engines understand your content structure',
        action: () => {
          alert('Consider adding Article structured data via custom code embed');
        }
      });
    } else if (issue.message.includes('FAQ schema')) {
      recommendations.push({
        priority: 9,
        type: 'info',
        title: '❓ Add FAQ Schema',
        description: 'Q&A content can appear as rich snippets in search results',
        action: () => {
          alert('Add FAQ structured data to enhance search appearance');
        }
      });
    }
  });
  
  // Priority 10: Other improvements
  issues.filter(i => i.type === 'warning' || i.type === 'info').forEach(issue => {
    if (issue.message.includes('readability') && !issue.message.includes('sentence') && !issue.message.includes('paragraph')) {
      recommendations.push({
        priority: 10,
        type: 'info',
        title: '📖 Improve Readability',
        description: issue.message,
      });
    }
  });
  
  // Sort by priority
  recommendations.sort((a, b) => a.priority - b.priority);
  
  // Update count
  const countEl = document.getElementById('rec-count');
  if (countEl) {
    countEl.textContent = recommendations.length > 0 ? `(${recommendations.length})` : '';
  }
  
  // Display recommendations
  if (recommendations.length === 0) {
    recommendationsList.innerHTML = `
      <div class="all-good">
        <div class="rec-title">✨ Excellent SEO!</div>
        <div class="rec-desc">Your page is well-optimized. Keep creating great content!</div>
      </div>
    `;
    return;
  }
  
  recommendationsList.innerHTML = recommendations.map(rec => `
    <div class="recommendation-item ${rec.type}" ${rec.action ? `onclick="(${rec.action.toString()})()"` : ''}>
      <div class="rec-header">
        <span class="rec-title">${rec.title}</span>
        <span class="rec-type ${rec.type}">${rec.type === 'error' ? 'Required' : rec.type === 'warning' ? 'Important' : 'Suggested'}</span>
      </div>
      <div class="rec-desc">${rec.description}</div>
    </div>
  `).join('');
}


function updateCharCount(field: 'title' | 'desc', value: string) {
  const countElement = document.getElementById(`${field}-count`);
  const issuesElement = document.getElementById(`${field}-issues`);
  
  if (!countElement) return;
  
  const config = field === 'title' ? SEO_CONFIG.title : SEO_CONFIG.description;
  const length = value.length;
  
  countElement.textContent = `(${length}/${config.max})`;
  countElement.classList.remove('warning', 'error', 'over');
  
  if (issuesElement) {
    issuesElement.textContent = '';
    
    if (length === 0) {
      issuesElement.textContent = 'Required field';
      countElement.classList.add('error');
    } else if (length < config.min) {
      issuesElement.textContent = `Too short (min ${config.min} characters)`;
      countElement.classList.add('warning');
    } else if (length > config.max) {
      issuesElement.textContent = `Over recommended length - may be truncated in search results`;
      countElement.classList.add('over');
    }
  }
}

function enableUpdateButton() {
  const button = document.getElementById('update-meta') as HTMLButtonElement;
  if (button) {
    button.disabled = false;
  }
}

async function updateMetaTags() {
  const titleInput = document.getElementById('page-title') as HTMLInputElement;
  const descInput = document.getElementById('page-description') as HTMLTextAreaElement;
  const button = document.getElementById('update-meta') as HTMLButtonElement;
  
  if (!titleInput || !descInput || !button) return;
  
  button.disabled = true;
  button.textContent = 'Updating...';
  
  try {
    const page = await webflow.getCurrentPage();
    if (!page) throw new Error('No page selected');
    
    await page.setTitle(titleInput.value || null);
    await page.setDescription(descInput.value || null);
    
    button.textContent = 'Updated!';
    setTimeout(() => {
      button.textContent = 'Update Meta Tags';
      analyzePage(); // Re-analyze after update
    }, 2000);
    
  } catch (error) {
    console.error('Update error:', error);
    button.textContent = 'Update Failed';
    button.disabled = false;
    setTimeout(() => {
      button.textContent = 'Update Meta Tags';
    }, 2000);
  }
}

function showLoading() {
  const sections = ['page-info', 'issues-list', 'fixes-list'];
  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<div class="loading">Loading...</div>';
    }
  });
}

function showError(message: string) {
  const pageInfo = document.getElementById('page-info');
  if (pageInfo) {
    pageInfo.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Cache for content analysis to improve performance
let contentCache: {
  text: string;
  wordCount: number;
  readingTime: number;
  readabilityScore: number;
  headings: HeadingInfo[];
  timestamp: number;
  contentQuality?: ContentQualityMetrics;
} | null = null;

interface ContentQualityMetrics {
  longSentences: number;
  totalSentences: number;
  longSentencePercentage: number;
  longParagraphs: number;
  totalParagraphs: number;
  consecutiveSentenceStarts: number;
  passiveVoiceCount: number;
  transitionWordCount: number;
}

const CACHE_DURATION = 30000; // 30 seconds

// Content Analysis Functions
async function analyzeContentQuality() {
  try {
    // Check cache first
    if (contentCache && Date.now() - contentCache.timestamp < CACHE_DURATION) {
      // Use cached data
      displayContentMetrics(contentCache.wordCount, contentCache.readingTime, contentCache.readabilityScore);
      displayHeadingStructure(contentCache.headings);
      return;
    }
    
    const rootElement = await webflow.getRootElement();
    if (!rootElement) {
      return;
    }
    
    // Extract all text content using the corrected method
    const textContent = await extractTextContent(rootElement);
    
    if (textContent.length === 0) {
      // Show message that no content was found
      const wordCountEl = document.getElementById('word-count');
      if (wordCountEl) {
        wordCountEl.textContent = '0';
        wordCountEl.classList.add('poor');
      }
      
      const readingTimeEl = document.getElementById('reading-time');
      if (readingTimeEl) {
        readingTimeEl.textContent = '0 min';
      }
      
      const readabilityEl = document.getElementById('readability-score');
      const readabilityDescEl = document.getElementById('readability-desc');
      if (readabilityEl && readabilityDescEl) {
        readabilityEl.textContent = '--';
        readabilityDescEl.textContent = 'No content';
      }
    } else {
      // Calculate metrics with actual content
      const wordCount = countWords(textContent);
      const readingTime = calculateReadingTime(wordCount);
      const readabilityScore = calculateReadability(textContent);
      
      // Analyze content quality metrics
      const contentQuality = analyzeContentQualityMetrics(textContent);
      
      // Display results
      displayContentMetrics(wordCount, readingTime, readabilityScore);
      
      // Analyze heading structure
      const headingStructure = await analyzeHeadingStructure(rootElement);
      displayHeadingStructure(headingStructure);
      
      // Cache the results
      contentCache = {
        text: textContent,
        wordCount,
        readingTime,
        readabilityScore,
        headings: headingStructure,
        timestamp: Date.now(),
        contentQuality // Add quality metrics to cache
      };
    }
    
  } catch (error) {
    console.error('Content analysis error:', error);
    
    // Show error state
    const wordCountEl = document.getElementById('word-count');
    if (wordCountEl) {
      wordCountEl.textContent = 'Error';
      wordCountEl.classList.add('poor');
    }
    
    const readabilityEl = document.getElementById('readability-score');
    if (readabilityEl) {
      readabilityEl.textContent = '--';
    }
  }
}

async function extractTextContent(element: any): Promise<string> {
  let text = '';
  
  try {
    // Check if this is already a StringElement using type property (not method!)
    if (element.type === 'String') {
      try {
        const textContent = await element.getText();
        if (textContent && typeof textContent === 'string') {
          return textContent;
        }
      } catch (e) {
        // Silently continue
      }
    }
    
    // Check if element has getTag method to skip certain elements
    if (element.getTag && typeof element.getTag === 'function') {
      try {
        const tag = await element.getTag();
        
        // Skip certain elements
        if (['script', 'style', 'noscript'].indexOf(tag) !== -1) {
          return '';
        }
      } catch (e) {
        // Silently continue
      }
    }
    
    // Check if element supports text content (semantic elements like p, h1-h6)
    if (element.textContent === true && element.children) {
      try {
        const children = await element.getChildren();
        
        // Look for StringElement children
        for (const child of children) {
          if (child.type === 'String') {
            const childText = await child.getText();
            if (childText) {
              text += childText + ' ';
            }
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
    
    // Recursively get text from all children
    if (element.getChildren && typeof element.getChildren === 'function') {
      try {
        const children = await element.getChildren();
        if (children && Array.isArray(children)) {
          for (const child of children) {
            // Skip if it's a StringElement (already handled above)
            if (child.type !== 'String') {
              const childText = await extractTextContent(child);
              if (childText) {
                text += childText + ' ';
              }
            }
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
  } catch (error) {
    // Silently continue
  }
  
  return text.trim();
}

function countWords(text: string): number {
  // Remove extra whitespace and split by spaces
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

function calculateReadingTime(wordCount: number): number {
  // Average reading speed is 200-250 words per minute
  const wordsPerMinute = 225;
  return Math.ceil(wordCount / wordsPerMinute);
}

function calculateReadability(text: string): number {
  // Simplified Flesch Reading Ease calculation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  // Simple syllable counting algorithm
  word = word.toLowerCase();
  let count = 0;
  const vowels = 'aeiouy';
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.indexOf(word[i]) !== -1;
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }
  
  // Ensure at least 1 syllable
  return Math.max(1, count);
}

// Analyze content quality metrics (sentence length, paragraph length, etc)
function analyzeContentQualityMetrics(text: string): ContentQualityMetrics {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalSentences = sentences.length;
  
  // Count long sentences (>20 words)
  let longSentences = 0;
  let consecutiveSentenceStarts = 0;
  let previousStart = '';
  
  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 20) {
      longSentences++;
    }
    
    // Check consecutive sentence starts
    if (words.length > 0) {
      const firstWord = words[0].toLowerCase();
      if (index > 0 && firstWord === previousStart) {
        consecutiveSentenceStarts++;
      }
      previousStart = firstWord;
    }
  });
  
  // Split into paragraphs (double line breaks or common patterns)
  const paragraphs = text.split(/\n\n|\r\n\r\n/).filter(p => p.trim().length > 0);
  const totalParagraphs = Math.max(1, paragraphs.length);
  
  // Count long paragraphs (>150 words)
  let longParagraphs = 0;
  paragraphs.forEach(paragraph => {
    const words = paragraph.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 150) {
      longParagraphs++;
    }
  });
  
  // Count passive voice (simplified check)
  const passivePatterns = [
    /\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi,
    /\b(is|are|was|were|been|being|be)\s+\w+en\b/gi
  ];
  let passiveVoiceCount = 0;
  passivePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) passiveVoiceCount += matches.length;
  });
  
  // Count transition words
  const transitionWords = [
    'however', 'therefore', 'moreover', 'furthermore', 'nevertheless',
    'consequently', 'meanwhile', 'accordingly', 'hence', 'thus',
    'additionally', 'similarly', 'likewise', 'equally', 'namely',
    'specifically', 'particularly', 'in fact', 'indeed', 'of course',
    'for example', 'for instance', 'in conclusion', 'in summary', 'finally'
  ];
  let transitionWordCount = 0;
  const lowerText = text.toLowerCase();
  transitionWords.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'g');
    const matches = lowerText.match(regex);
    if (matches) transitionWordCount += matches.length;
  });
  
  return {
    longSentences,
    totalSentences,
    longSentencePercentage: totalSentences > 0 ? (longSentences / totalSentences) * 100 : 0,
    longParagraphs,
    totalParagraphs,
    consecutiveSentenceStarts,
    passiveVoiceCount,
    transitionWordCount
  };
}

interface HeadingInfo {
  level: number;
  text: string;
  tag: string;
}

async function analyzeHeadingStructure(element: any, headings: HeadingInfo[] = []): Promise<HeadingInfo[]> {
  try {
    // Check if this element is a Heading type
    if (element.type === 'Heading') {
      try {
        // Get the heading level (1-6)
        const level = await element.getHeadingLevel();
        let text = '';
        
        // Extract text from heading's StringElement children
        if (element.getChildren && typeof element.getChildren === 'function') {
          const children = await element.getChildren();
          for (const child of children) {
            if (child.type === 'String') {
              const childText = await child.getText();
              if (childText) {
                text += childText + ' ';
              }
            }
          }
        }
        
        headings.push({
          level: level,
          text: text.trim() || `Empty H${level}`,
          tag: `H${level}`
        });
      } catch (e) {
        console.error('Error processing heading:', e);
      }
    }
    
    // Recursively check all children
    if (element.getChildren && typeof element.getChildren === 'function') {
      try {
        const children = await element.getChildren();
        if (children && Array.isArray(children)) {
          for (const child of children) {
            // Don't skip any elements - we need to traverse everything to find headings
            await analyzeHeadingStructure(child, headings);
          }
        }
      } catch (e) {
        // Element might not have children
      }
    }
  } catch (error) {
    console.error('Error in analyzeHeadingStructure:', error);
  }
  
  return headings;
}

function displayContentMetrics(wordCount: number, readingTime: number, readabilityScore: number) {
  // Word count - Update the entire metric-value-wrap div
  const wordCountEl = document.getElementById('word-count');
  const wordTargetEl = document.getElementById('word-target');
  const wordCountWrap = wordCountEl?.parentElement;
  
  if (wordCountEl && wordCountWrap && wordTargetEl) {
    wordCountEl.textContent = wordCount.toString();
    wordCountEl.classList.remove('loading'); // Remove loading class
    wordTargetEl.style.display = 'inline'; // Show the target
    
    // Remove classes from wrapper and add appropriate color
    wordCountWrap.classList.remove('good', 'warning', 'poor');
    
    if (wordCount >= SEO_CONFIG.content.targetWords) {
      wordCountWrap.classList.add('good');
    } else if (wordCount >= SEO_CONFIG.content.minWords) {
      wordCountWrap.classList.add('warning');
    } else {
      wordCountWrap.classList.add('poor');
    }
  }
  
  // Reading time
  const readingTimeEl = document.getElementById('reading-time');
  if (readingTimeEl) {
    readingTimeEl.textContent = `${readingTime} min`;
    readingTimeEl.classList.remove('loading'); // Remove loading class
  }
  
  // Readability - Update both score and description
  const readabilityEl = document.getElementById('readability-score');
  const readabilityDescEl = document.getElementById('readability-desc');
  const readabilityWrap = readabilityEl?.parentElement;
  
  if (readabilityEl && readabilityDescEl && readabilityWrap) {
    readabilityEl.textContent = readabilityScore.toString();
    readabilityEl.classList.remove('loading'); // Remove loading class
    readabilityDescEl.style.display = 'inline'; // Show the description
    
    // Remove classes from wrapper
    readabilityWrap.classList.remove('good', 'warning', 'poor');
    
    let description = '';
    if (readabilityScore >= 90) {
      description = 'Very Easy';
      readabilityWrap.classList.add('warning'); // Too simple
    } else if (readabilityScore >= 80) {
      description = 'Easy';
      readabilityWrap.classList.add('good');
    } else if (readabilityScore >= 70) {
      description = 'Fairly Easy';
      readabilityWrap.classList.add('good');
    } else if (readabilityScore >= 60) {
      description = 'Standard';
      readabilityWrap.classList.add('good');
    } else if (readabilityScore >= 50) {
      description = 'Fairly Difficult';
      readabilityWrap.classList.add('warning');
    } else if (readabilityScore >= 30) {
      description = 'Difficult';
      readabilityWrap.classList.add('warning');
    } else {
      description = 'Very Difficult';
      readabilityWrap.classList.add('poor');
    }
    
    readabilityDescEl.textContent = description;
  }
}

function displayHeadingStructure(headings: HeadingInfo[]) {
  const headingAnalysisEl = document.getElementById('heading-analysis');
  if (!headingAnalysisEl) return;
  
  console.log('Displaying headings:', headings);
  
  if (headings.length === 0) {
    headingAnalysisEl.innerHTML = '<div class="no-headings">No headings found</div>';
    return;
  }
  
  headingAnalysisEl.innerHTML = headings.map(heading => `
    <div class="heading-item ${heading.tag.toLowerCase()}">
      <span class="heading-tag">${heading.tag}</span>
      <span class="heading-text">${heading.text}</span>
    </div>
  `).join('');
}