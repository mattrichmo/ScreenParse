import { v4 as uuidv4 } from 'uuid';
import { parseSceneElements } from './parseSceneElements.mjs';
import chalk from 'chalk';


const sceneHeaderRegex = [
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

/**
 * Initializes the script data structure with default values.
 * This structure includes script ID, scenes data, business-related information, and master elements.
 * @returns {Object} An object representing the initial structure of the script data.
 */
const initScriptData = async () => {
    let scriptData = {
        scriptId: '',
        scenesData: [],
        scriptBusiness: {
            usageData : {
                openaiCalls: [],
                totals: {
                    totalPromptTokens: 0,
                    totalCompletionTokens: 0,
                    totalTokens: 0,
                    totalPromptCost: 0,
                    totalCompletionCost: 0,
                    totalCost: 0,
                }
            }
        },
        masterElements: {
            allElements : [],
            sortedElements : []
        },
    };

    return scriptData;
};

/**
 * Removes unnecessary lines from a given scene, such as common footers, blank lines, continued lines, page numbers, and lines with backslashes.
 * Also logs the count of each type of line removed.
 * @param {Object} scene - The scene object containing scene lines to be processed.
 * @returns {Object} The updated scene object with unnecessary lines removed.
 */
const removeUnnecessaryLines = async (scene) => {
    const commonFooters = [
        'THE END', 'AS BROADCAST', 'FINAL DRAFT', 'SHOOTING SCRIPT', 
        'REVISED FINAL', 'DRAFT COMPLETE', 'END OF SCRIPT', 'SCRIPT CONCLUDED', 
        'COMPLETED DRAFT', 'FINAL VERSION', 'END OF DOCUMENT', 'SCRIPT END', 
        'FINAL EDIT', 'LAST DRAFT', 'END OF FILE', 'CONCLUSION', 
        'NARRATIVE CONCLUSION', 'STORY END', 'FINALE', 'CLOSING REMARKS', 
        'FINAL REMARKS', 'END OF STORY', 'SCRIPT COMPLETION'
    ].flatMap(footer => [
        footer, footer + '/', '/' + footer, '"' + footer + '"', 
        '(' + footer + ')', footer + ' -', '- ' + footer, footer + ':', 
        footer + ';', footer.replace(/ /g, '_'), footer + '...', 
        footer.replace(/ /g, '_') + '/', '/' + footer.replace(/ /g, '_'), 
        '“' + footer + '”', footer + '>>', '<<' + footer, footer + '->', 
        '->' + footer
    ]);   
    let totalCommonFootersRemoved = 0;
    let totalBlankLinesRemoved = 0;
    let totalContinuedLinesRemoved = 0;
    let totalPageNumbersRemoved = 0;
    let totalBackslashLinesRemoved = 0;

    scene.sceneLines = scene.sceneLines.filter(line => {
        const lineText = line.sceneLineText;
        const lineTextUpper = lineText.toUpperCase();
        const isCommonFooter = commonFooters.some(footer => lineTextUpper.includes(footer));
        const isContinuedLine = lineTextUpper.includes('CONTINUED');
        const isPageNumber = /^\d+\.$/.test(lineText);
        const startsWithBackslash = lineText.startsWith('\\');
        const endsWithBackslash = lineText.endsWith('\\');

        if (line.sceneLineType === "whitespace") {
            totalBlankLinesRemoved++;
            return false;
        }
        if (isCommonFooter) {
            totalCommonFootersRemoved++;
            return false;
        }
        if (isContinuedLine) {
            totalContinuedLinesRemoved++;
            return false;
        }
        if (isPageNumber) {
            totalPageNumbersRemoved++;
            return false;
        }
        if (startsWithBackslash && endsWithBackslash) {
            totalBackslashLinesRemoved++;
            return false;
        }
        
        return true;
    });

    const remainingLineTexts = new Set(scene.sceneLines.map(line => line.sceneLineText));

    const totalLinesRemoved = totalCommonFootersRemoved + totalBlankLinesRemoved + totalContinuedLinesRemoved + totalPageNumbersRemoved + totalBackslashLinesRemoved;

    console.log(chalk.dim(`\nScene:`),chalk.yellow(` ${scene.sceneIndex + 1}`));
    console.log(chalk.dim(`Total Lines`), chalk.yellow(` ${scene.sceneLines.length}`));
    console.log(chalk.dim(`Total Garbage Lines Removed From Scene ${scene.sceneIndex + 1}: ${totalLinesRemoved}`));/* 
    if (totalCommonFootersRemoved > 0) console.log(chalk.dim(`Total Footer Lines Removed: ${totalCommonFootersRemoved}`));
    if (totalBlankLinesRemoved > 0) console.log(chalk.dim(`Total blank lines removed: ${totalBlankLinesRemoved}`));
    if (totalContinuedLinesRemoved > 0) console.log(chalk.dim(`Total 'CONTINUED' lines removed: ${totalContinuedLinesRemoved}`));
    if (totalPageNumbersRemoved > 0) console.log(chalk.dim(`Total page number lines removed: ${totalPageNumbersRemoved}`));
    if (totalBackslashLinesRemoved > 0) console.log(chalk.dim(`Total lines with backslashes removed: ${totalBackslashLinesRemoved}`)); */

    return scene;
};

/**
 * Parses the raw lines of a document and groups them into scenes.
 * It identifies scene headers using predefined regex and then processes each scene.
 * Also incorporates parsing and cleaning operations for each scene.
 * @param {Object} rawDocument - Object containing raw lines of the document.
 * @param {Object} scriptData - Script data object to store the parsed scene data.
 * @returns {Object} The updated script data object with parsed scenes included.
 */
export const parseRawScenes = async (rawDocument, scriptData) => {
    let scenesData = [];
    let currentScene = null;
    let sceneIndex = 0;
    let isSceneHeaderFound = false; // Flag to skip the first line after the scene header


    console.log(chalk.dim (`\n------------------------------------------------`))


    for (let i = 0; i < rawDocument.rawDocumentLines.length; i++) {
        const line = rawDocument.rawDocumentLines[i];
        const isSceneHeader = sceneHeaderRegex.some(headerText => line.lineText.startsWith(headerText));

        if (isSceneHeader) {
            if (currentScene) {
                await removeUnnecessaryLines(currentScene); // Clean the scene after parsing
                await parseSceneElements(currentScene, scriptData); 
                scenesData.push(currentScene);
            }
            const newSceneId = uuidv4();
            currentScene = {
                sceneId: newSceneId,
                sceneHeader: line.lineText,
                sceneIndex: sceneIndex++,
                actNum: 0,
                sceneText: line.lineText + '\n',
                sceneLines: [],
            };
            isSceneHeaderFound = true; // Set the flag to skip the next line
        } else if (currentScene) {
            if (!isSceneHeaderFound) {
                currentScene.sceneText += line.lineText + '\n';
                currentScene.sceneLines.push({
                    sceneLineId: line.lineId,
                    sceneLineText: line.lineText,
                    sceneLineType: '',
                    sceneId: currentScene.sceneId, 
                });
            } else {
                // Reset the flag after skipping the first line
                isSceneHeaderFound = false;
            }
        }
    }

    if (currentScene) {
        await removeUnnecessaryLines(currentScene); // Clean the last scene after parsing
        await parseSceneElements(currentScene, scriptData);
        scenesData.push(currentScene);
    }
    console.log(chalk.dim (`\n------------------------------------------------`))


    scriptData.scenesData = scenesData;

    return scriptData;
};



// MAIN --------------------------------------------
/**
 * Main function to parse scenes from a raw document. 
 * Initializes script data and then uses the raw document to parse and store scene data.
 * @param {Object} rawDocument - Object containing raw lines of the document.
 * @returns {Object} Script data object containing parsed scene data.
 */
export const parseScenes = async (rawDocument) => {
    let scriptData = await initScriptData();
    scriptData = await parseRawScenes(rawDocument, scriptData);

    
    
    return scriptData;
};