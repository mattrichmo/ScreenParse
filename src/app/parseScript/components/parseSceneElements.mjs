import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';


/**
 * @param {string} masterElementId - Unique identifier for the master element.
 * @param {string} elementSceneId - The ID of the element.
 * @param {string} sceneId - The ID of the scene.
 * @param {string} elementText - The text of the element.
 * @param {string} elementClass - The class of the element.
 * @param {string} elementLineId - The ID of the element line.
 * @param {number} sceneLineNum - The number of the scene line.
 * @param {string} sceneLineText - The text of the scene line.
 */

// Sample elements array
let elements = [{
    masterElementId: '',
    elementSceneId: '',
    sceneId: '',
    elementText: '',
    elementClass: '',
    elementLines:[{
        elementLineId: '',
        sceneLineNum: 0,
        sceneLineText: '',
    }]
}];

/**
 * Parameters for masterElements array
 * @param {string} masterElementId - Unique identifier for the master element.
 * @param {string} elementText - The text of the element.
 * @param {string} elementClass - The class/category of the element.
 * @param {Array} sceneAppearances - Array of scenes in which the element appears.
 * @param {string} sceneAppearances.sceneId - The ID of the scene.
 * @param {number} sceneAppearances.sceneNum - The number/index of the scene.
 * @param {Array} sceneAppearances.sceneLineAppearances - Array of line appearances in the scene.
 * @param {string} sceneAppearances.sceneLineAppearances.lineId - The ID of the line where the element appears.
 * @param {number} sceneAppearances.sceneLineAppearances.lineNum - The number/index of the line in the scene.
 * @param {string} sceneAppearances.sceneLineAppearances.lineText - The text of the line where the element appears.
 */

// Sample masterElements array

let masterElements = {
    allElements : [{
        masterElementId: '',
        elementText: '',
        elementClass: '',
        sceneAppearences: [{
            sceneId: '',
            sceneNum: 0,
            sceneLineAppearences: [{
                lineId: '',
                lineNum: 0,
                lineText: '',
            }],
        }],
    }],
};

/**
 * Helper function to add or update elements in both scene and master elements.
 * @param {Object} scriptData - The script data containing master elements.
 * @param {Object} scene - The current scene being processed.
 * @param {Object} line - The current line from the scene.
 * @param {string} match - The matched element text.
 * @param {number} index - The index of the line in the scene.
 */
const addOrUpdateElement = (scriptData, scene, line, match, index, elementMatchType) => {
    // Clean up the match to remove newline characters
    const cleanedMatch = match.replace(/\n/g, ' ').trim();

    let existingElement = scriptData.masterElements.allElements.find(element => element.elementText === cleanedMatch);

    if (existingElement) {
        // Element exists in masterElements, update its sceneAppearances
        let existingSceneAppearance = existingElement.sceneAppearances.find(appearance => appearance.sceneId === scene.sceneId);
        if (!existingSceneAppearance) {
            existingElement.sceneAppearances.push({
                sceneId: scene.sceneId,
                sceneNum: scene.sceneIndex,
                sceneLineAppearances: []
            });
            existingSceneAppearance = existingElement.sceneAppearances[existingElement.sceneAppearances.length - 1];
        }
        existingSceneAppearance.sceneLineAppearances.push({
            lineId: line.sceneLineId,
            lineNum: index,
            lineText: line.sceneLineText,
            lineClass: ``
        });
    } else {
        // Create a new element and add to masterElements
        existingElement = {
            masterElementId: uuidv4(),
            elementText: cleanedMatch,
            elementClass: '',
            elementMatchType: elementMatchType, // New property
            sceneAppearances: [{
                sceneId: scene.sceneId,
                sceneNum: scene.sceneIndex,
                sceneLineAppearances: [{
                    lineId: line.sceneLineId,
                    lineNum: index,
                    lineText: line.sceneLineText,
                    lineClass: ``
                }]
            }]
        };
        scriptData.masterElements.allElements.push(existingElement);
    }

    // Add element to scene.elements
    scene.elements.push({
        masterElementId: existingElement.masterElementId,
        elementSceneId: uuidv4(),
        sceneId: scene.sceneId,
        elementText: cleanedMatch,
        elementClass: existingElement.elementClass,
        elementMatchType: elementMatchType, // New property
        elementLines: [{
            elementLineId: line.sceneLineId,
            sceneLineNum: index,
            sceneLineText: line.sceneLineText
        }]
    });
};

/**
 * Sets the scene line type based on the content of the line.
 * @param {string} lineText - The text of the scene line.
 * @returns {string} The type of the scene line.
 */
const setSceneLineType = (lineText) => {
    const elementRegex = /\b[A-Z]{2,}\b/g; // Regex to identify potential elements (uppercase words)
    const parenthesisRegex = /^\([^\)]+\)$/; // Regex to match parenthesis on its own line
    const allWords = lineText.trim().split(/\s+/);
    const elements = lineText.match(elementRegex) || [];

    if (parenthesisRegex.test(lineText)) {
        return 'parenthesisElement';
    } else if (elements.length === 1 && allWords.length === 1) {
        return 'singleElement';
    } else if (elements.length > 1) {
        return 'multiElement';
    } else if (elements.length === 1 && allWords.length > 1) {
        return 'contextElement';
    } else {
        return 'noElement';
    }
};

