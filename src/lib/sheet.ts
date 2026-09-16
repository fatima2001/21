import * as XLSX from "xlsx";

export type SheetData = {
  columns: string[];
  rows: Record<string, string>[];
};

/** قراءة ملف Excel أو CSV داخل المتصفح — لا يُرسل الملف إلى أي خادم. */
export async function readSheet(file: File): Promise<SheetData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) return { columns: [], rows: [] };

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const rows = raw
    .map((row) => {
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        clean[String(key).trim()] = String(value ?? "").trim();
      }
      return clean;
    })
    .filter((row) => Object.values(row).some((v) => v !== ""));

  const columns = rows[0] ? Object.keys(rows[0]) : [];
  return { columns, rows };
}
