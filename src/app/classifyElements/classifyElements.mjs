import { OpenAIFunctionCall } from '../../utils/openai/OpenAiFunctionCall.mjs';
import { tokenTrackOpenAI } from '../../utils/openai/tokenTrackerOpenAi.mjs';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid'; // Ensure you import the UUID library


export const cleanSceneLineTypes = async (scriptData )=> {
    scriptData.scenesData.forEach(scene => {
        // Iterate through each element in the scene
        scene.elements.forEach(element => {
            // Find the corresponding scene line
            const sceneLine = scene.sceneLines.find(line => line.sceneLineId === element.elementLineId);

            if (sceneLine) {
                // Check if the element is 'CAST' and it's the only element on the line
                if (element.elementClass === 'CAST') {
                    const elementsOnLine = scene.elements.filter(el => el.elementLineId === sceneLine.sceneLineId);
                    const isExactMatch = sceneLine.sceneLineText.trim().toLowerCase() === element.elementText.trim().toLowerCase();

                    if (elementsOnLine.length === 1 && isExactMatch) {
                        sceneLine.sceneLineType = 'CAST';
                    }
                }
                // Check if the element is 'PARENTHESIS'
                else if (element.elementClass === 'PARENTHESIS') {
                    const textWithinParentheses = sceneLine.sceneLineText.match(/\(([^)]+)\)/);
                    const isAllUppercase = textWithinParentheses && textWithinParentheses[1] === textWithinParentheses[1].toUpperCase();

                    if (isAllUppercase) {
                        sceneLine.sceneLineType = 'PARENTHESIS';
                    }
                }
            }
        });
    });

    return scriptData;
};


const validateResponse = async (response, responseSchema) => {
    
    // Skip validation for 'meta' key
    for (const key in response) {
        if (key === 'meta') continue;

        // Check if the key is defined in the schema
        if (!responseSchema.properties.hasOwnProperty(key)) {
            console.log(chalk.red(`Unexpected key in response: ${key}`));
            return false;
        }

        const expectedType = responseSchema.properties[key].type;
        const actualType = Array.isArray(response[key]) ? 'array' : typeof response[key];

        // Check if the actual type matches the expected type
        if (expectedType !== actualType) {
            console.log(chalk.red(`Type mismatch for key '${key}': expected ${expectedType}, got ${actualType}`));
            return false;
        }

        // If the expected type is 'object', validate its properties recursively
        if (expectedType === 'object' && responseSchema.properties[key].properties) {
            if (!validateResponse(response[key], responseSchema.properties[key])) {
                return false;
            }
        }
    }

    return true;
};


const validateResponseValues = async (response, validCategoryTypes) => {
        for (const key in response) {
        if (response.hasOwnProperty(key)) {
            const element = response[key];
            // Check if element is an object and has elementClass property
            if (typeof element === 'object' && element.hasOwnProperty('elementClass')) {
                const elementClass = element.elementClass;
                // Check if elementClass is not one of the valid types
                if (!validCategoryTypes.includes(elementClass)) {
                    console.log(chalk.red(`Invalid elementClass for ${key}: ${elementClass}`));
                    return false;
                }
            }
        }
    }
    return true;
};

/**
 * Generates a response schema for element classification based on the elements present in a scene.
 * The schema includes metadata and properties for each unique element.
 * @param {Object} scene - The scene object containing elements to classify.
 * @param {string} validCategoryTypesString - String representing valid category types for classification.
 * @returns {Object} The generated response schema for the scene.
 */

export const generateResponseSchema = async (scene, validCategoryTypesString) => {
        let sceneData = { sceneId: scene.sceneId, sceneResponseSchema: {} };

    let meta = {
        isDialogueInScene: { type: "boolean", description: "Indicates if there is dialogue in the scene." },
        dualDialogue: { type: "boolean", description: "Indicates if there is dual dialogue in the scene." },
        castInScene: { type: "array", items: { type: "string" }, description: "List of cast names present in the scene." }
    };

    let responseSchema = {
        type: "object",
        properties: { meta: { type: "object", properties: meta, required: Object.keys(meta) } },
        required: ["meta"]
    };

    let uniqueElements = new Set();

    scene.elements.forEach(element => {
        let elementText = element.elementText;
        
        if (element.elementClass === 'PARENTHESIS' || uniqueElements.has(elementText)) {
            return;
        }

        responseSchema.properties[elementText] = {
            type: "object",
            properties: { elementClass: { type: "string", description: `The classification of the element, choice should be 1 of: ${validCategoryTypesString}. !Important: Choose the best from that list only.` } },
            required: ["elementClass"]
        };

        uniqueElements.add(elementText);
    });

    responseSchema.required = Object.keys(responseSchema.properties);

    //console.log(`SceneResponseSchema:`, chalk.dim(`${JSON.stringify(responseSchema, null, 4)}`));
    return responseSchema;
};

