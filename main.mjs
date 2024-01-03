
import {processPdf} from "./src/app/processPdf/processPdf.mjs";
import { parseScript } from "./src/app/parseScript/parseScript.mjs";
import {classifyElements} from "./src/app/classifyElements/classifyElements.mjs";
import {scoreAllScenes, critiqueAllScenes} from "./src/app/scoreElements/scoreAllScenes.mjs";
import {colourizeLog} from "./src/utils/colourizeLog.mjs";

let pdfFilePath = './toParse/bb-small.pdf';


export const mainVein = async () => {

    let rawDocument = await processPdf(pdfFilePath)

    let scriptData = await parseScript(rawDocument)

    await classifyElements(scriptData)
    await scoreAllScenes(scriptData)
    await critiqueAllScenes(scriptData)

    //await colourizeLog(rawDocument)s


};

mainVein();