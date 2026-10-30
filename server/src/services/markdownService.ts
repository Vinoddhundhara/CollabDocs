interface TipTapMark {
  type: string;
  attrs?: Record<string, any>;
}

interface TipTapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
}

interface TipTapDoc {
  type: 'doc';
  content: TipTapNode[];
}

/**
 * Safely parses inline markdown formatting (bold, italic, code) into TipTap text nodes with marks.
 * Does NOT execute or generate raw HTML.
 */
function parseInlineFormatting(text: string): TipTapNode[] {
  if (!text) {
    return [];
  }

  const nodes: TipTapNode[] = [];
  // Regex to match **bold**, *italic*, and `code`
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        text: text.substring(lastIndex, match.index),
      });
    }

    if (match[2]) {
      // Bold
      nodes.push({
        type: 'text',
        text: match[2],
        marks: [{ type: 'bold' }],
      });
    } else if (match[3]) {
      // Italic
      nodes.push({
        type: 'text',
        text: match[3],
        marks: [{ type: 'italic' }],
      });
    } else if (match[4]) {
      // Code
      nodes.push({
        type: 'text',
        text: match[4],
        marks: [{ type: 'code' }],
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      text: text.substring(lastIndex),
    });
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }];
}

/**
 * Converts Markdown or plain text content into TipTap structured JSON.
 * Preserves Headings (#, ##, ###), Bullet lists (*, -), Ordered lists (1.), Blockquotes (>), and Paragraphs.
 */
export function markdownToTipTapJson(rawContent: string): TipTapDoc {
  if (!rawContent || rawContent.trim() === '') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    };
  }

  const lines = rawContent.split(/\r?\n/);
  const docContent: TipTapNode[] = [];

  let currentList: { type: 'bulletList' | 'orderedList'; items: TipTapNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      docContent.push({
        type: currentList.type,
        content: currentList.items,
      });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings: #, ##, ###, ####, #####, ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(headingMatch[1].length, 3); // TipTap StarterKit supports h1-h3 standardly
      const text = headingMatch[2];
      docContent.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineFormatting(text),
      });
      continue;
    }

    // Blockquote: > text
    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushList();
      docContent.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: parseInlineFormatting(quoteMatch[1]),
          },
        ],
      });
      continue;
    }

    // Bullet List: - item or * item
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'bulletList') {
        flushList();
        currentList = { type: 'bulletList', items: [] };
      }
      currentList.items.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: parseInlineFormatting(bulletMatch[1]),
          },
        ],
      });
      continue;
    }

    // Ordered List: 1. item
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!currentList || currentList.type !== 'orderedList') {
        flushList();
        currentList = { type: 'orderedList', items: [] };
      }
      currentList.items.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: parseInlineFormatting(orderedMatch[1]),
          },
        ],
      });
      continue;
    }

    // Regular Paragraph
    flushList();
    docContent.push({
      type: 'paragraph',
      content: parseInlineFormatting(line),
    });
  }

  flushList();

  if (docContent.length === 0) {
    docContent.push({ type: 'paragraph' });
  }

  return {
    type: 'doc',
    content: docContent,
  };
}

/**
 * Converts TipTap JSON back to Markdown for export purposes.
 */
export function tipTapJsonToMarkdown(doc: any): string {
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return '';
  }

  function renderNodes(nodes: any[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'text') {
          let text = node.text || '';
          if (node.marks) {
            for (const mark of node.marks) {
              if (mark.type === 'bold') text = `**${text}**`;
              if (mark.type === 'italic') text = `*${text}*`;
              if (mark.type === 'code') text = `\`${text}\``;
              if (mark.type === 'underline') text = `<u>${text}</u>`;
            }
          }
          return text;
        }

        if (node.type === 'paragraph') {
          const inner = node.content ? renderNodes(node.content) : '';
          return `${inner}\n\n`;
        }

        if (node.type === 'heading') {
          const level = node.attrs?.level || 1;
          const prefix = '#'.repeat(level);
          const inner = node.content ? renderNodes(node.content) : '';
          return `${prefix} ${inner}\n\n`;
        }

        if (node.type === 'bulletList') {
          return (
            (node.content || [])
              .map((li: any) => `- ${(li.content ? renderNodes(li.content) : '').trim()}`)
              .join('\n') + '\n\n'
          );
        }

        if (node.type === 'orderedList') {
          return (
            (node.content || [])
              .map((li: any, idx: number) => `${idx + 1}. ${(li.content ? renderNodes(li.content) : '').trim()}`)
              .join('\n') + '\n\n'
          );
        }

        if (node.type === 'blockquote') {
          const inner = (node.content ? renderNodes(node.content) : '').trim();
          return `> ${inner}\n\n`;
        }

        if (node.type === 'horizontalRule') {
          return '---\n\n';
        }

        return '';
      })
      .join('');
  }

  return renderNodes(doc.content).trim();
}

