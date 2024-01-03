import { PDFExtract } from 'pdf.js-extract';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const pdfExtract = new PDFExtract();

async function getPdfTextAndLines(pdfFilePath, rawDocument) {
    const options = {}; // Add any specific options if needed
    const data = await pdfExtract.extract(pdfFilePath, options);

    // Reset or initialize the arrays for pages and lines
    rawDocument.rawDocumentPages = [];
    rawDocument.rawDocumentLines = [];
    rawDocument.rawDocumentString = '';

    let cumulativeLineNumber = 0;

    data.pages.forEach((page, pageIndex) => {
        let pageText = '';
        const pageLines = [];

        page.content.forEach(item => {
            // Assuming 'x' and 'y' are the coordinates, you can add conditions to filter out margin notes
            // Example: if (item.x > marginThreshold) { ... }

            cumulativeLineNumber += 1;
            pageText += item.str + '\n';

            pageLines.push({
                lineId: uuidv4(),
                lineNumber: cumulativeLineNumber,
                lineText: item.str,
                linePageId: uuidv4(),
                linePageNumber: pageIndex + 1
            });

            rawDocument.rawDocumentLines.push(pageLines[pageLines.length - 1]);
        });

        rawDocument.rawDocumentPages.push({
            pageId: uuidv4(),
            pageNumber: pageIndex + 1,
            pageText: pageText,
            pageLineCount: pageLines.length,
            pageLines: pageLines
        });

        rawDocument.rawDocumentString += pageText;
    });

    rawDocument.meta.rawDocumentPageCount = data.pages.length;
    rawDocument.meta.rawDocumentSizeBytes = fs.statSync(pdfFilePath).size;
    rawDocument.meta.rawDocumentAllLinesCount = cumulativeLineNumber;

    return rawDocument;
}

async function initRawDocument(pdfFilePath) {
    let rawDocument = {
        meta: {
            rawDocumentId: uuidv4(),
            url: pdfFilePath,
            rawDocumentType: '',
            rawDocumentName: '',
            rawDocumentSizeBytes: 0,
            rawDocumentPageCount: 0,
            rawDocumentAllLinesCount: 0,
        },
        rawDocumentPages: [],
        rawDocumentLines: [],
        rawDocumentString: '',
    };
    return rawDocument;
}

export const processPDF = async (pdfFilePath) => {
    let rawDocument = await initRawDocument(pdfFilePath);
    await getPdfTextAndLines(pdfFilePath, rawDocument);

    return rawDocument;
}
