import { DocBlock, WorkspacePage } from '../types/workspace';

/**
 * Serializuje cały dokument do sformatowanego Markdown wysokiej jakości
 * Obsługuje nagłówki, callouty, listy, tabele, checklisty, obrazy, wideo,
 * kod, cytaty, statystyki, osie czasu oraz bibliografię.
 */
export function serializeDocToMarkdown(page: WorkspacePage | { title: string; icon?: string; blocks: DocBlock[] }): string {
  const parts: string[] = [];
  const headerIcon = page.icon ? `${page.icon} ` : '';
  parts.push(`# ${headerIcon}${page.title || 'Bez tytułu'}\n`);

  for (const block of page.blocks || []) {
    if (block.type === 'ai_prompt' || block.type === 'signature') continue;
    const c = block.content?.trim() || '';

    switch (block.type) {
      case 'h1':
        if (c && c.toLowerCase() !== (page.title || '').trim().toLowerCase()) {
          parts.push(`\n# ${c}\n`);
        }
        break;
      case 'h2':
        parts.push(`\n## ${c}\n`);
        break;
      case 'h3':
        parts.push(`\n### ${c}\n`);
        break;
      case 'h4':
      case 'h5':
      case 'h6':
        parts.push(`\n#### ${c}\n`);
        break;
      case 'lead':
        parts.push(`\n> **Wstęp:** *${c}*\n`);
        break;
      case 'subtext':
        parts.push(`\n<small>${c}</small>\n`);
        break;
      case 'quote':
        parts.push(`\n> ${c.replace(/\n/g, '\n> ')}\n`);
        break;
      case 'bullet':
        parts.push(`- ${c}`);
        break;
      case 'number':
        parts.push(`1. ${c}`);
        break;
      case 'todo':
        parts.push(`- [${block.checked ? 'x' : ' '}] ${c}`);
        break;
      case 'toggle':
      case 'numbered_toggle':
        parts.push(`\n<details><summary><strong>${c}</strong></summary>\n\n${block.toggleDetails || ''}\n</details>\n`);
        break;
      case 'callout':
      case 'callout_info':
      case 'callout_tip':
      case 'callout_warning':
      case 'callout_danger':
      case 'callout_success':
        parts.push(`\n> ℹ️ **[${block.calloutType?.toUpperCase() || 'INFO'}]**\n> ${c.replace(/\n/g, '\n> ')}\n`);
        break;
      case 'key_takeaway':
        parts.push(`\n> 💡 **Kluczowy wniosek:**\n> ${c.replace(/\n/g, '\n> ')}\n`);
        break;
      case 'code':
        parts.push(`\n\`\`\`${block.language || 'typescript'}\n${c}\n\`\`\`\n`);
        break;
      case 'image':
        if (block.imageUrl) {
          parts.push(`\n![${block.imageCaption || c || 'Ilustracja'}](${block.imageUrl})\n*${block.imageCaption || ''}*\n`);
        }
        break;
      case 'video':
        if (block.videoUrl) {
          parts.push(`\n🎥 **Wideo edukacyjne:** [${c || 'Obejrzyj materiał wideo'}](${block.videoUrl})\n`);
        }
        break;
      case 'table':
        if (block.tableData && block.tableData.length > 0) {
          const header = block.tableData[0];
          parts.push(`\n| ${header.join(' | ')} |`);
          parts.push(`| ${header.map(() => '---').join(' | ')} |`);
          for (let i = 1; i < block.tableData.length; i++) {
            parts.push(`| ${block.tableData[i].join(' | ')} |`);
          }
          parts.push('');
        } else if (c) {
          parts.push(`\n${c}\n`);
        }
        break;
      case 'stat':
      case 'stat_grid':
        parts.push(`\n📊 **Wskaźnik KPI:** ${c} — **${block.statValue || ''}** (${block.statTrend || ''})\n`);
        break;
      case 'timeline':
        parts.push(`\n⏱️ **[${block.timelineDate || 'Data'}]** ${c}`);
        break;
      case 'faq':
        if (block.faqItems && block.faqItems.length > 0) {
          parts.push(`\n### Najczęściej zadawane pytania (FAQ)`);
          block.faqItems.forEach((f) => {
            parts.push(`- **Q: ${f.question}**\n  - A: ${f.answer}`);
          });
          parts.push('');
        }
        break;
      case 'bookmark':
        parts.push(`\n🔗 [${block.bookmarkTitle || c || 'Odnośnik'}](${block.bookmarkUrl || '#'})\n*${block.bookmarkDesc || ''}*`);
        break;
      case 'divider':
        parts.push(`\n---\n`);
        break;
      default:
        if (c) parts.push(c);
        break;
    }
  }

  return parts.join('\n');
}

/**
 * Serializuje cały dokument do czystego HTML z zachowaniem stylów inline
 */
