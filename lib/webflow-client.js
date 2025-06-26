const axios = require('axios');

class WebflowClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.apiBase = 'https://api.webflow.com/v2';
    this.client = axios.create({
      baseURL: this.apiBase,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          console.error('Webflow API Error:', {
            status: error.response.status,
            data: error.response.data
          });
        }
        return Promise.reject(error);
      }
    );
  }

  // Get all sites
  async getSites() {
    const response = await this.client.get('/sites');
    return response.data;
  }

  // Get site details
  async getSite(siteId) {
    const response = await this.client.get(`/sites/${siteId}`);
    return response.data;
  }

  // Get pages for a site
  async getPages(siteId) {
    const response = await this.client.get(`/sites/${siteId}/pages`);
    return response.data;
  }

  // Get page details with SEO metadata
  async getPage(pageId) {
    const response = await this.client.get(`/pages/${pageId}`);
    return response.data;
  }

  // Update page SEO settings
  async updatePageSEO(pageId, seoData) {
    const response = await this.client.patch(`/pages/${pageId}`, {
      seo: seoData
    });
    return response.data;
  }

  // Get collections
  async getCollections(siteId) {
    const response = await this.client.get(`/sites/${siteId}/collections`);
    return response.data;
  }

  // Get collection items
  async getCollectionItems(collectionId) {
    const response = await this.client.get(`/collections/${collectionId}/items`);
    return response.data;
  }

  // Update collection item SEO
  async updateCollectionItem(collectionId, itemId, data) {
    const response = await this.client.patch(`/collections/${collectionId}/items/${itemId}`, {
      fieldData: data
    });
    return response.data;
  }

  // Publish site
  async publishSite(siteId, domains = []) {
    const response = await this.client.post(`/sites/${siteId}/publish`, {
      domains: domains
    });
    return response.data;
  }
}

module.exports = WebflowClient;