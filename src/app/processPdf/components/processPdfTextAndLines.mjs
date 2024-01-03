import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { PDFExtract } from 'pdf.js-extract';


const pdfExtract = new PDFExtract();


const  processPdfTextAndLines = async (pdfFilePath, rawDocument) => {
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

            const lineData = {
                lineId: uuidv4(),
                lineNumber: cumulativeLineNumber,
                lineText: item.str,
                linePageId: uuidv4(),
                linePageNumber: pageIndex + 1
            };

            pageLines.push(lineData);
            rawDocument.rawDocumentLines.push(lineData);
        });

        const pageData = {
            pageId: uuidv4(),
            pageNumber: pageIndex + 1,
            pageText: pageText,
            pageLineCount: pageLines.length,
            pageLines: pageLines
        };

        rawDocument.rawDocumentPages.push(pageData);
        rawDocument.rawDocumentString += pageText;
    });

    rawDocument.meta.rawDocumentPageCount = data.pages.length;
    rawDocument.meta.rawDocumentSizeBytes = fs.statSync(pdfFilePath).size;
    rawDocument.meta.rawDocumentAllLinesCount = cumulativeLineNumber;

    return rawDocument;
};



export default processPdfTextAndLines;