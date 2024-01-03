import { v4 as uuidv4 } from 'uuid';


const initRawDocument= async (pdfFilePath) => {
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

export default initRawDocument;

