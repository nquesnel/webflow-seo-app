import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4353ff;
  }
`;

function PageSelector({ onPageSelect }) {
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch pages from Webflow API
    // For now, we'll simulate it
    const fetchPages = async () => {
      try {
        // This would be replaced with actual Webflow API call
        const mockPages = [
          { id: '1', name: 'Home', slug: '/' },
          { id: '2', name: 'About', slug: '/about' },
          { id: '3', name: 'Contact', slug: '/contact' }
        ];
        
        setPages(mockPages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pages:', error);
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const handleChange = (e) => {
    const pageId = e.target.value;
    setSelectedPageId(pageId);
    
    const page = pages.find(p => p.id === pageId);
    onPageSelect(page);
  };

  if (loading) {
    return <div>Loading pages...</div>;
  }

  return (
    <SelectorContainer>
      <Label>Select a page to analyze:</Label>
      <Select value={selectedPageId} onChange={handleChange}>
        <option value="">Choose a page...</option>
        {pages.map(page => (
          <option key={page.id} value={page.id}>
            {page.name} ({page.slug})
          </option>
        ))}
      </Select>
    </SelectorContainer>
  );
}

export default PageSelector;