import React, { useState } from 'react';
import styled from 'styled-components';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4353ff;
  }
`;

const Textarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #4353ff;
  }
`;

const CharCount = styled.span`
  font-size: 12px;
  color: ${props => props.warning ? '#f59e0b' : '#666'};
`;

const IssuesList = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
  font-size: 14px;
  color: #ef4444;
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background: #4353ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    background: #3b48e0;
  }
`;

function MetaTagsEditor({ metaTags, onUpdate }) {
  const [title, setTitle] = useState(metaTags.title.content);
  const [description, setDescription] = useState(metaTags.description.content);

  const handleSave = () => {
    onUpdate({
      title,
      description
    });
  };

  return (
    <EditorContainer>
      <Field>
        <Label>
          Page Title 
          <CharCount warning={title.length < 30 || title.length > 60}>
            ({title.length}/60 characters)
          </CharCount>
        </Label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter page title..."
        />
        {metaTags.title.issues.length > 0 && (
          <IssuesList>
            {metaTags.title.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </IssuesList>
        )}
      </Field>

      <Field>
        <Label>
          Meta Description
          <CharCount warning={description.length < 120 || description.length > 160}>
            ({description.length}/160 characters)
          </CharCount>
        </Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter meta description..."
        />
        {metaTags.description.issues.length > 0 && (
          <IssuesList>
            {metaTags.description.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </IssuesList>
        )}
      </Field>

      <SaveButton onClick={handleSave}>
        Save Changes
      </SaveButton>
    </EditorContainer>
  );
}

export default MetaTagsEditor;