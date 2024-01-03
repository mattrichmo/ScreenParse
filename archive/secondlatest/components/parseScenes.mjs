import { v4 as uuidv4 } from 'uuid';

let parsedScenes = [{
    sceneId: `uuid`,
    sceneHeader: ``,
    sceneIndex: 0,
    sceneDocNum: 0,
    sceneText: ``,
    scenelines: [{
        sceneLineId: ``,
        sceneLineText: ``,
    }],
    elements: [],
    responseSchema: {},
}];

const sceneHeaderText = [
    `INT.`, `EXT.`, 
    `INT./EXT.`, `EXT./INT.`, 
    `INT/EXT`, `EXT/INT`,
    `I/E`, `E/I`,
    `INT`, `EXT`, 
    `INTERIOR`, `EXTERIOR`,
    `INSIDE`, `OUTSIDE`,
    `INT. -`, `EXT. -`,
    `INTERIOR.`, `EXTERIOR.`,
    `INSIDE.`, `OUTSIDE.`,
    `INT-`, `EXT-`,
    `INTERIOR-`, `EXTERIOR-`,
    `INSIDE-`, `OUTSIDE-`,
    `INT:`, `EXT:`,
    `INTERIOR:`, `EXTERIOR:`,
    `INSIDE:`, `OUTSIDE:`,
    `INT -`, `EXT -`,
    `INTERIOR -`, `EXTERIOR -`,
    `INSIDE -`, `OUTSIDE -`,
    `INT :`, `EXT :`,
    `INTERIOR :`, `EXTERIOR :`,
    `INSIDE :`, `OUTSIDE :`,
    `INT./EXT-`, `EXT./INT-`,
    `INT/EXT-`, `EXT/INT-`,
    `I/E-`, `E/I-`,
    `INT./EXT:`, `EXT./INT:`,
    `INT/EXT:`, `EXT/INT:`,
    `I/E:`, `E/I:`,
    `INT./EXT -`, `EXT./INT -`,
    `INT/EXT -`, `EXT/INT -`,
    `I/E -`, `E/I -`,
    `INT./EXT :`, `EXT./INT :`,
    `INT/EXT :`, `EXT/INT :`,
    `I/E :`, `E/I :`
];

export const parseRawScenes = (rawDocument) => {
    let parsedScenes = [];
    let currentScene = null;
    let sceneIndex = 0;

    for (let i = 0; i < rawDocument.rawDocumentLines.length; i++) {
        const line = rawDocument.rawDocumentLines[i];
        const isSceneHeader = sceneHeaderText.some(headerText => line.lineText.startsWith(headerText));
        
        if (isSceneHeader) {
            if (currentScene) {
                parsedScenes.push(currentScene);
            }

            currentScene = {
                sceneId: uuidv4(),
                sceneHeader: line.lineText,
                sceneIndex: sceneIndex++,
                sceneDocNum: null,
                sceneText: line.lineText + '\n',
                scenelines: [{
                    sceneLineId: line.lineId,
                    sceneLineText: line.lineText,
                }],
                elements: [],
            };

            // Check for sceneDocNum in subsequent lines
            const nextLine = rawDocument.rawDocumentLines[i + 1];
            const lineAfterNext = rawDocument.rawDocumentLines[i + 2];
            if (nextLine && !isNaN(nextLine.lineText.trim())) {
                currentScene.sceneDocNum = nextLine.lineText.trim();

                // Check and skip the next two lines if conditions are met
                if (lineAfterNext && lineAfterNext.lineText.trim() === "" && 
                    rawDocument.rawDocumentLines[i + 3] &&
                    rawDocument.rawDocumentLines[i + 3].lineText.trim() === currentScene.sceneDocNum) {
                    i += 3; // Skip the next three lines
                } else {
                    i++; // Skip only the next line
                }
            }
        } else if (currentScene) {
            currentScene.sceneText += line.lineText + '\n';
            currentScene.scenelines.push({
                sceneLineId: line.lineId,
                sceneLineText: line.lineText,
            });
        }
    }

    if (currentScene) {
        parsedScenes.push(currentScene);
    }

    return parsedScenes;
};





