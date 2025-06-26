const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Simple file-based token storage for development
// In production, use a proper database
class TokenStore {
  constructor() {
    this.storePath = path.join(__dirname, '..', '.tokens');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create token store directory:', error);
    }
  }

  // Generate a unique session ID
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store token data
  async saveToken(sessionId, tokenData) {
    const filePath = path.join(this.storePath, `${sessionId}.json`);
    const data = {
      ...tokenData,
      savedAt: new Date().toISOString()
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // Retrieve token data
  async getToken(sessionId) {
    try {
      const filePath = path.join(this.storePath, `${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // Delete token data
  async deleteToken(sessionId) {
    try {
      const filePath = path.join(this.storePath, `${sessionId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  }

  // Clean up old tokens (optional)
  async cleanup(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.storePath);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storePath, file);
          const stats = await fs.stat(filePath);
          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Token cleanup error:', error);
    }
  }
}

module.exports = new TokenStore();