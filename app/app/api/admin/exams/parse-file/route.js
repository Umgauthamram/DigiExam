
import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const PDFParser = require("pdf2json");
            const pdfParser = new PDFParser(null, 1); // 1 = raw text

            text = await new Promise((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    resolve(pdfParser.getRawTextContent());
                });
                pdfParser.parseBuffer(buffer);
            });

        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        return NextResponse.json({ text });

    } catch (error) {
        console.error('File parsing error:', error);
        return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
    }
}
