// Purpose: process a pdf file and return a raw document object
import initRawDocument from './components/initRawDocument.mjs';
import processPdfTextAndLines from './components/processPdfTextAndLines.mjs';
import chalk from 'chalk';



export const processPdf = async (pdfFilePath) => {

    console.log(chalk.cyan(`\nProcessing PDF: ${pdfFilePath}`)); 
    let rawDocument = await initRawDocument(pdfFilePath)
    console.log(chalk.dim(`✔︎`))
    console.log(chalk.cyan(`\nParsing PDF Into Object ->`))
    await processPdfTextAndLines (pdfFilePath, rawDocument)
    console.log(chalk.dim(`✔︎`))


    return rawDocument;
};

export default processPdf;
