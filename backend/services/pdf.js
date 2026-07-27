import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function extractPdfText(buffer) {
  const data = await pdf(buffer);
  return data.text;
}