export const getElementTypeOpenAi = async (scene, validCategoryTypesString, sceneResponseSchema) => {

    let sceneText = scene.sceneCleanText;
    let sceneHeader = scene.sceneHeader
    let validCategories = validCategoryTypesString
    let elements = []
    for (const key of sceneResponseSchema.required) {
        elements.push(key);
    }
    let elementString = "";
    for (let i = 0; i < elements.length; i++) {
        elementString += `${i+1}. "${elements[i]}"\n `;
    }

    elementString = elementString.slice(0, -2); // remove the last comma and space

   // console.log(`ElementString:`, elementString)
    //console.log (`validCategories:`, validCategories)

    let systemPrompt = `You are an element classifier. You choose the best fit classification from a given list for a certain element. You will be provided with the element as the object parent and elementClass as the value to be returned by you.
    Only use the provided classification category options given to you. Choose the absolute best option if you need to.

    These are the elements that we are classifying: 
    <START ELEMENT NAMES>
    ${elementString}
    <END ELEMENT NAMES>
    <START CLASSIFICATION CATEGORY OPTIONS>
    ${validCategories}
    <END CLASSIFICATION CATEGORY OPTIONS>  `;
    
    let userPrompt = `Here is the scene for context: <START CONTEXT>${sceneHeader}\\${sceneText}<END CONTEXT>.
    Please classify each element based on these following classification category options:
    <START CLASSIFICATION CATEGORY OPTIONS> ${validCategories} <END CLASSIFICATION CATEGORY OPTIONS>`;


    
    let completion = await OpenAIFunctionCall(
        'gpt-3.5-turbo-1106',
        [
            { role: 'system', content: `${systemPrompt}` },
            { role: 'user', content: `${userPrompt}` },
        ],
        [{ name: 'categorizeElements', parameters: sceneResponseSchema }],
        { name: 'categorizeElements' },
        0.1,
        2000,
    );

    return completion;
};
/**
 * Processes the classified elements and updates the scene with the classification.
 * @param {Object} response - The classification response from OpenAI.
 * @param {Object} scene - The current scene being processed.
 * @param {Array} validCategoryTypes - Array of valid category types.
 */
const processClassifiedElements = async (response, scene, validCategoryTypes) =>{
    console.log(chalk.magenta(`Scene ID:`), chalk.yellow(`${scene.sceneId}`));
    console.log(chalk.magenta(`Scene Header:`), chalk.yellow(`${scene.sceneHeader}`));
    console.log(chalk.magenta(`Scene Index:`), chalk.yellow(`${scene.sceneIndex + 1}`));
    console.log(chalk.magenta(`Elements:\n`));
    console.log(chalk.dim(`------`));



    // Update and display each element in the scene
    scene.elements.forEach(element => {
        let elementText = element.elementText;

        // Handle parenthesis elements
        if (element.elementClass === 'PARENTHESIS') {
            console.log(chalk.dim(`Element:`), chalk.cyan(elementText), chalk.dim(`| Type:`), chalk.yellow(element.elementClass));
            return; // Skip further processing for this element
        }

        if (response.hasOwnProperty(elementText)) {
            let responseElementClass = response[elementText].elementClass;
            if (validCategoryTypes.includes(responseElementClass)) {
                element.elementClass = responseElementClass;
                console.log(chalk.dim(`Element:`), chalk.cyan(elementText), chalk.dim(`| Type:`), chalk.yellow(element.elementClass));
            } else {
                console.log(chalk.red(`Mismatch for element ${elementText}. Expected: ${element.elementClass}, Received: ${responseElementClass}`));
            }
        } else {
            console.log(chalk.red(`No matching key found for element ${elementText}.`));
        }
    });
    console.log(chalk.dim(`------`));

}

/**
 * Updates the line types to 'CAST' or 'PARENTHESIS' for lines that meet specific criteria.
 * @param {Object} scene - The current scene being processed.
 */
