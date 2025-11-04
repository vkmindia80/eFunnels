import React from 'react';
import { Type, Image as ImageIcon, Square, Minus, Columns, List } from 'lucide-react';

// Block definitions with metadata
export const BLOCK_TYPES = {
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  BUTTON: 'button',
  IMAGE: 'image',
  DIVIDER: 'divider',
  SPACER: 'spacer',
  COLUMNS: 'columns',
  LIST: 'list',
};

export const BLOCK_LIBRARY = [
  { type: BLOCK_TYPES.HEADING, label: 'Heading', icon: Type, description: 'Add a heading' },
  { type: BLOCK_TYPES.PARAGRAPH, label: 'Paragraph', icon: Type, description: 'Add text content' },
  { type: BLOCK_TYPES.BUTTON, label: 'Button', icon: Square, description: 'Add a CTA button' },
  { type: BLOCK_TYPES.IMAGE, label: 'Image', icon: ImageIcon, description: 'Add an image' },
  { type: BLOCK_TYPES.DIVIDER, label: 'Divider', icon: Minus, description: 'Add a line divider' },
  { type: BLOCK_TYPES.SPACER, label: 'Spacer', icon: Square, description: 'Add vertical spacing' },
  { type: BLOCK_TYPES.COLUMNS, label: 'Columns', icon: Columns, description: 'Add column layout' },
  { type: BLOCK_TYPES.LIST, label: 'List', icon: List, description: 'Add bullet or numbered list' },
];

// Default block configurations
export const createDefaultBlock = (type) => {
  const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const defaults = {
    [BLOCK_TYPES.HEADING]: {
      id,
      type: BLOCK_TYPES.HEADING,
      content: 'Your Heading Here',
      styles: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'left',
        marginTop: '20px',
        marginBottom: '20px',
        fontFamily: 'Arial, sans-serif',
      },
    },
    [BLOCK_TYPES.PARAGRAPH]: {
      id,
      type: BLOCK_TYPES.PARAGRAPH,
      content: 'Your paragraph text goes here. Click to edit.',
      styles: {
        fontSize: '16px',
        color: '#333333',
        textAlign: 'left',
        lineHeight: '1.6',
        marginTop: '10px',
        marginBottom: '10px',
        fontFamily: 'Arial, sans-serif',
      },
    },
    [BLOCK_TYPES.BUTTON]: {
      id,
      type: BLOCK_TYPES.BUTTON,
      content: 'Click Here',
      link: 'https://example.com',
      styles: {
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: '600',
        padding: '12px 24px',
        borderRadius: '6px',
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '20px',
        display: 'inline-block',
      },
    },
    [BLOCK_TYPES.IMAGE]: {
      id,
      type: BLOCK_TYPES.IMAGE,
      src: 'https://via.placeholder.com/600x300',
      alt: 'Image description',
      link: '',
      styles: {
        width: '100%',
        maxWidth: '600px',
        height: 'auto',
        marginTop: '20px',
        marginBottom: '20px',
        borderRadius: '0px',
      },
    },
    [BLOCK_TYPES.DIVIDER]: {
      id,
      type: BLOCK_TYPES.DIVIDER,
      styles: {
        borderColor: '#E5E7EB',
        borderWidth: '1px',
        marginTop: '20px',
        marginBottom: '20px',
      },
    },
    [BLOCK_TYPES.SPACER]: {
      id,
      type: BLOCK_TYPES.SPACER,
      styles: {
        height: '40px',
      },
    },
    [BLOCK_TYPES.COLUMNS]: {
      id,
      type: BLOCK_TYPES.COLUMNS,
      columnCount: 2,
      columns: [
        { content: 'Column 1 content', styles: { padding: '10px' } },
        { content: 'Column 2 content', styles: { padding: '10px' } },
      ],
      styles: {
        marginTop: '20px',
        marginBottom: '20px',
        gap: '20px',
      },
    },
    [BLOCK_TYPES.LIST]: {
      id,
      type: BLOCK_TYPES.LIST,
      listType: 'bullet',
      items: ['List item 1', 'List item 2', 'List item 3'],
      styles: {
        fontSize: '16px',
        color: '#333333',
        lineHeight: '1.8',
        marginTop: '10px',
        marginBottom: '10px',
        paddingLeft: '20px',
      },
    },
  };

  return defaults[type];
};

// Block render components
export const BlockRenderer = ({ block, isSelected, onClick }) => {
  const containerStyle = {
    cursor: 'pointer',
    position: 'relative',
    border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
    borderRadius: '4px',
    padding: '8px',
    transition: 'all 0.2s',
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case BLOCK_TYPES.HEADING:
        return (
          <div style={{ ...block.styles }}>
            {block.content}
          </div>
        );

      case BLOCK_TYPES.PARAGRAPH:
        return (
          <p style={{ ...block.styles, margin: 0 }}>
            {block.content}
          </p>
        );

      case BLOCK_TYPES.BUTTON:
        return (
          <div style={{ textAlign: block.styles.textAlign || 'center' }}>
            <a
              href={block.link}
              style={{
                ...block.styles,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              {block.content}
            </a>
          </div>
        );

      case BLOCK_TYPES.IMAGE:
        return (
          <div style={{ textAlign: 'center' }}>
            {block.link ? (
              <a href={block.link}>
                <img src={block.src} alt={block.alt} style={block.styles} />
              </a>
            ) : (
              <img src={block.src} alt={block.alt} style={block.styles} />
            )}
          </div>
        );

      case BLOCK_TYPES.DIVIDER:
        return (
          <hr
            style={{
              border: 'none',
              borderTop: `${block.styles.borderWidth} solid ${block.styles.borderColor}`,
              marginTop: block.styles.marginTop,
              marginBottom: block.styles.marginBottom,
            }}
          />
        );

      case BLOCK_TYPES.SPACER:
        return <div style={{ height: block.styles.height }} />;

      case BLOCK_TYPES.COLUMNS:
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${block.columnCount}, 1fr)`,
              gap: block.styles.gap,
              marginTop: block.styles.marginTop,
              marginBottom: block.styles.marginBottom,
            }}
          >
            {block.columns.map((col, idx) => (
              <div key={idx} style={col.styles}>
                {col.content}
              </div>
            ))}
          </div>
        );

      case BLOCK_TYPES.LIST:
        const ListTag = block.listType === 'bullet' ? 'ul' : 'ol';
        return (
          <ListTag style={{ ...block.styles, margin: 0 }}>
            {block.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ListTag>
        );

      default:
        return <div>Unknown block type</div>;
    }
  };

  return (
    <div style={containerStyle} onClick={onClick}>
      {renderBlockContent()}
    </div>
  );
};
