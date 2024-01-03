import { v4 as uuidv4 } from 'uuid';
import { processPDF } from './components/processPdf.mjs';
import { parseRawScenes } from './components/parseScenes.mjs';
import { parseAllElements } from './components/parseElements.mjs';
import { colourizeLog } from './components/colourizeLog.mjs';
import { generateResponseSchemas } from './components/dyanmicResponseSchema.mjs';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';

let pdfFilePath = './toParse/bb.pdf';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});


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

export const getElementTypeOpenAi = async (parsedScene) => {

    let responseSchema = parsedScene.responseSchema;
    let sceneText = parsedScene.sceneText;
    let elementArray = []
    for (const key of responseSchema.required) {
        elementArray.push(key);
    }
    // now create a single string of all the elements in the elementArray and seperated by a comma and wrapped in double quotes for each
    let elementString = "";
    for (let i = 0; i < elementArray.length; i++) {
        elementString += `${i+1}. "${elementArray[i]}"\n `;
    }
    elementString = elementString.slice(0, -2); // remove the last comma and space

    //console.log(`Element String: ${elementString}`);

    let systemPrompt = `You are a data categorizer. Today we are categorizing important elements in a scene within a larger movie script. 
    The Categories are: 
    Cast: If the element is a cast member, or a character in the scene.
    Prop: If the element is a prop, or an object in the scene.
    Animal: If the element is an animal, or a living creature in the scene.
    Camera Movement: If the element is a camera movement, or a description of how the camera moves in the scene. Cinematography related elements. Usally anything describing angles, shots, or camera movements, cranes, pans, etc.
    Sound: If the element is a sound, or a description of a sound in the scene.
    Location: If the element is a location, or a description of a location in the scene. 
    Action: If the element is an action, or a description of an action in the scene or an action being taken by a character in the scene.
    Parenthesis: If the element is a parenthesis but doesnt fit into any of the above categories.

    You will also be required to look at the overall scene text and see if there is dialogue in the scene, and if so, is there dualdialogue going back and forth, and any cast members in the scene. 
    Dual-dialogue should be true if there are two or more cast members speaking in the scene.
    The elements we need to categorize in this scene specifically are:
    <Start of list of elements to categorize exactly>
     ${elementString}\n 
    <End of list of elements to categorize exactly>
     Please ensure each is in your response or it will fail. All returned items should be accounted for with no missing, and case-sensitive.
    `;
    let userPrompt = `!<Important. The last time you categorized this it was wrong or missing prop values or you made up key names that shouldnt be there. Your response should match the responseSchema exactly>
    Please categorize each element required from the following scene: "${sceneText}". Please be accurate with your categorizations of each elements type and ensure each required element is categorized. Please categorize the following elements: "${elementString}". When returning your response, all keys must be exactly as the list i just gave you, case-sensitive.`;

    const responseText = await OpenAIFunctionCall(
        'gpt-3.5-turbo-1106',
        [
            { role: 'system', content: `${systemPrompt}` },
            { role: 'user', content: `${userPrompt}` },
        ],
        [{ name: 'categorizeElements', parameters: responseSchema }],
        { name: 'categorizeElements' },
        0.1,
        2000,
    );
    const response = JSON.parse(responseText);

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

export const scoreScene = async (parsedScene) => {

    let responseSchema = {
        type: "object",
        properties: {
            political: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The political score of the scene, ranging from 0 (not political) to 1 (highly political)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the political score assigned."
                    }
                },
                required: ["score", "rationale"]
            },
            sexual: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The sexual score of the scene, ranging from 0 (no sexual content) to 1 (explicit sexual content)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the sexual score assigned."
                    }
                },
                required: ["score", "rationale"]
            },
            violent: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The violent score of the scene, ranging from 0 (no violence) to 1 (extreme violence)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the violent score assigned."
                    }
                },
                required: ["score", "rationale"]
            },
            profanity: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The profanity score of the scene, ranging from 0 (no profanity) to 1 (frequent or intense use of profanity)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the profanity score assigned."
                    }
                },
                required: ["score", "rationale"]
            },
            gore: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The gore score of the scene, ranging from 0 (no gore) to 1 (highly graphic or intense gore)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the gore score assigned."
                    }
                },
                required: ["score", "rationale"]
            },
            drug: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The drug score of the scene, ranging from 0 (no drug usage) to 1 (frequent or explicit drug usage)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the drug score assigned."
                    }
                },
                required: ["score", "rationale"]
            },
            alcohol: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                        description: "The alcohol score of the scene, ranging from 0 (no alcohol usage) to 1 (frequent or explicit alcohol usage)."
                    },
                    rationale: {
                        type: "string",
                        description: "The rationale behind the alcohol score assigned."
                    }
                },
                required: ["score", "rationale"]
            }
        },
        required: ["political", "sexual", "violent", "profanity", "gore", "drug", "alcohol"]
    };
    
    
    

    let sceneText = parsedScene.sceneText; // Assume parsedScene is the current scene object

    let systemPrompt = `You are scoring a movie scene based on various content categories. Each category should be scored on a scale from 0 to 1, where 0 means the content is not present and 1 means the content is highly prevalent or intense. The categories are:
    1. Political Score: Reflects the presence and intensity of political themes.
    2. Sexual Score: Measures the explicitness and prevalence of sexual content.
    3. Violent Score: Evaluates the intensity and graphic nature of violent content.
    4. Profanity Score: Assesses the frequency and severity of profane language.
    5. Gore Score: Gauges the level of graphic or explicit gore.
    6. Drug Score: Reflects the presence and portrayal of drug use.
    7. Alcohol Score: Evaluates the presence and depiction of alcohol use.
    Please analyze the provided scene text and assign scores to each category based on the content.`;
    
    let userPrompt = `Please score the following scene:\n\n${sceneText}\n\nBased on the criteria provided, assign a score from 0 to 1 for each category.`;
    

    const responseText = await OpenAIFunctionCall(
        'gpt-3.5-turbo-1106',
        [
            { role: 'system', content: `${systemPrompt}` },
            { role: 'user', content: `${userPrompt}` },
        ],
        [{ name: 'categorizeElements', parameters: responseSchema }],
        { name: 'categorizeElements' },
        0.1,
        2000,
    );
    const response = JSON.parse(responseText);

    return response;

}; 

