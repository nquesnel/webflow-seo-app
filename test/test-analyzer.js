const fs = require('fs');
const path = require('path');
const { SEOAnalyzer } = require('../dist/services/seo-analyzer');

async function testAnalyzer() {
  const analyzer = new SEOAnalyzer();
  
  console.log('🧪 Testing SEO Analyzer\n');
  
  // Test 1: Good SEO page
  console.log('📄 Test 1: Well-optimized page');
  console.log('================================');
  const goodHtml = fs.readFileSync(path.join(__dirname, 'sample-page.html'), 'utf-8');
  const goodResult = await analyzer.analyze({
    pageId: 'test-page-1',
    siteId: 'test-site'
  }, goodHtml);
  
  console.log(`Overall Score: ${goodResult.score.overall}/100`);
  console.log('\nScore Breakdown:');
  console.log(`- Meta Tags: ${goodResult.score.breakdown.metaTags}/100`);
  console.log(`- Keywords: ${goodResult.score.breakdown.keywords}/100`);
  console.log(`- Headings: ${goodResult.score.breakdown.headings}/100`);
  console.log(`- Images: ${goodResult.score.breakdown.images}/100`);
  console.log(`\nExecution Time: ${goodResult.executionTime}ms`);
  
  if (goodResult.recommendations.length > 0) {
    console.log('\nRecommendations:');
    goodResult.recommendations.forEach(rec => console.log(`- ${rec}`));
  }
  
  // Test 2: Poor SEO page
  console.log('\n\n📄 Test 2: Poorly optimized page');
  console.log('==================================');
  const poorHtml = fs.readFileSync(path.join(__dirname, 'poor-seo-page.html'), 'utf-8');
  const poorResult = await analyzer.analyze({
    pageId: 'test-page-2',
    siteId: 'test-site'
  }, poorHtml);
  
  console.log(`Overall Score: ${poorResult.score.overall}/100`);
  console.log('\nScore Breakdown:');
  console.log(`- Meta Tags: ${poorResult.score.breakdown.metaTags}/100`);
  console.log(`- Keywords: ${poorResult.score.breakdown.keywords}/100`);
  console.log(`- Headings: ${poorResult.score.breakdown.headings}/100`);
  console.log(`- Images: ${poorResult.score.breakdown.images}/100`);
  console.log(`\nExecution Time: ${poorResult.executionTime}ms`);
  
  console.log('\nRecommendations:');
  poorResult.recommendations.forEach(rec => console.log(`- ${rec}`));
  
  // Test 3: Performance test
  console.log('\n\n⚡ Test 3: Performance Test');
  console.log('============================');
  const startTime = Date.now();
  const iterations = 10;
  
  for (let i = 0; i < iterations; i++) {
    await analyzer.analyze({
      pageId: `perf-test-${i}`,
      siteId: 'test-site'
    }, goodHtml);
  }
  
  const totalTime = Date.now() - startTime;
  const avgTime = totalTime / iterations;
  console.log(`Analyzed ${iterations} pages in ${totalTime}ms`);
  console.log(`Average time per page: ${avgTime.toFixed(2)}ms`);
  console.log(`✅ Performance requirement met: ${avgTime < 500 ? 'YES' : 'NO'} (${avgTime.toFixed(2)}ms < 500ms)`);
  
  // Display top keywords from good page
  console.log('\n\n🔑 Top Keywords from Well-Optimized Page:');
  console.log('==========================================');
  goodResult.keywords.topKeywords.forEach((kw, index) => {
    console.log(`${index + 1}. "${kw.keyword}" - ${kw.count} times (${kw.density.toFixed(2)}% density)`);
  });
}

testAnalyzer().catch(console.error);