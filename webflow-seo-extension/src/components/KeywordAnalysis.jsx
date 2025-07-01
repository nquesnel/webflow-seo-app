import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatsCard = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const KeywordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const KeywordItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
`;

const KeywordText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const KeywordStats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
`;

const DensityBar = styled.div`
  width: 100px;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
  overflow: hidden;
  margin-left: 8px;
`;

const DensityFill = styled.div`
  height: 100%;
  background: ${props => props.density > 3 ? '#ef4444' : '#10b981'};
  width: ${props => Math.min(props.density * 20, 100)}%;
`;

function KeywordAnalysis({ keywords }) {
  return (
    <Container>
      <StatsCard>
        <Stat>
          <StatValue>{keywords.totalWords}</StatValue>
          <StatLabel>Total Words</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{keywords.density.toFixed(1)}%</StatValue>
          <StatLabel>Avg Keyword Density</StatLabel>
        </Stat>
        <Stat>
          <StatValue>{keywords.topKeywords.length}</StatValue>
          <StatLabel>Top Keywords</StatLabel>
        </Stat>
      </StatsCard>

      {keywords.issues.length > 0 && (
        <div style={{ color: '#ef4444', fontSize: '14px' }}>
          <strong>Issues:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {keywords.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 style={{ marginBottom: 12 }}>Top Keywords</h4>
        <KeywordList>
          {keywords.topKeywords.map((kw, index) => (
            <KeywordItem key={index}>
              <KeywordText>{kw.keyword}</KeywordText>
              <KeywordStats>
                <span>{kw.count} times</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{kw.density.toFixed(1)}%</span>
                  <DensityBar>
                    <DensityFill density={kw.density} />
                  </DensityBar>
                </div>
              </KeywordStats>
            </KeywordItem>
          ))}
        </KeywordList>
      </div>
    </Container>
  );
}

export default KeywordAnalysis;