export const scoreAllScenes = async (parsedScenes) => {
    for (const scene of parsedScenes) {
        let response = await scoreScene(scene);
        let sceneScore = {
            political: response.political,
            sexual: response.sexual,
            violent: response.violent,
            profanity: response.profanity,
            gore: response.gore,
            drug: response.drug,
            alcohol: response.alcohol
        };
        scene.sceneScore = sceneScore;

        console.log(chalk.dim(`\n------------------- Scored Results for Scene ${scene.sceneIndex + 1} -------------------\n`));
        console.log(`Scene ID: ${scene.sceneId}`);
        console.log(`Scene: ${scene.sceneHeader}`);  
        console.log(chalk.yellow(`Scene Content Scores:\n`));

        for (const [category, { score, rationale }] of Object.entries(sceneScore)) {
            console.log(chalk.cyan(`${category.charAt(0).toUpperCase() + category.slice(1)} Score: `), chalk.yellow(`${score}`));
            console.log(chalk.cyan(`Rationale: `), chalk.magenta(`${rationale}\n`));
        }
    }

    await getAverageScores(parsedScenes);

  
    return parsedScenes;
};

export const getAverageScores = (parsedScenes) => {
      // now get the average of each score for the entire script so we will need to add up all the scores for each category and then divide by the number of scenes
      let politicalScore = 0;
      let sexualScore = 0;
      let violentScore = 0;
      let profanityScore = 0;
      let goreScore = 0;
      let drugScore = 0;
      let alcoholScore = 0;
      let sceneCount = parsedScenes.length;
      for (const scene of parsedScenes) {
          politicalScore += scene.sceneScore.political.score;
          sexualScore += scene.sceneScore.sexual.score;
          violentScore += scene.sceneScore.violent.score;
          profanityScore += scene.sceneScore.profanity.score;
          goreScore += scene.sceneScore.gore.score;
          drugScore += scene.sceneScore.drug.score;
          alcoholScore += scene.sceneScore.alcohol.score;
      }
        politicalScore = politicalScore / sceneCount;
        sexualScore = sexualScore / sceneCount;
        violentScore = violentScore / sceneCount;
        profanityScore = profanityScore / sceneCount;
        goreScore = goreScore / sceneCount;
        drugScore = drugScore / sceneCount;
        alcoholScore = alcoholScore / sceneCount;
        console.log(chalk.dim(`\n------------------- Average Scored Results for Script -------------------\n`));
        console.log(chalk.yellow(`Script Content Scores:\n`));
        console.log(chalk.cyan(`Political Score: `), chalk.yellow(`${politicalScore}`));
        console.log(chalk.cyan(`Sexual Score: `), chalk.yellow(`${sexualScore}`));
        console.log(chalk.cyan(`Violent Score: `), chalk.yellow(`${violentScore}`));
        console.log(chalk.cyan(`Profanity Score: `), chalk.yellow(`${profanityScore}`));
        console.log(chalk.cyan(`Gore Score: `), chalk.yellow(`${goreScore}`));
        console.log(chalk.cyan(`Drug Score: `), chalk.yellow(`${drugScore}`));
        console.log(chalk.cyan(`Alcohol Score: `), chalk.yellow(`${alcoholScore}`));
        console.log(chalk.cyan(`Total Scenes: `), chalk.yellow(`${sceneCount}`));
        console.log(chalk.cyan(`Average Scene Length: `), chalk.yellow(`${parsedScenes[0].sceneText.length}`));
        console.log(chalk.cyan(`Total Script Length: `), chalk.yellow(`${parsedScenes[0].sceneText.length * sceneCount}`));
        console.log(chalk.cyan(`Average Scene Score: `), chalk.yellow(`${(politicalScore + sexualScore + violentScore + profanityScore + goreScore + drugScore + alcoholScore) / 7}`));
        console.log(chalk.cyan(`Average Scene Political Score: `), chalk.yellow(`${politicalScore}`));
        console.log(chalk.cyan(`Average Scene Sexual Score: `), chalk.yellow(`${sexualScore}`));
        console.log(chalk.cyan(`Average Scene Violent Score: `), chalk.yellow(`${violentScore}`));
        console.log(chalk.cyan(`Average Scene Profanity Score: `), chalk.yellow(`${profanityScore}`));
        console.log(chalk.cyan(`Average Scene Gore Score: `), chalk.yellow(`${goreScore}`));
        console.log(chalk.cyan(`Average Scene Drug Score: `), chalk.yellow(`${drugScore}`));
        console.log(chalk.cyan(`Average Scene Alcohol Score: `), chalk.yellow(`${alcoholScore}`));
        console.log(chalk.dim(`\n-------------------------------------------------------------------------\n`));
};

