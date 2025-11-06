// Convert blocks to HTML for email sending
export const blocksToHTML = (blocks) => {
  if (!blocks || blocks.length === 0) {
    return '<p>Empty email</p>';
  }

  const blockHTML = blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `<div style="${stylesToString(block.styles)}">${block.content}</div>`;

      case 'paragraph':
        return `<p style="${stylesToString(block.styles)}">${block.content}</p>`;

      case 'button':
        const buttonAlign = block.styles.textAlign || 'center';
        return `
          <div style="text-align: ${buttonAlign};">
            <a href="${block.link}" style="${stylesToString({...block.styles, textDecoration: 'none', display: 'inline-block'})}">
              ${block.content}
            </a>
          </div>
        `;

      case 'image':
        const imgTag = `<img src="${block.src}" alt="${block.alt}" style="${stylesToString(block.styles)}" />`;
        return block.link
          ? `<div style="text-align: center;"><a href="${block.link}">${imgTag}</a></div>`
          : `<div style="text-align: center;">${imgTag}</div>`;

      case 'divider':
        return `<hr style="border: none; border-top: ${block.styles.borderWidth} solid ${block.styles.borderColor}; margin-top: ${block.styles.marginTop}; margin-bottom: ${block.styles.marginBottom};" />`;

      case 'spacer':
        return `<div style="height: ${block.styles.height};"></div>`;

      case 'columns':
        const colsHTML = block.columns.map(col => 
          `<td style="${stylesToString(col.styles)}">${col.content}</td>`
        ).join('');
        return `
          <table style="width: 100%; margin-top: ${block.styles.marginTop}; margin-bottom: ${block.styles.marginBottom};">
            <tr>${colsHTML}</tr>
          </table>
        `;

      case 'list':
        const listTag = block.listType === 'bullet' ? 'ul' : 'ol';
        const items = block.items.map(item => `<li>${item}</li>`).join('');
        return `<${listTag} style="${stylesToString(block.styles)}">${items}</${listTag}>`;

      default:
        return '';
    }
  }).join('\n');

  // Wrap in email template
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              ${blockHTML}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Convert styles object to CSS string
const stylesToString = (styles) => {
  // Handle null, undefined, or non-object styles
  if (!styles || typeof styles !== 'object') {
    return '';
  }
  
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
};

// HTML to blocks (basic parser for importing)
export const htmlToBlocks = (html) => {
  // This is a simplified parser - can be enhanced later
  const blocks = [];
  
  // For now, just create a single paragraph block with the HTML
  blocks.push({
    id: `block-${Date.now()}`,
    type: 'paragraph',
    content: 'Imported HTML content (editing coming soon)',
    styles: {
      fontSize: '16px',
      color: '#333333',
      textAlign: 'left',
      lineHeight: '1.6',
      marginTop: '10px',
      marginBottom: '10px',
    },
  });

  return blocks;
};
