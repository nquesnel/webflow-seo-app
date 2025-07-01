import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SEODashboard from './components/SEODashboard';
import PageSelector from './components/PageSelector';
import { getSelectedElement, subscribeToSelectionChange } from './utils/webflowApi';

const AppContainer = styled.div`
  padding: 20px;
  background: #ffffff;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e5e5;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const Icon = styled.div`
  width: 40px;
  height: 40px;
  background: #4353ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
`;

function App() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [seoData, setSeoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to Webflow selection changes
    const unsubscribe = subscribeToSelectionChange((element) => {
      setSelectedElement(element);
    });

    // Get initial selection
    getSelectedElement().then(setSelectedElement);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const analyzePage = async (pageId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the site ID from Webflow
      const siteId = await webflow.getSiteId();
      
      // Call your API to analyze the page
      const response = await fetch(`https://webflow-seo-app.onrender.com/api/pages/${pageId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          // In production, you'd get the actual HTML from the page
          html: '<html>...</html>' // Placeholder
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze page');
      }

      const data = await response.json();
      setSeoData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContainer>
      <Header>
        <Logo>
          <Icon>S</Icon>
          <div>
            <Title>SEO Psycho</Title>
            <Subtitle>Optimize your Webflow site for search engines</Subtitle>
          </div>
        </Logo>
      </Header>

      <PageSelector 
        onPageSelect={(page) => {
          setSelectedPage(page);
          if (page) analyzePage(page.id);
        }}
      />

      {error && (
        <div style={{ color: 'red', marginTop: 16 }}>
          Error: {error}
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          Analyzing page...
        </div>
      )}

      {seoData && !isLoading && (
        <SEODashboard 
          data={seoData}
          selectedElement={selectedElement}
          onUpdate={(updates) => {
            // Handle SEO updates
            console.log('SEO Updates:', updates);
          }}
        />
      )}
    </AppContainer>
  );
}

export default App;