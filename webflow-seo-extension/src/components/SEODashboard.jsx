import React, { useState } from 'react';
import styled from 'styled-components';
import ScoreCard from './ScoreCard';
import MetaTagsEditor from './MetaTagsEditor';
import KeywordAnalysis from './KeywordAnalysis';
import HeadingStructure from './HeadingStructure';
import ImageAnalysis from './ImageAnalysis';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e5e5;
`;

const Tab = styled.button`
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.active ? '#4353ff' : '#666'};
  border-bottom: 2px solid ${props => props.active ? '#4353ff' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: #4353ff;
  }
`;

const TabContent = styled.div`
  padding: 16px 0;
`;

function SEODashboard({ data, selectedElement, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'meta', label: 'Meta Tags' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'headings', label: 'Headings' },
    { id: 'images', label: 'Images' }
  ];

  return (
    <DashboardContainer>
      <ScoreCard score={data.score} />

      <TabContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabContainer>

      <TabContent>
        {activeTab === 'overview' && (
          <div>
            <h3>SEO Overview</h3>
            <p>Overall Score: {data.score.overall}/100</p>
            
            <h4>Recommendations:</h4>
            <ul>
              {data.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>

            <h4>Score Breakdown:</h4>
            <ul>
              <li>Meta Tags: {data.score.breakdown.metaTags}/100</li>
              <li>Keywords: {data.score.breakdown.keywords}/100</li>
              <li>Headings: {data.score.breakdown.headings}/100</li>
              <li>Images: {data.score.breakdown.images}/100</li>
            </ul>
          </div>
        )}

        {activeTab === 'meta' && (
          <MetaTagsEditor 
            metaTags={data.metaTags}
            onUpdate={onUpdate}
          />
        )}

        {activeTab === 'keywords' && (
          <KeywordAnalysis keywords={data.keywords} />
        )}

        {activeTab === 'headings' && (
          <HeadingStructure headings={data.headings} />
        )}

        {activeTab === 'images' && (
          <ImageAnalysis images={data.images} />
        )}
      </TabContent>
    </DashboardContainer>
  );
}

export default SEODashboard;