/**
 * Processes multiline elements in the script.
 * @param {Object} sceneLine - The current line from the scene.
 * @param {number} index - The index of the line in the scene.
 * @param {Object} multilineElementData - Data structure to track multiline element processing.
 * @param {Object} scriptData - The script data containing master elements.
 * @param {Object} scene - The current scene being processed.
 * @returns {Object} Updated multilineElementData.
 */
const processMultilineElement = (sceneLine, index, multilineElementData, scriptData, scene) => {
    const openMultilineRegex = /^\($/;
    const closeMultilineRegex = /^\)$/;
    let { isMultiline, multilineText, multilineStartIndex, multilineElementLines } = multilineElementData;

    if (openMultilineRegex.test(sceneLine.sceneLineText)) {
        isMultiline = true;
        multilineStartIndex = index;
        multilineText = sceneLine.sceneLineText;
        multilineElementLines.push(createElementLine(sceneLine, index));
        return { isMultiline, multilineText, multilineStartIndex, multilineElementLines };
    }

    if (isMultiline) {
        multilineText += '\n' + sceneLine.sceneLineText;
        multilineElementLines.push(createElementLine(sceneLine, index));
        sceneLine.sceneLineType = 'multiLineElement';

        if (closeMultilineRegex.test(sceneLine.sceneLineText)) {
            isMultiline = false;
            addOrUpdateElement(scriptData, scene, sceneLine, multilineText, multilineStartIndex, 'multiLineItem', true, multilineElementLines);
            multilineElementLines = [];
        }
    }

    return { isMultiline, multilineText, multilineStartIndex, multilineElementLines };
};
/**
 * Creates an element line object for the elements array.
 * @param {Object} sceneLine - The current line from the scene.
 * @param {number} index - The index of the line in the scene.
 * @returns {Object} Element line object.
 */
const createElementLine = (sceneLine, index) => {
    return {
        elementLineId: sceneLine.sceneLineId,
        sceneLineNum: index,
        sceneLineText: sceneLine.sceneLineText
    };
};

/**
 * Processes regular elements (single, multi, context, etc.) in the script.
 * @param {Object} sceneLine - The current line from the scene.
 * @param {number} index - The index of the line in the scene.
 * @param {Object} scriptData - The script data containing master elements.
 * @param {Object} scene - The current scene being processed.
 */
const processRegularElements = (sceneLine, index, scriptData, scene) => {
    const parentheticalElementRegex = /\([A-Za-z\s]+\)/g;
    const capitalWordsRegex = /\b[A-Z]{2,}\b/g;

    let matches = [];

    // Check for parenthetical elements
    let parentheticalMatches = sceneLine.sceneLineText.match(parentheticalElementRegex);
    if (parentheticalMatches) {
        matches.push(...parentheticalMatches.map(match => ({ match, type: 'parentheticalItem' })));
    }

    // Check for capitalized words
    let capitalMatches = sceneLine.sceneLineText.match(capitalWordsRegex);
    if (capitalMatches) {
        // Group consecutive capitalized words as a single element
        let groupedMatches = sceneLine.sceneLineText.match(/\b([A-Z]{2,}\s*)+/g);
        groupedMatches.forEach(match => {
            let elementMatchType = 'multiItem';
            matches.push({ match: match.trim(), type: elementMatchType });
        });
    }

    // Add/update element if a match is found
    matches.forEach(({ match, type }) => {
        addOrUpdateElement(scriptData, scene, sceneLine, match, index, type);
    });

    // Set the scene line type
    sceneLine.sceneLineType = setSceneLineType(sceneLine.sceneLineText);
};




/**
 * Parses scene elements and updates the script data with master elements.
 * Additionally, logs the number of elements, unique elements, and each unique element's text in each scene.
 * @param {Object} scene - The scene to parse.
 * @param {Object} scriptData - The script data containing master elements.
 * @returns {Object} The updated scene.
 */
export const parseSceneElements = async (scene, scriptData) => {
    scene.elements = [];
    scene.sceneLines = scene.sceneLines.filter(line => line.sceneLineText && line.sceneLineText.trim() !== '');

    let multilineElementData = { isMultiline: false, multilineText: '', multilineStartIndex: 0, multilineElementLines: [] };
    let uniqueElementsSet = new Set(); // To track unique elements in the scene
    let elementTextsSet = new Set(); // To store the text of each unique element in the scene

    scene.sceneLines.forEach((sceneLine, index) => {
        multilineElementData = processMultilineElement(sceneLine, index, multilineElementData, scriptData, scene);
        if (!multilineElementData.isMultiline) {
            processRegularElements(sceneLine, index, scriptData, scene);
            scene.elements.forEach(element => {
                uniqueElementsSet.add(element.masterElementId);
                elementTextsSet.add(element.elementText); // Store the element text, avoiding duplicates
            });
        }
    });

    // Log the total number of elements and unique elements in the scene
    console.log(chalk.dim(`Total Elements: ${scene.elements.length} | Unique Elements: ${uniqueElementsSet.size}`));
    // Log each unique element's text separated by "||"
    console.log(chalk.dim(`Scene ${scene.sceneIndex} Elements:\n`));
    console.log(chalk.yellow(Array.from(elementTextsSet).join(chalk.dim(' || '))));

    return scene;
};