const updateLineTypes = async (scene) => {
    scene.sceneLines.forEach(sceneLine => {
        // Update for 'CAST'
        const matchingCastElement = scene.elements.find(element => 
            element.elementClass === 'CAST' && 
            sceneLine.sceneLineText.toUpperCase().includes(element.elementText.toUpperCase()));

        if (matchingCastElement) {
            // Determine cast type based on the line text
            if (sceneLine.sceneLineText.trim().toUpperCase() === matchingCastElement.elementText.toUpperCase()) {
                sceneLine.sceneLineType = 'CAST_NORMAL';
            } else if (/\b(V.O.|VOICEOVER)\b/.test(sceneLine.sceneLineText.toUpperCase())) {
                sceneLine.sceneLineType = 'CAST_NARRATIVE';
            } else {
                sceneLine.sceneLineType = 'CAST_CONTEXT';
            }
        }
    });
};
/**
 * Updates the line types to 'DIALOGUE' for lines that come after a 'CAST' line and before the next 'CAST', 'singleElement', 'groupElement', or 'multiLineElement' line.
 * Parenthesis lines are included unless they are in all caps.
 * @param {Object} scene - The current scene being processed.
 */
const setDialogueLineType = async (scene) => {
    let isDialogueBlock = false;

    scene.sceneLines.forEach((sceneLine, index) => {
        const lineText = sceneLine.sceneLineText.trim();
        const isAllCaps = lineText === lineText.toUpperCase();

        // Check for the start of a dialogue block
        if (sceneLine.sceneLineType === 'CAST') {
            isDialogueBlock = true;
            return; // Skip setting 'CAST' line to 'DIALOGUE'
        }

        // Handle multiline elements
        if (sceneLine.sceneLineType === 'multiLineElement' && isDialogueBlock) {
            if (lineText === "(") {
                scene.sceneLines[index].sceneLineType = 'DIALOGUE';
                return; // Continue to next line
            }
            if (lineText === ")") {
                scene.sceneLines[index].sceneLineType = 'DIALOGUE';
                isDialogueBlock = false;
                return; // Continue to next line
            }
        }

        // Set the line type to 'DIALOGUE' for lines within a dialogue block
        if (isDialogueBlock && sceneLine.sceneLineType === 'noElement' &&
            !(sceneLine.sceneLineType === 'PARENTHESIS' && isAllCaps)) {
            sceneLine.sceneLineType = 'DIALOGUE';
        }

        // Reset dialogue block at specific line types
        if (sceneLine.sceneLineType !== 'noElement') {
            isDialogueBlock = false;
        }
    });
};


const updateMasterElements = async (scriptData, scene) => {
    scene.elements.forEach(element => {
        const elementText = element.elementText;
        let masterElement = scriptData.masterElements.allElements.find(me => me.elementText === elementText);

        if (!masterElement) {
            masterElement = {
                masterElementId: uuidv4(),
                elementText: elementText,
                elementClass: element.elementClass,
                sceneAppearances: []
            };
            scriptData.masterElements.allElements.push(masterElement);
        } else {
            if (masterElement.elementClass !== element.elementClass) {
                masterElement.elementClass = element.elementClass;
            }
        }

        let sceneAppearance = masterElement.sceneAppearances.find(sa => sa.sceneId === scene.sceneId);
        if (!sceneAppearance) {
            sceneAppearance = {
                sceneId: scene.sceneId,
                sceneNum: scene.sceneIndex,
                sceneLineAppearances: []
            };
            masterElement.sceneAppearances.push(sceneAppearance);
        }

        element.elementLines.forEach(line => {
            const lineAppearance = sceneAppearance.sceneLineAppearances.find(la => la.lineId === line.elementLineId);
            if (!lineAppearance) {
                sceneAppearance.sceneLineAppearances.push({
                    lineId: line.elementLineId,
                    lineNum: line.sceneLineNum,
                    lineText: line.sceneLineText
                });
            }
        });

        const elementClassKey = element.elementClass.toLowerCase();
        scriptData.masterElements.sortedElements[elementClassKey] = 
            scriptData.masterElements.sortedElements[elementClassKey] || [];
        scriptData.masterElements.sortedElements[elementClassKey].push(masterElement);

        Object.keys(scriptData.masterElements.sortedElements).forEach(key => {
            if (key !== elementClassKey) {
                scriptData.masterElements.sortedElements[key] = 
                    scriptData.masterElements.sortedElements[key].filter(me => me.masterElementId !== masterElement.masterElementId);
            }
        });
    });
};

