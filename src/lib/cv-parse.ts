import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult?.text ?? "";
  } catch {
    return "";
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  ext: string
): Promise<string> {
  const lower = ext.toLowerCase();
  if (lower === ".pdf") {
    return parsePdf(buffer);
  }
  if (lower === ".docx" || lower === ".doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return "";
}