export const expandSceneRelevance = async (parsedScene) => {
    // generates keywords and a list of possible questions a user might ask about this scene from the perspective of a producer, director, or writer.
    parsedScene.sceneQuestions = [];
    parsedScene.sceneKeywords = [];

    let responseSchema = {
        type: "object",
        properties: {
            sceneQuestions: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "a list of 5-20 questions that a producer, director, or writer might ask about this scene specifically. We are using this to create more associated vector embeddings for this scene so be very specific with the scene details in your questions to add more relevance. Every question should encompass a certain scene specific detail"
            },
            sceneKeywords: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "a list of 10-30 keywords that encompasses every detail about the scene. We are using this to create more associated vector embeddings for this scene so be very specific and return as many keywords as possible that are relevant to the scene. These should be extrememly specific"
            },
        },
        required: ["sceneQuestions", "sceneKeywords"]
    };
    
    let sceneHeader = parsedScene.sceneHeader;
    let sceneText = parsedScene.sceneText;
    let sceneDocNum = parsedScene.sceneDocNum
    let elementText = ``;
    for (const element of parsedScene.elements) {
        elementText += `${element.elementText}, `;
    }
    elementText = elementText.slice(0, -2); // remove the last comma and space
    
    
    let systemPrompt = `Generate specific and detailed questions and keywords for a given scene. The questions should explore character motivations, setting details, plot significance, visual and auditory elements, and directorial choices. The keywords should encompass all aspects of the scene, including characters, mood, plot, visual and auditory descriptors. Aim for depth and specificity to enhance the vector embeddings for similarity search. Be Very specific with scene details, it help us with the matching alogirthm. Almost overly specific. `;
    let userPrompt = `Please generate all possible questions and keywords for the following scene: SCENE# ${sceneDocNum} - ${sceneHeader}\n${sceneText}\nMajor Scene Elements: ${elementText}\n !IMPORTANT> ENSURE BOTH scenequestions AND scenekeywords ARE RETURNED OR IT WILL FAIL`;
    

    let response;
    do {
        const responseText = await OpenAIFunctionCall(
            'gpt-3.5-turbo-1106',
            [
                { role: 'system', content: `${systemPrompt}` },
                { role: 'user', content: `${userPrompt}` },
            ],
            [{ name: 'categorizeElements', parameters: responseSchema }],
            { name: 'categorizeElements' },
            0.1,
            2000,
        );
        response = JSON.parse(responseText);
    } while (response.sceneQuestions.length === 0 || response.sceneKeywords.length === 0);

    parsedScene.sceneQuestions = response.sceneQuestions;
    parsedScene.sceneKeywords = response.sceneKeywords;


    console.log(chalk.dim(`\n------------------- Expanded Scene Relevance for Scene ${parsedScene.sceneIndex + 1} -------------------\n`));
    console.log(`Scene ID: ${parsedScene.sceneId}`);
    console.log(`Scene: ${parsedScene.sceneHeader}`);

    console.log(chalk.magenta(`\nScene Questions:\n `));

    for (let i = 0; i < parsedScene.sceneQuestions.length; i++) {
        console.log(chalk.cyan(`Question ${i+1}: `), chalk.yellow(`${parsedScene.sceneQuestions[i]}`));
    }
    console.log(chalk.magenta(`\nScene Keywords:\n `));

    let keywordString = ``;
    for (let i = 0; i < parsedScene.sceneKeywords.length; i++) {
        keywordString += `${parsedScene.sceneKeywords[i]}, `;
    }
    keywordString = keywordString.slice(0, -2); // remove the last comma and space
    console.log(chalk.cyan(`${keywordString}`));

    return parsedScene;
};

