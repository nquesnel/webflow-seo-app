import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: ${props => {
    if (props.score >= 80) return '#10b981';
    if (props.score >= 60) return '#f59e0b';
    return '#ef4444';
  }};
  color: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ScoreNumber = styled.div`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const ScoreLabel = styled.div`
  font-size: 16px;
  opacity: 0.9;
`;

const ScoreStatus = styled.div`
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
`;

function ScoreCard({ score }) {
  const getStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Card score={score.overall}>
      <ScoreNumber>{score.overall}</ScoreNumber>
      <ScoreLabel>SEO Score</ScoreLabel>
      <ScoreStatus>{getStatus(score.overall)}</ScoreStatus>
    </Card>
  );
}

export default ScoreCard;