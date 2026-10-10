export interface ExcelSummaryItem {
  label: string;
  value: string | number;
}

export interface ExcelTableColumn {
  header: string;
  align?: "left" | "center" | "right" | string;
  width?: number;
}

export interface ExcelSection {
  title?: string;
  columns?: (string | ExcelTableColumn)[];
  rows?: (string | number)[][];
  footer?: (string | number)[];
  summaryItems?: ExcelSummaryItem[];
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  title: string;
  subtitle?: string;
  sections: ExcelSection[];
  headerBgColor?: string; // Default #15803d (Green)
}

export function exportToExcel(options: ExcelExportOptions) {
  const {
    filename,
    sheetName = "Laporan",
    title,
    subtitle,
    sections,
    headerBgColor = "#15803d",
  } = options;

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${sheetName}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
      .doc-title { font-size: 16pt; font-weight: bold; color: #ffffff; background-color: ${headerBgColor}; text-align: center; vertical-align: middle; padding: 14px; }
      .doc-subtitle { font-size: 10pt; color: #374151; background-color: #f3f4f6; text-align: center; vertical-align: middle; padding: 6px; border: 1px solid #d1d5db; }
      .section-header { font-size: 11pt; font-weight: bold; color: #111827; background-color: #e5e7eb; border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
      .th-cell { font-size: 10pt; font-weight: bold; color: #ffffff; background-color: ${headerBgColor}; border: 1px solid #111827; padding: 8px 12px; text-align: center; }
      .td-cell { font-size: 10pt; border: 1px solid #d1d5db; padding: 7px 10px; vertical-align: middle; }
      .td-alt { background-color: #f9fafb; }
      .td-footer { font-size: 10pt; font-weight: bold; background-color: #f3f4f6; border-top: 2px solid #374151; border-bottom: 2px solid #374151; border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; padding: 8px 10px; }
      .summary-label { font-size: 10pt; color: #374151; font-weight: 600; background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 7px 10px; width: 35%; }
      .summary-val { font-size: 10pt; color: #111827; font-weight: bold; border: 1px solid #d1d5db; padding: 7px 10px; text-align: right; width: 65%; }
      .text-left { text-align: left; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .spacer { height: 12px; }
    </style>
  </head>
  <body>
  `;

  // Find max columns count to span headers
  let maxCols = 1;
  sections.forEach((s) => {
    if (s.columns?.length) maxCols = Math.max(maxCols, s.columns.length);
    if (s.rows?.[0]?.length) maxCols = Math.max(maxCols, s.rows[0].length);
  });

  // Main header banner
  html += `
    <table>
      <tr>
        <td class="doc-title" colSpan="${maxCols}">${title}</td>
      </tr>
      ${subtitle ? `<tr><td class="doc-subtitle" colSpan="${maxCols}">${subtitle}</td></tr>` : ""}
    </table>
    <div class="spacer"></div>
  `;

  sections.forEach((section) => {
    // Section title
    if (section.title) {
      const sectionCols = section.columns?.length || (section.rows?.[0]?.length) || maxCols;
      html += `
        <table>
          <tr>
            <td class="section-header" colSpan="${sectionCols}">${section.title}</td>
          </tr>
        </table>
      `;
    }

    // Summary Items (Grid cards style in 2 columns)
    if (section.summaryItems && section.summaryItems.length > 0) {
      html += `<table>`;
      for (let i = 0; i < section.summaryItems.length; i += 2) {
        const item1 = section.summaryItems[i];
        const item2 = section.summaryItems[i + 1];
        html += `<tr>`;
        html += `<td class="summary-label">${item1.label}</td><td class="summary-val">${item1.value}</td>`;
        if (item2) {
          html += `<td style="width: 16px; border: none;"></td><td class="summary-label">${item2.label}</td><td class="summary-val">${item2.value}</td>`;
        } else {
          html += `<td style="width: 16px; border: none;"></td><td style="border: none;"></td><td style="border: none;"></td>`;
        }
        html += `</tr>`;
      }
      html += `</table><div class="spacer"></div>`;
    }

    // Data table
    if (section.columns && section.columns.length > 0) {
      const cols: ExcelTableColumn[] = section.columns.map((c) =>
        typeof c === "string" ? { header: c, align: "left" } : c
      );

      html += `<table><thead><tr>`;
      cols.forEach((col) => {
        const alignClass = col.align ? `text-${col.align}` : "text-center";
        html += `<th class="th-cell ${alignClass}">${col.header}</th>`;
      });
      html += `</tr></thead><tbody>`;

      if (section.rows && section.rows.length > 0) {
        section.rows.forEach((row, rIdx) => {
          const rowClass = rIdx % 2 === 1 ? "td-alt" : "";
          html += `<tr>`;
          row.forEach((cell, cIdx) => {
            const colConfig = cols[cIdx];
            let alignClass = colConfig?.align ? `text-${colConfig.align}` : "text-left";

            // Default alignment heuristics if not specified
            if (!colConfig?.align) {
              if (
                typeof cell === "number" ||
                (typeof cell === "string" && (cell.startsWith("Rp") || /^[\d.,]+$/.test(cell)))
              ) {
                alignClass = "text-right";
              }
            }

            html += `<td class="td-cell ${rowClass} ${alignClass}">${cell !== null && cell !== undefined ? String(cell) : ""}</td>`;
          });
          html += `</tr>`;
        });
      } else {
        html += `<tr><td class="td-cell text-center" colSpan="${cols.length}">Tidak ada data</td></tr>`;
      }

      // Footer row
      if (section.footer && section.footer.length > 0) {
        html += `<tfoot><tr>`;
        section.footer.forEach((cell, cIdx) => {
          const colConfig = cols[cIdx];
          let alignClass = colConfig?.align ? `text-${colConfig.align}` : "text-left";
          if (
            !colConfig?.align &&
            (typeof cell === "number" ||
              (typeof cell === "string" && (cell.startsWith("Rp") || /^[\d.,]+$/.test(cell))))
          ) {
            alignClass = "text-right";
          }
          html += `<td class="td-footer ${alignClass}">${cell !== null && cell !== undefined ? String(cell) : ""}</td>`;
        });
        html += `</tr></tfoot>`;
      }

      html += `</tbody></table><div class="spacer"></div>`;
    }
  });

  html += `</body></html>`;

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