export const expandAllSceneRelevance = async (parsedScenes) => {
    for (const scene of parsedScenes) {
        await expandSceneRelevance(scene);
    }

    return parsedScenes;
};

export const getFuzzyKeywords = async (batchString) => {

        let fuzzyKeywords = [];

        let responseSchema = {
            type: "object",
            properties: {
                fuzzyKeywords: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "A list of 30-50 fuzzy keywords that are paralell, perhiperal, commonly used associations, etc. Please be expansive. This is for a fuzzy search but also with contextual relevance. "
                },
            },
            required: ["fuzzyKeywords"]
        };



        let systemPrompt = `You are a fuzzy keyword generator who recieves a list of keywords and you expand that out to be a huge list of all encompassing variations, meanings, parrellel and perhiperal contexts, we are using this for a search so the list should be exhaustive but relevant.`;
        let userPrompt = `Please generate all possible fuzzy keywords for the following batch: Keywords:\n\n ${batchString}`;


        const responseText = await OpenAIFunctionCall(
            'gpt-3.5-turbo-1106',
            [
                { role: 'system', content: `${systemPrompt}` },
                { role: 'user', content: `${userPrompt}` },
            ],
            [{ name: 'fuzzyKeywordsCreate', parameters: responseSchema }],
            { name: 'fuzzyKeywordsCreate' },
            0.1,
            2000,
        );
        
        const response = JSON.parse(responseText);

        fuzzyKeywords = response.fuzzyKeywords;
        

        return fuzzyKeywords;

};
export const getFuzzyKeywordsAllScenes = async (parsedScenes) => {
    for (const scene of parsedScenes) {
        const keywords = scene.sceneKeywords;
        for (let i = 0; i < keywords.length; i += 5) {
            const batch = keywords.slice(i, i + 5);
            const batchString = batch.join(', ');
            const fuzzyKeywords = await getFuzzyKeywords(batchString);
            scene.fuzzyKeywords.push(...fuzzyKeywords);

            console.log(chalk.dim(`\n------------------- Fuzzy Keywords for Scene ${scene.sceneIndex + 1} -------------------\n`));
            console.log(chalk.cyan(`Fuzzy Keywords:`, chalk.yellow(fuzzyKeywords)));
            console.log(chalk.dim(`\n-------------------------------------------------------------------------\n`));
        }
    }
};  

