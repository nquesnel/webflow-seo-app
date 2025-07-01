import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeadingTree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HeadingItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  margin-left: ${props => (props.level - 1) * 20}px;
`;

const HeadingTag = styled.span`
  background: ${props => {
    if (props.level === 1) return '#4353ff';
    if (props.level === 2) return '#7c3aed';
    if (props.level === 3) return '#2563eb';
    return '#64748b';
  }};
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
`;

const HeadingText = styled.span`
  font-size: 14px;
  color: #333;
  flex: 1;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const StatCard = styled.div`
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.error ? '#ef4444' : '#333'};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const IssuesList = styled.ul`
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: #ef4444;
`;

function HeadingStructure({ headings }) {
  return (
    <Container>
      <StatsGrid>
        <StatCard>
          <StatNumber error={headings.h1Count !== 1}>
            {headings.h1Count}
          </StatNumber>
          <StatLabel>H1 Tags</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{headings.h2Count}</StatNumber>
          <StatLabel>H2 Tags</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>
            {headings.h3Count + headings.h4Count + headings.h5Count + headings.h6Count}
          </StatNumber>
          <StatLabel>H3-H6 Tags</StatLabel>
        </StatCard>
      </StatsGrid>

      {headings.issues.length > 0 && (
        <div>
          <strong style={{ color: '#ef4444' }}>Issues:</strong>
          <IssuesList>
            {headings.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </IssuesList>
        </div>
      )}

      <div>
        <h4 style={{ marginBottom: 12 }}>Heading Hierarchy</h4>
        <HeadingTree>
          {headings.hierarchy.map((heading, index) => (
            <HeadingItem key={index} level={heading.level}>
              <HeadingTag level={heading.level}>H{heading.level}</HeadingTag>
              <HeadingText>{heading.text}</HeadingText>
            </HeadingItem>
          ))}
        </HeadingTree>
      </div>
    </Container>
  );
}

export default HeadingStructure;