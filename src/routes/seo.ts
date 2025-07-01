import { Router, Request, Response, NextFunction } from 'express';
import { SEOAnalyzer } from '../services/seo-analyzer';
import { SEOAnalysisRequest } from '../types/seo.types';
const WebflowClient = require('../../lib/webflow-client');

interface AuthenticatedRequest extends Request {
  webflow?: any;
  session: {
    accessToken?: string;
    [key: string]: any;
  };
}

const router = Router();
const seoAnalyzer = new SEOAnalyzer();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.accessToken) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  authReq.webflow = new WebflowClient(authReq.session.accessToken);
  next();
};

// Get all sites
router.get('/sites', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const sites = await authReq.webflow.getSites();
    res.json(sites);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get SEO data for all pages in a site
router.get('/sites/:siteId/seo', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const pages = await authReq.webflow.getPages(req.params.siteId);
    
    // Get detailed SEO data for each page
    const seoData = await Promise.all(
      pages.pages.map(async (page: any) => {
        const pageDetails = await authReq.webflow.getPage(page.id);
        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          seo: pageDetails.seo || {},
          isHomePage: page.isHomePage
        };
      })
    );
    
    res.json({ pages: seoData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze a single page's SEO (NEW ENDPOINT)
router.post('/pages/:pageId/analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const { siteId, html } = req.body;
    
    if (!siteId) {
      res.status(400).json({ error: 'siteId is required' });
      return;
    }
    
    let pageHtml = html;
    
    // If HTML not provided, try to fetch it (this would require implementing a fetch method)
    if (!pageHtml) {
      // For now, we'll require HTML to be passed in
      res.status(400).json({ error: 'HTML content is required for analysis' });
      return;
    }
    
    const analysisRequest: SEOAnalysisRequest = {
      pageId: req.params.pageId,
      siteId: siteId,
      html: pageHtml
    };
    
    const result = await seoAnalyzer.analyze(analysisRequest, pageHtml);
    res.json(result);
    
  } catch (error: any) {
    console.error('SEO Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update page SEO
router.patch('/pages/:pageId/seo', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, ogTitle, ogDescription, ogImage } = req.body;
    
    const seoData = {
      title,
      description,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage
      }
    };
    
    const authReq = req as AuthenticatedRequest;
    const result = await authReq.webflow.updatePageSEO(req.params.pageId, seoData);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get collections for a site
router.get('/sites/:siteId/collections', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const collections = await authReq.webflow.getCollections(req.params.siteId);
    res.json(collections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection items with SEO fields
router.get('/collections/:collectionId/items', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const items = await authReq.webflow.getCollectionItems(req.params.collectionId);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk SEO analysis with new analyzer
router.post('/sites/:siteId/analyze-seo', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const pages = await authReq.webflow.getPages(req.params.siteId);
    const { includeHtmlAnalysis } = req.body;
    
    const analysis = await Promise.all(
      pages.pages.map(async (page: any) => {
        const pageDetails = await authReq.webflow.getPage(page.id);
        const seo = pageDetails.seo || {};
        
        // Basic metadata analysis (without HTML)
        const issues = [];
        let score = 100;
        
        if (!seo.title || seo.title.length < 30) {
          issues.push('Title too short (recommended: 30-60 characters)');
          score -= 15;
        }
        if (seo.title && seo.title.length > 60) {
          issues.push('Title too long (recommended: 30-60 characters)');
          score -= 10;
        }
        if (!seo.description || seo.description.length < 120) {
          issues.push('Description too short (recommended: 120-160 characters)');
          score -= 15;
        }
        if (seo.description && seo.description.length > 160) {
          issues.push('Description too long (recommended: 120-160 characters)');
          score -= 10;
        }
        if (!seo.openGraph?.title) {
          issues.push('Missing Open Graph title');
          score -= 10;
        }
        if (!seo.openGraph?.description) {
          issues.push('Missing Open Graph description');
          score -= 10;
        }
        
        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          seo: seo,
          issues: issues,
          score: Math.max(0, score),
          needsHtmlAnalysis: includeHtmlAnalysis || false
        };
      })
    );
    
    res.json({ 
      pages: analysis,
      summary: {
        totalPages: analysis.length,
        averageScore: Math.round(analysis.reduce((sum, p) => sum + p.score, 0) / analysis.length),
        totalIssues: analysis.reduce((sum, p) => sum + p.issues.length, 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;