import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { PDFExtract } from 'pdf.js-extract';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
const pdfExtract = new PDFExtract();
import { colourizeLog } from './src/utils/colourizeLog.mjs';

let pdfFilePath = './toParse/bb-small.pdf';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});
//helpers
export const OpenAIFunctionCall = async (model, messages, functions, functionCall, temperature, maxTokens) => {
    let retries = 0;
    const maxRetries = 10;
    const backoffFactor = 1;

    // Clean out all newlines in messages
    const processedMessages = messages.map(message => {
        if (typeof message === 'string') {
            return message.replace(/\n/g, ' '); // Replace newlines with spaces
        } else if (typeof message === 'object' && message.text) {
            message.text = message.text.replace(/\n/g, ' '); // Replace newlines in text property
        }
        return message;
    });

    while (retries < maxRetries) {
        try {
            const completion = await openai.chat.completions.create({
                model: model,
                messages: processedMessages,
                functions: functions,
                function_call: functionCall,
                temperature: temperature,
                max_tokens: maxTokens,
            });

            //console.log(JSON.stringify(completion,null,2))

            const responseText = completion.choices[0].message.function_call.arguments;
            
            try {
                JSON.parse(responseText);
                return responseText;
            } catch (jsonError) {
                console.warn("The AI Bot didn't follow instructions on outputting to JSON, so retrying again.");
            }
        } catch (error) {
            console.error(`An error occurred: ${error.statusCode} - ${error.message}`);

            // Check if the error message contains the specific error
            if (error.message && error.message.includes("maximum context length")) {
                console.log("Reducing max tokens by 500 due to exceeding model's maximum context length.");
                maxTokens -= 250;
            } else {
                const wait = retries * backoffFactor * 5000;
                console.log(`Retrying in ${wait / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, wait));
            }

            retries += 1;
        }
    }

    throw new Error('Maximum retries reached');
};

// - Raw Document Object

let rawDocument = {
    meta: {
        rawDocumentId: '',
        url: '',
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

// - Script Object

let script = {
    meta: {
        scriptId: '',
        scriptName: '',
        authors: [{
            authorId: '',
            authorName: '',
            authorRole: '',
        }],
    },
    cover: {
        coverId: '',
        scriptTitle: '',
        scriptSubtitle: '',

    },
    scenes: [{
        sceneId: '',
        sceneHeader: '',
        sceneIndex: 0,
        sceneText: '',
        sceneLines: [{
            sceneId: '',
            sceneLineId: '',
            sceneLineText: '',
            sceneLineType: '',
        }],
        elements: [{
            elementId: '',
            sceneId: '',
            elementLineId: '',
            sceneLineNum: 0,
            elementText: '',
            elementType: '',
            elementLineText: '',
        }],
    }],
    masterElements: {
    cast: [{
            castId: '',
            castName: '',
            castSceneLocations: [{
                sceneId: '',
                sceneDialogueLines: [{
                    lineId: '',
                    lineNumber: 0,
                    lineText: '',
                }],
                sceneLineAppearences: [{
                    lineId: '',
                    lineNumber: 0,
                    lineText: '',
                     }],
                    }],
    }],
    props: [{
        propId: '',
        propName: '',
        propSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    locations: [{
        locationId: '',
        locationName: '',
        locationSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    parenthesis: [{
        parenthesisId: '',
        parenthesisName: '',
        parenthesisSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    transitions: [{
        transitionId: '',
        transitionName: '',
        transitionSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    sounds: [{
        soundId: '',
        soundName: '',
        soundSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    action: [{
        actionId: '',
        actionName: '',
        actionSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    shot: [{
        shotId: '',
        shotName: '',
        shotSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    animal: [{
        animalId: '',
        animalName: '',
        animalSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    vehicle: [{
        vehicleId: '',
        vehicleName: '',
        vehicleSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
                 }],
            }],
    }],
    music: [{
        musicId: '',
        musicName: '',
        musicSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    weather: [{
        weatherId: '',
        weatherName: '',
        weatherSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    time: [{
        timeId: '',
        timeName: '',
        timeSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    date: [{
        dateId: '',
        dateName: '',
        dateSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    duration: [{
        durationId: '',
        durationName: '',
        durationSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    transition: [{
        transitionId: '',
        transitionName: '',
        transitionSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    camera: [{
        cameraId: '',
        cameraName: '',
        cameraSceneLocations: [{
            sceneId: '',
            sceneLineAppearences: [{
                lineId: '',
                lineNumber: 0,
                lineText: '',
            }],
        }],
    }],
    }, 
}

let scriptData = {
    scenesData: [{
        sceneId: '',
        sceneResponseSchema: {},
        sceneRaw: {
            sceneId: '',
            sceneHeader: '',
            sceneIndex: 0,
            sceneText: '',
            sceneLines: [{
                sceneId: '',
                sceneLineId: '',
                sceneLineText: '',
                sceneLineType: '',
            }],
            elements: [{
                elementId: '',
                sceneId: '',
                elementLineId: '',
                sceneLineNum: 0,
                elementText: '',
                elementType: '',
                elementLineText: '',
            }],
        },
    }],
}




export const processPDF = async (pdfFilePath) => {
    let rawDocument = await initRawDocument(pdfFilePath);
    await getPdfTextAndLines(pdfFilePath, rawDocument);

    return rawDocument;
}

export const parseRawScenes = (rawDocument) => {
    let scenes = [];
    let currentScene = null;
    let sceneIndex = 0;

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
    
    for (let i = 0; i < rawDocument.rawDocumentLines.length; i++) {
        const line = rawDocument.rawDocumentLines[i];
        const isSceneHeader = sceneHeaderText.some(headerText => line.lineText.startsWith(headerText));
        
        if (isSceneHeader) {
            if (currentScene) {
                // Process scene lines and elements before adding the scene
                parseSceneElements(currentScene); // Assuming this populates 'elements' for each sceneLine
                
                scenes.push(currentScene);
            }

            // Create a new UUID for the new scene
            const newSceneId = uuidv4();
            currentScene = {
                sceneId: newSceneId,
                sceneHeader: line.lineText,
                sceneIndex: sceneIndex++,
                sceneText: line.lineText + '\n',
                sceneLines: [{
                    sceneLineId: line.lineId,
                    sceneLineText: line.lineText,
                    sceneId: newSceneId, // Pass the sceneId to the sceneLine
                }],
                elements: [],
            };
        } else if (currentScene) {
            currentScene.sceneText += line.lineText + '\n';
            currentScene.sceneLines.push({
                sceneLineId: line.lineId,
                sceneLineText: line.lineText,
                sceneId: currentScene.sceneId, // Pass the sceneId to the sceneLine
            });
        }
    }

    if (currentScene) {
        // Process scene lines and elements for the last scene
        parseSceneElements(currentScene);
        scenes.push(currentScene);
    }
    

    return scenes;
};

export const processScriptScenes = (scenes) => {
    const elementRegexPattern = /(\b[A-Z]{2,}(?:\s[A-Z]+)*(?=\s[a-z]|$)|\([A-Z\s]+\)|^\([^\)]*\)$)/g;

    for (const scene of scenes) {
        for (let i = 0; i < scene.sceneLines.length; i++) {
            let sceneLine = scene.sceneLines[i];

            // Replace empty or whitespace-only strings with null
            if (!sceneLine.sceneLineText.trim()) {
                sceneLine.sceneLineText = '';
                sceneLine.sceneLineType = 'newline';
            } else {
                const matches = sceneLine.sceneLineText.match(elementRegexPattern);
                if (matches) {
                    sceneLine.sceneLineType = matches.length === 1 ? 'singleElement' : 'groupElement';
                } else {
                    sceneLine.sceneLineType = '';
                }
            }

            // Check for dialogue lines
            if (sceneLine.sceneLineType === 'singleElement' && i < scene.sceneLines.length - 1) {
                const nextLine = scene.sceneLines[i + 1];
                if (!nextLine.sceneLineText.match(elementRegexPattern)) {
                    sceneLine.sceneLineType = 'dialogue';
                    for (let j = i + 1; j < scene.sceneLines.length; j++) {
                        if (!scene.sceneLines[j].sceneLineText.match(elementRegexPattern)) {
                            scene.sceneLines[j].sceneLineType = 'dialogue';
                        } else {
                            break;
                        }
                    }
                }
            }
        }
    }
    return script;
};

export const parseSceneElements = (scene) => {
    const regexPattern = /(\b[A-Z]{2,}(?:\s[A-Z]+)*(?=\s[a-z]|$)|\([A-Z\s]+\)|^\([^\)]*\)$)/g;

    scene.elements = [];

    scene.sceneLines.slice(1).forEach((line, index) => {
        // Skip if the line is null
        if (line.sceneLineText === null) return;

        const matches = line.sceneLineText.match(regexPattern);

        if (matches && matches.length > 0) {
            matches.forEach(match => {
                const sceneElement = {
                    elementId: uuidv4(),
                    sceneId: scene.sceneId,
                    elementLineId: line.sceneLineId,
                    sceneLineNum: index + 1,
                    elementText: match,
                    elementType: '', 
                    elementLineText: line.sceneLineText,
                };
                scene.elements.push(sceneElement);
            });
        }
    });

    return scene;
};

export const generateResponseSchema = (scene) => {
    // Create a new scene data object
    let sceneData = { sceneId: scene.sceneId, sceneResponseSchema: {} };

    // Initialize meta object with default values and descriptions
    let meta = {
        isDialogueInScene: {
            type: "boolean",
            description: "Indicates if there is dialogue in the scene."
        },
        dualDialogue: {
            type: "boolean",
            description: "Indicates if there is dual dialogue in the scene."
        },
        castInScene: {
            type: "array",
            items: { type: "string" },
            description: "List of cast names present in the scene."
        }
    };

    let responseSchema = {
        type: "object",
        properties: {
            meta: {
                type: "object",
                properties: meta,
                required: Object.keys(meta)
            }
        },
        required: ["meta"]
    };

    let addedElements = new Set(); // To track already added elements

    scene.elements.forEach(element => {
        let elementLineText = element.elementLineText;
        let elementText = element.elementText;

        // Check if elementLineText is not empty and the element is not already added
        if (elementLineText && !addedElements.has(elementText)) {
            responseSchema.properties[elementText] = {
                type: "object",
                properties: {
                    elementType: {
                        type: "string",
                        description: `The element we are categorizing based on the categories above. `
                    }
                },
                required: ["elementType"]
            };

            responseSchema.required.push(elementText);
            addedElements.add(elementText); // Mark this element as added
        }
    });

    // Assign the responseSchema to sceneData.sceneResponseSchema
    sceneData.sceneResponseSchema = responseSchema;

    return sceneData.sceneResponseSchema;
};

export const getElementTypeOpenAi = async (scene, sceneResponseSchema) => {

    let sceneText = scene.sceneText;
    let elements = []
    for (const key of sceneResponseSchema.required) {
        elements.push(key);
    }
    // now create a single string of all the elements in the elementArray and seperated by a comma and wrapped in double quotes for each
    let elementString = "";
    for (let i = 0; i < elements.length; i++) {
        elementString += `${i+1}. "${elements[i]}"\n `;
    }
    elementString = elementString.slice(0, -2); // remove the last comma and space

    //console.log(`Element String: ${elementString}`);

    let systemPrompt = `You are a data categorizer. Today we are categorizing important elements in a scene within a larger movie script. 
    Here's are your category choices to choose from. Do not deviate outside these category choices:
    <START CATEGORY CHOICES>
    //{CATEGORY:DESCRIPTION}
    CAST: Identify any character or person present in the scene. This includes main and supporting characters, extras, and even characters mentioned but not seen. Look for names, descriptions, and character interactions.
    PROP: Tag any object used by characters or present in the scene for aesthetic or functional purposes. This includes items like furniture, tools, gadgets, clothing accessories, and background objects that contribute to the scene's setting.
    ANIMAL: Note any living creatures other than humans. This includes domestic animals, wildlife, and even imaginary or CGI creatures that have a role or presence in the scene.
    CAMERA: Catalog any instruction or description related to camera work. This includes camera angles, shot types (close-up, wide shot, etc.), camera movements (pan, tilt, crane shots), and any specialized cinematography techniques.
    SOUND: Document any sound elements mentioned in the scene. This includes dialogue, background noises, sound effects (like doors creaking, footsteps), and diegetic sounds (originating from within the film's world).
    LOCATION: Identify the setting of the scene. This includes both the general location (city, countryside, indoors, outdoors) and specific places (a particular room, a street name, a landmark).
    ACTION: Record any physical or verbal action taken by characters or occurring in the scene. This includes movements, gestures, facial expressions, dialogues, and interactions between characters.
    PARENTHESIS: Tag any element enclosed in parentheses that does not fit into the other categories. This might include director's notes, technical instructions, or additional information about a scene.
    TRANSITION: Identify descriptions of transitions between scenes or shots. This includes fade-ins, fade-outs, cuts to a new scene, or any visual or narrative technique used to move from one scene to another.
    MUSIC: Note any mention of music, either as a background score or diegetic music (originating from within the scene). Include details about the type of music, mood it conveys, and its role in the scene.
    WEATHER: Document the weather conditions described in the scene. This includes elements like rain, sunshine, snow, fog, and how they affect the scene's atmosphere or actions of the characters.
    TIME: Record any references to time, such as a specific time of day, a duration of time, or a time-related event (e.g., sunset, an hour before dawn).
    DATE: Tag any specific dates mentioned or implied in the scene. This includes calendar dates, historical dates, or significant days relevant to the plot.
    DURATION: Note the duration of a scene or an action within a scene. This could be specific (e.g., "two minutes later") or more general (e.g., "a short while later").
    VEHICLE: Identify any vehicles that appear or are mentioned in the scene. This includes cars, bikes, boats, spacecraft, and any other mode of transportation, whether in motion or stationary.
    <END CATEGORY CHOICES>
    <Start of list of elements to categorize exactly>
     ${elementString}\n 
    <End of list of elements to categorize exactly>
     Please ensure each is in your response or it will fail. All returned items should be accounted for with no missing, and case-sensitive.
    `;
    let userPrompt = `!<Important. The last time you categorized this it was wrong or missing prop values or you made up key names that shouldnt be there. Your response should match the responseSchema exactly>
    Please categorize each element required from the following scene: "${sceneText}". Please be accurate with your categorizations of each elements type and ensure each required element is categorized. Please categorize the following elements: "${elementString}". When returning your response, all keys must be exactly as the list i just gave you, case-sensitive. Here are the choices for each element category for you to choose from: START CATEGORY OPTION: "CAST", "PROP", "LOCATION", "PARENTHESIS", "TRANSITION", "SOUND", "ACTION", "SHOT", "ANIMAL", "VEHICLE", "MUSIC", "WEATHER", "TIME", "DATE", "DURATION", "CAMERA" /END CATEGORY OPTIONS`;

    const responseText = await OpenAIFunctionCall(
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
    const response = JSON.parse(responseText);
    //console.log(JSON.stringify(response, null, 2))

    return response;

};
const validateResponse = (response, responseSchema) => {
    // Check if all required keys are present
    for (const key of responseSchema.required) {
        if (!response.hasOwnProperty(key)) {
            console.log(chalk.red(`Missing required key in response: ${key}`));
            return false;  // Key missing in the response
        }
    }

    // Check for any extra keys not defined in the schema
    for (const key in response) {
        if (!responseSchema.properties.hasOwnProperty(key)) {
            console.log(chalk.red(`Unexpected key in response: ${key}`));
            return false;  // Extra key found in the response
        }
    }

    // Check if the types of values match the schema
    for (const key in responseSchema.properties) {
        const expectedType = responseSchema.properties[key].type;
        const actualType = typeof response[key];

        // Special handling for arrays
        if (expectedType === 'array') {
            if (!Array.isArray(response[key])) {
                console.log(chalk.red(`Expected an array for key '${key}', got ${actualType}`));
                return false;
            }
        } else if (expectedType !== actualType) {
            console.log(chalk.red(`Type mismatch for key '${key}': expected ${expectedType}, got ${actualType}`));
            return false;
        }

        // Recursively validate nested objects
        if (expectedType === 'object' && responseSchema.properties[key].properties) {
            if (!validateResponse(response[key], responseSchema.properties[key])) {
                // Nested validation errors are logged in the recursive call
                return false;
            }
        }
    }

    return true;
};

const validateResponseValues = (response) => {
    const validCategoryTypes = ["CAST", "PROP", "LOCATION", "PARENTHESIS", "TRANSITION", "SOUND", "ACTION", "SHOT", "ANIMAL", "VEHICLE", "MUSIC", "WEATHER", "TIME", "DATE", "DURATION", "CAMERA"];
    // Skip the first object and all child values inside and start at the second item in the object object index
    for (let i = 1; i < response.length; i++) {
        const elementType = response[i].elementType;
        if (!validCategoryTypes.includes(elementType)) {
            return false;
        }
    }

    return true;
};
export const catAllElementsOpenAi = async (scenes, scriptData) => {

    for (const scene of scenes) {
        let validResponse = false;
        let response;

        while (!validResponse) {
            response = await getElementTypeOpenAi(scene, generateResponseSchema(scene));

            validResponse = validateResponse(response, generateResponseSchema(scene)) && validateResponseValues(response, scene.elements);
            if (!validResponse) {
                console.log(chalk.red(`Invalid response received for Scene ${scene.sceneIndex + 1}. Retrying...`));
            }
        }

        // Logging the scene details
        console.log(chalk.dim(`\n------------------- Categorized Results for Scene ${scene.sceneIndex + 1} -------------------\n`));
        console.log(`Scene ID: ${scene.sceneId}`);
        console.log(`Scene: ${scene.sceneHeader}\n`);
        console.log(chalk.yellow(`Elements:\n `));

        // Update the script.scenes.elements element type and log each element
        scene.elements.forEach(element => {
            let elementText = element.elementText;
            if (response.hasOwnProperty(elementText) && elementText !== 'meta') {
                element.elementType = response[elementText].elementType;
                // Logging each element and its type
                console.log(chalk.cyan(`Element:`), elementText, `|`, chalk.dim(`Type:`), chalk.magentaBright(element.elementType));
            }
        });

        // Push the response schema and scene ID to scriptData.scenesData for this scene
        scriptData.scenesData.push({ sceneId: scene.sceneId, sceneResponseSchema: generateResponseSchema(scene) });
    }
    

        // Copy each scene to the corresponding sceneData object
        scenes.forEach(scene => {
            let matchingSceneData = scriptData.scenesData.find(sd => sd.sceneId === scene.sceneId);
            if (matchingSceneData) {
                matchingSceneData.sceneResponseSchema = {...scene};
            }
        });

    return { scenes, scriptData };
};


export const setSceneLineTypes = async (scenes) => {
    const regexPattern = /(\b[A-Z]{2,}(?:\s[A-Z]+)*(?=\s[a-z]|$)|\([A-Z\s]+\)|^\([^\)]*\)$)/g;

    for (let scene of scenes) {
        if (!scene.sceneLines || scene.sceneLines.length === 0) {
            continue;
        }
        for (let i = 0; i < scene.sceneLines.length; i++) {
            let matches = (scene.sceneLines[i].sceneLineText.match(regexPattern) || []).length;
            if (scene.sceneLines[i].sceneLineText === '' || scene.sceneLines[i].sceneLineText === null || scene.sceneLines[i].sceneLineText === ' ') {
                scene.sceneLines[i].sceneLineType = 'newline';
            } else if (scene.sceneLines[i].sceneLineText === scene.sceneHeader) {
                scene.sceneLines[i].sceneLineType = 'Header'; // set to 'Header' if matches sceneHeader
            } else if (matches === 1) {
                scene.sceneLines[i].sceneLineType = 'singleElement'; // set to 'singleElement' if there is one match
            } else if (matches > 1) {
                scene.sceneLines[i].sceneLineType = 'groupElement'; // set to 'groupElement' if there are multiple matches
            } else if (matches === 0) {
                scene.sceneLines[i].sceneLineType = 'noElement'; // set to 'noElement' if there are no matches
            }
        }
    }
    return scenes;
};




export const mainVein = async () => {
    let script = {
        scenes: []
    };

    let scriptData = {
        scenesData: [], // Presumably, this gets populated somewhere
    };

    console.time(chalk.dim(`processPDF`));

    let rawDocument = await processPDF(pdfFilePath);

    console.log(chalk.white(`\nProcesing Script:`, chalk.yellow(`${pdfFilePath}\n`)));

    let scenes = parseRawScenes(rawDocument);

    console.log(chalk.dim(`Done Initial Parsing of Script.`));
    
    console.log(chalk.white(`\nCategorizing Scene Elements:`));
    await catAllElementsOpenAi(scenes, scriptData);
    console.log(chalk.dim(`Done Categorizing Scene Elements ->`));




    console.timeEnd(chalk.dim(`processPDF`));
    script.scenes = scenes;
    //colourizeLog(script);
    await colourizeLog(scriptData); // Uncomment this if you want to log scriptData
};


mainVein();

