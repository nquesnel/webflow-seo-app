import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Summary = styled.div`
  background: ${props => props.hasIssues ? '#fef2f2' : '#f0fdf4'};
  border: 1px solid ${props => props.hasIssues ? '#fecaca' : '#bbf7d0'};
  padding: 16px;
  border-radius: 8px;
`;

const SummaryTitle = styled.h4`
  margin: 0 0 8px 0;
  color: ${props => props.hasIssues ? '#dc2626' : '#16a34a'};
`;

const SummaryStats = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 12px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: 20px;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.span`
  font-size: 12px;
  color: #666;
`;

const ImageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ImageItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
`;

const ImageIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
`;

const ImagePath = styled.span`
  flex: 1;
  color: #333;
  font-family: monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AltStatus = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.missing ? '#fee2e2' : '#dcfce7'};
  color: ${props => props.missing ? '#dc2626' : '#16a34a'};
`;

function ImageAnalysis({ images }) {
  const hasIssues = images.imagesWithoutAlt > 0;

  return (
    <Container>
      <Summary hasIssues={hasIssues}>
        <SummaryTitle hasIssues={hasIssues}>
          {hasIssues 
            ? `${images.imagesWithoutAlt} images missing alt text`
            : 'All images have alt text!'
          }
        </SummaryTitle>
        <SummaryStats>
          <Stat>
            <StatValue>{images.totalImages}</StatValue>
            <StatLabel>Total Images</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{images.imagesWithAlt}</StatValue>
            <StatLabel>With Alt Text</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{images.imagesWithoutAlt}</StatValue>
            <StatLabel>Missing Alt Text</StatLabel>
          </Stat>
        </SummaryStats>
      </Summary>

      {images.issues.length > 0 && (
        <div>
          <strong style={{ color: '#ef4444' }}>Issues:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: '14px', color: '#ef4444' }}>
            {images.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {images.missingAltImages.length > 0 && (
        <div>
          <h4 style={{ marginBottom: 12 }}>Images Missing Alt Text</h4>
          <ImageList>
            {images.missingAltImages.map((src, index) => (
              <ImageItem key={index}>
                <ImageIcon>🖼️</ImageIcon>
                <ImagePath>{src}</ImagePath>
                <AltStatus missing>Missing Alt</AltStatus>
              </ImageItem>
            ))}
          </ImageList>
        </div>
      )}
    </Container>
  );
}

export default ImageAnalysis;