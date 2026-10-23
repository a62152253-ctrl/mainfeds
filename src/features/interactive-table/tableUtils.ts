import { TableConfig } from './types';

export const generateTableHtml = (config: TableConfig, data: string[][]): string => {
  const borderStyle = config.bordered ? 'border: 1px solid #383838;' : '';
  let html = `<table class="notion-table" style="width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 13px; ${borderStyle}">`;

  if (config.hasHeader && data.length > 0) {
    html += '<thead><tr style="background-color: #262626;">';
    data[0].forEach((cell) => {
      html += `<th style="padding: 8px 12px; text-align: left; border: 1px solid #333; font-weight: 600; color: #f4f4f5;">${cell || 'Nagłówek'}</th>`;
    });
    html += '</tr></thead>';
  }

  html += '<tbody>';
  const startRow = config.hasHeader ? 1 : 0;
  for (let r = startRow; r < data.length; r++) {
    const bg = config.striped && r % 2 === 1 ? 'background-color: #1f1f1f;' : 'background-color: #191919;';
    html += `<tr style="${bg}">`;
    data[r].forEach((cell) => {
      html += `<td style="padding: 8px 12px; border: 1px solid #333; color: #d4d4d8;">${cell || '—'}</td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table><p></p>';

  return html;
};