export const getFuzzyQuestions = async (questionString) => {

    let fuzzyQuestions = [];

    let responseSchema = {
        type: "object",
        properties: {
            fuzzyQuestions: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "A list of 30-50 fuzzy questions that are paralell, perhiperal, commonly used associations, etc. Please be expansive. This is for a fuzzy search but also with contextual relevance. "
            },
        },
        required: ["fuzzyQuestions"]
    };



    let systemPrompt = `You are a fuzzy keyword question who recieves a list of questions and you expand that out to be a huge list of all encompassing variations, meanings, parrellel and perhiperal contexts, we are using this for a search so the list should be exhaustive but relevant.`;
    let userPrompt = `Please generate all possible fuzzy questions for the following batch: Keywords:\n\n ${questionString}`;


    const responseText = await OpenAIFunctionCall(
        'gpt-3.5-turbo-1106',
        [
            { role: 'system', content: `${systemPrompt}` },
            { role: 'user', content: `${userPrompt}` },
        ],
        [{ name: 'fuzzyQuestionsCreate', parameters: responseSchema }],
        { name: 'fuzzyQuestionsCreate' },
        0.1,
        2000,
    );
    
    const response = JSON.parse(responseText);

    fuzzyQuestions = response.fuzzyQuestions;
    

    return fuzzyQuestions;

};

export const getFuzzyQuestionsAllScenes = async (parsedScenes) => {
    for (const scene of parsedScenes) {
        const questions = scene.sceneQuestions;

        // Reset fuzzyQuestions for the current scene
        scene.fuzzyQuestions = [];

        for (let i = 0; i < questions.length; i += 5) {
            const batch = questions.slice(i, i + 5);
            const batchString = batch.map((question, index) => `${i + index + 1}. ${question}`).join('\n');
            const fuzzyQuestions = await getFuzzyQuestions(batchString);

            // Append to scene.fuzzyQuestions only once per scene
            if (i === 0) {
                scene.fuzzyQuestions.push(...fuzzyQuestions);
            }
        }

        console.log(chalk.dim(`\n------------------- Fuzzy Questions for Scene ${scene.sceneIndex + 1} -------------------\n`));
        console.log(chalk.dim(`Scene Id: ${scene.sceneId}`));
        console.log(`Scene: ${scene.sceneHeader}`);
        console.log(chalk.magenta(`Fuzzy Questions:`));
        for (let i = 0; i < scene.fuzzyQuestions.length; i++) {
            console.log(chalk.cyan(`${i+1}. `), chalk.yellow(`${scene.fuzzyQuestions[i]}`));
        }
        console.log(chalk.dim(`\n----------------------------------------------------------------------\n`));
    }
};

