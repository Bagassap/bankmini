import * as XLSX from "xlsx";

interface ExcelSheet {
  name: string;
  rows: Record<string, string | number>[];
}

export function downloadExcel(sheets: ExcelSheet[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}
