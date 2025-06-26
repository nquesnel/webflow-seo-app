const express = require('express');
const router = express.Router();
const WebflowClient = require('../lib/webflow-client');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.webflow = new WebflowClient(req.session.accessToken);
  next();
};

// Get all sites
router.get('/sites', requireAuth, async (req, res) => {
  try {
    const sites = await req.webflow.getSites();
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SEO data for all pages in a site
router.get('/sites/:siteId/seo', requireAuth, async (req, res) => {
  try {
    const pages = await req.webflow.getPages(req.params.siteId);
    
    // Get detailed SEO data for each page
    const seoData = await Promise.all(
      pages.pages.map(async (page) => {
        const pageDetails = await req.webflow.getPage(page.id);
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update page SEO
router.patch('/pages/:pageId/seo', requireAuth, async (req, res) => {
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
    
    const result = await req.webflow.updatePageSEO(req.params.pageId, seoData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collections for a site
router.get('/sites/:siteId/collections', requireAuth, async (req, res) => {
  try {
    const collections = await req.webflow.getCollections(req.params.siteId);
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection items with SEO fields
router.get('/collections/:collectionId/items', requireAuth, async (req, res) => {
  try {
    const items = await req.webflow.getCollectionItems(req.params.collectionId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk SEO analysis
router.post('/sites/:siteId/analyze-seo', requireAuth, async (req, res) => {
  try {
    const pages = await req.webflow.getPages(req.params.siteId);
    
    const analysis = await Promise.all(
      pages.pages.map(async (page) => {
        const pageDetails = await req.webflow.getPage(page.id);
        const seo = pageDetails.seo || {};
        
        // Basic SEO analysis
        const issues = [];
        
        if (!seo.title || seo.title.length < 30) {
          issues.push('Title too short (recommended: 30-60 characters)');
        }
        if (seo.title && seo.title.length > 60) {
          issues.push('Title too long (recommended: 30-60 characters)');
        }
        if (!seo.description || seo.description.length < 120) {
          issues.push('Description too short (recommended: 120-160 characters)');
        }
        if (seo.description && seo.description.length > 160) {
          issues.push('Description too long (recommended: 120-160 characters)');
        }
        if (!seo.openGraph?.title) {
          issues.push('Missing Open Graph title');
        }
        if (!seo.openGraph?.description) {
          issues.push('Missing Open Graph description');
        }
        
        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          seo: seo,
          issues: issues,
          score: Math.max(0, 100 - (issues.length * 15))
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;