export function serializeDocToHtml(page: WorkspacePage | { title: string; icon?: string; blocks: DocBlock[] }): string {
  let html = `<div class="searchpoint-exported-note" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #37352f; max-width: 800px; margin: 0 auto; padding: 20px;">`;
  html += `<h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem;">${page.icon || ''} ${page.title || 'Notatka'}</h1>`;

  for (const block of page.blocks || []) {
    const c = block.content || '';
    switch (block.type) {
      case 'h1':
        html += `<h1 style="font-size: 1.75rem; font-weight: 700; margin-top: 1.5rem;">${c}</h1>`;
        break;
      case 'h2':
        html += `<h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 1.25rem;">${c}</h2>`;
        break;
      case 'h3':
        html += `<h3 style="font-size: 1.15rem; font-weight: 600; margin-top: 1rem;">${c}</h3>`;
        break;
      case 'lead':
        html += `<p style="font-size: 1.1rem; color: #475569; font-style: italic;">${c}</p>`;
        break;
      case 'quote':
        html += `<blockquote style="border-left: 3px solid #cbd5e1; padding-left: 1rem; margin: 1rem 0; color: #475569; font-style: italic;">${c}</blockquote>`;
        break;
      case 'bullet':
        html += `<ul style="margin: 0.25rem 0 0.25rem 1.5rem;"><li>${c}</li></ul>`;
        break;
      case 'number':
        html += `<ol style="margin: 0.25rem 0 0.25rem 1.5rem;"><li>${c}</li></ol>`;
        break;
      case 'todo':
        html += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" ${block.checked ? 'checked' : ''} disabled /> <span>${c}</span></div>`;
        break;
      case 'callout':
      case 'callout_info':
      case 'callout_tip':
      case 'callout_warning':
      case 'callout_danger':
      case 'callout_success':
        html += `<div style="background: #f8fafc; border-left: 4px solid #2383e2; padding: 12px 16px; border-radius: 6px; margin: 12px 0;"><strong>${block.calloutType?.toUpperCase() || 'INFO'}:</strong> ${c.replace(/\n/g, '<br/>')}</div>`;
        break;
      case 'key_takeaway':
        html += `<div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 12px 0;"><strong>💡 Kluczowy wniosek:</strong> ${c.replace(/\n/g, '<br/>')}</div>`;
        break;
      case 'code':
        html += `<pre style="background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 6px; overflow-x: auto;"><code>${c}</code></pre>`;
        break;
      case 'image':
        if (block.imageUrl) {
          html += `<figure style="margin: 16px 0; text-align: center;"><img src="${block.imageUrl}" alt="${block.imageCaption || ''}" style="max-width: 100%; border-radius: 8px;" /><figcaption style="font-size: 0.85rem; color: #64748b; margin-top: 6px;">${block.imageCaption || ''}</figcaption></figure>`;
        }
        break;
      case 'video':
        if (block.videoUrl) {
          html += `<div style="margin: 16px 0; padding: 12px; background: #f1f5f9; border-radius: 8px;">🎥 <strong>Wideo edukacyjne:</strong> <a href="${block.videoUrl}" target="_blank" rel="noopener noreferrer">${c || block.videoUrl}</a></div>`;
        }
        break;
      case 'table':
        if (block.tableData && block.tableData.length > 0) {
          html += `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem;">`;
          block.tableData.forEach((row, rIdx) => {
            html += `<tr style="${rIdx === 0 ? 'background: #f8fafc; font-weight: bold;' : 'border-bottom: 1px solid #e2e8f0;'}">`;
            row.forEach((cell) => {
              html += `<td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${cell}</td>`;
            });
            html += `</tr>`;
          });
          html += `</table>`;
        }
        break;
      case 'bookmark':
        html += `<div style="margin: 8px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;"><a href="${block.bookmarkUrl || '#'}" target="_blank" style="font-weight: 600; color: #2383e2; text-decoration: none;">${block.bookmarkTitle || c}</a><div style="font-size: 0.8rem; color: #64748b;">${block.bookmarkDesc || ''}</div></div>`;
        break;
      case 'divider':
        html += `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />`;
        break;
      default:
        if (c) html += `<p style="margin: 8px 0;">${c}</p>`;
        break;
    }
  }

  html += `</div>`;
  return html;
}

/**
 * Kopiuje całą notatkę do schowka systemowego w formatach HTML oraz Markdown/czysty tekst
 */
export async function copyFullNoteToClipboard(
  page: WorkspacePage | { title: string; icon?: string; blocks: DocBlock[] }
): Promise<boolean> {
  const md = serializeDocToMarkdown(page);
  const html = serializeDocToHtml(page);

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const textBlob = new Blob([md], { type: 'text/plain' });
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem API fallback to writeText:', err);
  }

  try {
    await navigator.clipboard.writeText(md);
    return true;
  } catch (err) {
    console.error('Błąd kopiowania całej notatki:', err);
    return false;
  }
}