export const critiqueScene = async (parsedScene) => {

    let responseSchema = {
        type: "object",
        properties: {
            sceneCritiques: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "An array of critique strings for the scene."
            },
        },
        required: ["sceneCritiques"]
    };
    
    
    

    let sceneText = parsedScene.sceneText; // Assume parsedScene is the current scene object

    let systemPrompt = `You are a critic who is critiquing this scene in a movie script. Provide critiques that help the user gain insight they might not have thought about.`;
    
    let userPrompt = `Please critique this scene as tough as you can be but helpful. Provice critiques from the point of view of an Excetive producer, or someone involved in the production of the script. ${sceneText}`;
    

    const responseText = await OpenAIFunctionCall(
        'gpt-3.5-turbo-1106',
        [
            { role: 'system', content: `${systemPrompt}` },
            { role: 'user', content: `${userPrompt}` },
        ],
        [{ name: 'categorizeElements', parameters: responseSchema }],
        { name: 'categorizeElements' },
        0.1,
        2000,
    );
    const response = JSON.parse(responseText);
    console.log(`response:`, JSON.stringify(response, null, 2));
    return response;

}
export const critiqueAllScenes = async (parsedScenes) => {
    for (const parsedScene of parsedScenes) {
        parsedScene.sceneCritiques = [];
        let response = await critiqueScene(parsedScene);
        parsedScene.sceneCritiques = response.sceneCritiques;
        
        console.log(chalk.dim(`\n------------------- Scene Critiques for Scene ${parsedScene.sceneIndex + 1} -------------------\n`));
        console.log(chalk.dim(`Scene Id: ${parsedScene.sceneId}`));
        console.log(`Scene: ${parsedScene.sceneHeader}`);
        console.log(chalk.magenta(`Scene Critiques:`));
        for (let i = 0; i < parsedScene.sceneCritiques.length; i++) {
            console.log(chalk.cyan(`${i+1}. `), chalk.yellow(`${parsedScene.sceneCritiques[i]}`));
        }
        console.log(chalk.dim(`\n----------------------------------------------------------------------\n`));
    }

    return parsedScenes;
}
async function main() {
    console.log(chalk.red(`\nLoading PDF File: ${pdfFilePath}`));
    let rawDocument = await processPDF(pdfFilePath);
    console.log (chalk.green(`\nPDF File Loaded Successfully.`));
    console.log(chalk.red(`\nParsing PDF into scenes.`));
    let parsedScenes = parseRawScenes(rawDocument);
    console.log(chalk.green(`\nPDF Parsed Into Scenes Successfully.`));
    console.log(chalk.red(`\nParsing Scene Elements`));
    await parseAllElements(parsedScenes);
    console.log(chalk.green(`\nScene Elements Parsed Successfully.`));
    await generateResponseSchemas(parsedScenes);
    console.log(chalk.red(`\nCategorizing Scene Elements`));
    await catAllSceneElements(parsedScenes);
    console.log(chalk.green(`\nScene Elements Categorized Successfully.`));
    console.log(chalk.red(`\nSorting Elements:`));
    /* let masterProps = await sortAllElementsInScript(parsedScenes);
    console.log(chalk.green(`\nElements Sorted Successfully.`)); */
   /*  console.log(chalk.red(`\nScoring Scenes:`));
    await scoreAllScenes(parsedScenes);
    console.log(chalk.green(`\nScenes Scored Successfully.`)); 
    console.log(chalk.red(`\nExpanding Scene Relevance`));
    await expandAllSceneRelevance(parsedScenes);
    console.log(chalk.green(`\nScene Relevance Expanded Successfully.`));
    console.log(chalk.red(`Generating Fuzzy Questions`))
    await getFuzzyQuestionsAllScenes (parsedScenes);
    console.log(chalk.green(`\nFuzzy Questions Generated Successfully`));
    console.log(chalk.red(`Generating Fuzzy Keywords`))
    await getFuzzyKeywordsAllScenes (parsedScenes);
    console.log(chalk.green(`\nFuzzy Keywords Generated Successfully`));
    console.log(chalk.red(`Generating Scene Critiques`)) 
    await critiqueAllScenes (parsedScenes)
    console.log(chalk.green(`\nScenes Critiques Successfully`)); */





    colourizeLog(parsedScenes);
}

main();



/**
 * 1. Read PDF
 * 2. Parse PDF into scenes
 * 3. Parse scenes into elements
 * 4 Generate response schemas for each scene
 * 5. call openai with response schemas to get element types
 * 6. set element types in parsed scenes
 * 
 * */

