# SEO Psycho Designer Extension

This is the Designer Extension for the SEO Psycho Webflow app. It provides a real-time SEO analysis interface within the Webflow Designer.

## Features

- Real-time SEO score calculation
- Meta tags editor with character count
- Keyword density analysis
- Heading structure validation
- Image alt text checker
- Interactive SEO recommendations

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. The extension will be available at `http://localhost:1337`

## Building for Production

```bash
npm run build
```

This creates a `dist` folder with the production build.

## Deployment

To deploy to Webflow:

1. Build the extension: `npm run build`
2. In your Webflow app settings, upload the contents of the `dist` folder
3. Publish the new version

## API Integration

The extension communicates with the SEO analysis API at:
- Development: `http://localhost:3000/api`
- Production: `https://webflow-seo-app.onrender.com/api`

## Components

- **SEODashboard**: Main dashboard showing SEO score and tabs
- **ScoreCard**: Visual representation of the overall SEO score
- **MetaTagsEditor**: Edit title and meta description with validation
- **KeywordAnalysis**: Keyword density and top keywords
- **HeadingStructure**: H1-H6 hierarchy validation
- **ImageAnalysis**: Missing alt text detection