// getCastDialogue function processes each scene to extract dialogue sets for each 'CAST' element
const setCastDialogue = async (scriptData, scenesData) => {
    scenesData.forEach(scene => {
        scene.elements.forEach(element => {
            if (element.elementClass === 'CAST') {
                let dialogueSets = [];
                let currentSet = [];
                let isInDialogueSet = false;
                let elementLineText = '';

                scene.sceneLines.forEach(line => {
                    if (line.sceneLineType === 'CAST' && line.sceneLineText.includes(element.elementText)) {
                        if (isInDialogueSet && currentSet.length > 0) {
                            dialogueSets.push({
                                dialogueSetId: uuidv4(),
                                dialogueSetNum: dialogueSets.length + 1,
                                dialogueLines: currentSet
                            });
                            currentSet = [];
                        }
                        isInDialogueSet = true;
                        elementLineText = line.sceneLineText;
                    } else if (isInDialogueSet && line.sceneLineType === 'DIALOGUE') {
                        currentSet.push({
                            dialogueId: uuidv4(),
                            dialogueNum: line.sceneLineNum,
                            dialogueText: line.sceneLineText
                        });
                    } else if (line.sceneLineType !== 'DIALOGUE' && isInDialogueSet) {
                        isInDialogueSet = false;
                        if (currentSet.length > 0) {
                            dialogueSets.push({
                                dialogueSetId: uuidv4(),
                                dialogueSetNum: dialogueSets.length + 1,
                                dialogueLines: currentSet
                            });
                            currentSet = [];
                        }
                    }
                });

                if (isInDialogueSet && currentSet.length > 0) {
                    dialogueSets.push({
                        dialogueSetId: uuidv4(),
                        dialogueSetNum: dialogueSets.length + 1,
                        dialogueLines: currentSet
                    });
                }

                if (dialogueSets.length > 0) {
                    const masterElement = scriptData.masterElements.allElements.find(me => me.elementText === element.elementText);
                    if (masterElement) {
                        const sceneAppearance = masterElement.sceneAppearances.find(sa => sa.sceneId === scene.sceneId);
                        if (sceneAppearance) {
                            sceneAppearance.dialogueSets = dialogueSets;
                        }
                    }
                }
            }
        });
    });
};







// MAIN --------------------------------------------
/**
 * Classifies the elements in each scene of the script data.
 * It generates a response schema for each scene, sends a prompt to OpenAI for classification, 
 * and then updates the script data with the classified elements.
 * @param {Object} scriptData - The script data containing scenes and elements.
 * @returns {Object} The updated script data with classified elements.
 */
export const classifyElements = async (scriptData) => {
    console.log(chalk.cyan(`\nClassifying Elements -> `));
    const validCategoryTypes = ["CAST", "PROP", "LOCATION", "TRANSITION", "SOUND", "ACTION", "SHOT", "ANIMAL", "VEHICLE", "MUSIC", "WEATHER", "TIME", "DATE", "DURATION", "CAMERA"];
    let validCategoryTypesString = validCategoryTypes.map((type, index) => `|${index + 1}. "${type}"|`).join('');

    for (const scene of scriptData.scenesData) {
        scene.elements.forEach(element => {
            if (element.elementText.startsWith('(') && element.elementText.endsWith(')')) {
                element.elementClass = 'PARENTHESIS';
            }
        });

        scene.sceneResponseSchema = await generateResponseSchema(scene, validCategoryTypesString);

        // Check if there are elements other than 'meta' to classify
        if (scene.sceneResponseSchema.required.length === 1 && scene.sceneResponseSchema.required.includes('meta')) {
            console.log(chalk.red(`Skipping classification for Scene ${scene.sceneIndex + 1}: No elements to classify.`));
            continue; // Skip to the next scene
        }

        let validResponse = false;
        let response;

        while (!validResponse) {
            console.log(chalk.dim(`\n----------------- Classifying Elements For Scene:`), chalk.yellow(`${scene.sceneIndex + 1}`),chalk.dim(`:`), chalk.cyan(`${scene.sceneHeader}\n`));
            let completion = await getElementTypeOpenAi(scene, validCategoryTypesString, scene.sceneResponseSchema);
            response = JSON.parse(completion.choices[0].message.function_call.arguments);

            validResponse = validateResponse(response, scene.sceneResponseSchema) && validateResponseValues(response, validCategoryTypes);

            if (!validResponse) {
                console.log(chalk.red(`Invalid response received for Scene ${scene.sceneIndex + 1}. Retrying...`));
            }
        }

        processClassifiedElements(response, scene, validCategoryTypes);
        
        await updateLineTypes(scene);
        await setDialogueLineType(scene);
        await updateMasterElements(scriptData, scene);
        //await setCastDialogue(scriptData, scene);

        console.log(chalk.dim(`\n----------------- End Scene ${scene.sceneIndex + 1} -----------------\n`));
    }

    console.log(chalk.dim(`✔︎`));
    return scriptData;
};




