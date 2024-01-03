import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { PDFExtract } from 'pdf.js-extract';
import { get } from 'http';

const pdfExtract = new PDFExtract();
let pdfFilePath = './toParse/bb.pdf';

// Regular expressions for various text patterns
const allCapsRegex = /^[A-Z\s\(\)]+$/;
const mixedCapsRegex = /[A-Z][a-z]|[a-z][A-Z]/;
const parenthesisRegex = /\(.*?\)/;
const dayRegex = /(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:of)?\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(?:\d{2,4})?/i;
const monthRegex = /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(?:\d{2,4})?/i;
const yearRegex = /\b\d{2,4}\b/i;
const actBoundaryRegex = /^(END OF ACT (ONE|TWO|THREE|FOUR|FIVE|SIX)|END ACT (ONE|TWO|THREE|FOUR|FIVE|SIX)|ACT (ONE|TWO|THREE|FOUR|FIVE|SIX) (START|BEGINS)|ACT (ONE|TWO|THREE|FOUR|FIVE|SIX))$/i;

async function getPdfTextAndLines() {
    const options = {};
    const data = await pdfExtract.extract(pdfFilePath, options);
    const rawLines = [];

    data.pages.forEach(page => {
        page.content.forEach((item, index) => {
            let lineObj = {
                lineText: item.str,
                lineNum: index,
                lineId: uuidv4(),
                linePage: page.pageInfo.num,
                lineX: item.x,
                lineY: item.y,
                lineProperties: {
                    lineFontName: item.fontName,
                    lineFontSize: item.height,
                    lineAlignment: '',
                    lineBold: item.fontName.includes('Bold'),
                    lineItalic: item.fontName.includes('Italic'),
                    lineAllCaps: allCapsRegex.test(item.str.replace(/[^A-Z\s\(\)]/g, '')),
                    lineParenthesis: parenthesisRegex.test(item.str),
                    lineAllCapsParenthesis: parenthesisRegex.test(item.str) && allCapsRegex.test(item.str.match(parenthesisRegex)[0].replace(/[^A-Z\s\(\)]/g, '')),
                    lineIsDate: dayRegex.test(item.str) || monthRegex.test(item.str) || yearRegex.test(item.str),
                    comingledCaps: mixedCapsRegex.test(item.str),
                    lineNoCaps: !/[A-Z]/.test(item.str),
                    lineActBoundary: null // Will be set below based on regex match
                }
            };

            // Determine line alignment based on `x` position
            const centerX = item.x + (item.width / 2);
            const pageWidth = page.pageInfo.width;
            if (centerX < pageWidth * 0.3) {
                lineObj.lineProperties.lineAlignment = 'left';
            } else if (centerX > pageWidth * 0.7) {
                lineObj.lineProperties.lineAlignment = 'right';
            } else {
                lineObj.lineProperties.lineAlignment = 'center';
            }

            // Determine if the line is an act boundary
            const cleanedLineText = item.str.replace(/\s+/g, ' ').trim();
            if (actBoundaryRegex.test(cleanedLineText)) {
                if (cleanedLineText.toUpperCase().includes('END')) {
                    lineObj.lineProperties.lineActBoundary = 'actEnd';
                } else if (cleanedLineText.toUpperCase().includes('START') || cleanedLineText.toUpperCase().includes('BEGINS')) {
                    lineObj.lineProperties.lineActBoundary = 'actStart';
                } else {
                    lineObj.lineProperties.lineActBoundary = 'actStart';
                }
            }

            rawLines.push(lineObj);
        });
    });

    console.log(JSON.stringify(rawLines, null, 2));
}

getPdfTextAndLines();
