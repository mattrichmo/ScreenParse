
import { OpenAIFunctionCall } from '../../utils/openai/OpenAiFunctionCall.mjs';
import chalk from 'chalk';

export const scoreScene = async (scene) => {

    let sceneText = scene.sceneCleanText; // Assume parsedScene is the current scene object

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
    

    let completion = await OpenAIFunctionCall(
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

    let sceneScore = JSON.parse(completion.choices[0].message.function_call.arguments);

    //console.log(JSON.stringify(response, null, 2));

    return sceneScore;

}; 

export const scoreAllScenes = async (scriptData) => {
    for (const scene of scriptData.scenesData) {
        
        let sceneScore = await scoreScene(scene);
        let sceneIndex = scene.sceneIndex;
        scene.sceneScore = sceneScore;

    console.log(chalk.dim(`\n--------------------- Scene Scores for Scene:`),chalk.yellow(`${sceneIndex + 1}`),chalk.dim(` ---------------------\n`));
    console.log (chalk.cyan(`Scene Id:`, chalk.yellow(scene.sceneId)));
    console.log (chalk.cyan(`Scene Index:`, chalk.yellow(scene.sceneIndex + 1)));
    console.log (chalk.cyan(`Scene Slug:`), chalk.yellow(scene.sceneHeader));
    console.log(chalk.cyan(`Scene Scores:\n`))
    console.log(chalk.dim(`-----`));
    console.log(`${chalk.cyan('Political')}: ${chalk.yellow(scene.sceneScore.political.score)}`);
    console.log(chalk.cyan(`Rationale:`, chalk.yellow(`${scene.sceneScore.political.rationale}\n`)));

    console.log(`${chalk.cyan('Sexual')}: ${chalk.yellow(scene.sceneScore.sexual.score)}`);
    console.log(`${chalk.cyan('Rationale')}: ${chalk.yellow(scene.sceneScore.sexual.rationale)}\n`);

    console.log(`${chalk.cyan('Violent')}: ${chalk.yellow(scene.sceneScore.violent.score)}`);
    console.log(`${chalk.cyan('Rationale')}: ${chalk.yellow(scene.sceneScore.violent.rationale)}\n`);

    console.log(`${chalk.cyan('Profanity')}: ${chalk.yellow(scene.sceneScore.profanity.score)}`);
    console.log(`${chalk.cyan('Rationale')}: ${chalk.yellow(scene.sceneScore.profanity.rationale)}\n`);

    console.log(`${chalk.cyan('Gore')}: ${chalk.yellow(scene.sceneScore.gore.score)}`);
    console.log(`${chalk.cyan('Rationale')}: ${chalk.yellow(scene.sceneScore.gore.rationale)}\n`);
    
    console.log(`${chalk.cyan('Drug')}: ${chalk.yellow(scene.sceneScore.drug.score)}`);
    console.log(`${chalk.cyan('Rationale')}: ${chalk.yellow(scene.sceneScore.drug.rationale)}\n`);

    console.log(`${chalk.cyan('Alcohol')}: ${chalk.yellow(scene.sceneScore.alcohol.score)}`);
    console.log(`${chalk.cyan('Rationale')}: ${chalk.yellow(scene.sceneScore.alcohol.rationale)}\n`);
    console.log(chalk.dim(`-----`));
    console.log(chalk.dim(`\n--------------------- END Scores For Scene:`), chalk.yellow(`${sceneIndex + 1}`),chalk.dim(` ---------------------\n`));

    }
};

export const critiqueScene = async (scene) => {
    let sceneText = scene.sceneCleanText; // Assume parsedScene is the current scene object
    let responseSchema = {
        type: "object",
        properties: {
            sceneQuestions: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Questions about the scene from the perspective of a producer who's money is in it deep. Give me 5 or more deep questions."
            },
            sceneComments: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Comments about the originality, creativity, and quality of the scene, and emotional impact of the scene. Give me 5 or more deep comments about anything you can think that will give us a new perspective on the scene. Make these comments relevant, and aim to be constructive."
            },
            sceneCritiques: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Major critiques about the scene. Give me 5 or more major critiques about the scene. Make these critiques relevant, and aim to be constructive"
            }
        },
        
        required: ["sceneQuestions", "sceneComments", "sceneCritiques"]
    };

    let systemPrompt = `You are a critic reviewing a movie scene. Please analyze the provided scene text and provide questions and comments about the scene. The questions should be deep, relevant and pertaining to the scene, the business of making the scene. For example, if the scene requires a lot of special effects, you might ask about the budget for the scene, or the time it will take to shoot the scene. The comments should be relevant, and aim to be constructive. For example, you might comment on the originality, creativity, and quality of the scene, and the emotional impact of the scene.`;
    
let userPrompt = `Please critique this scene from the perspective of a producer whose money is in it deep.:\n\n"${sceneText}"\n\nBE HARSH REALISTIC, AND CONSTRUCTIVE. LOOK AT THINGS FROM DIFFERENT ANGLES`;

    let completion = await OpenAIFunctionCall(
        'gpt-3.5-turbo-1106',
        [
            { role: 'system', content: `${systemPrompt}` },
            { role: 'user', content: `${userPrompt}` },
        ],
        [{ name: 'critiqueScene', parameters: responseSchema }],
        { name: 'critiqueScene' },
        0.1,
        1000,
    );

    let sceneCritiquesResponse = JSON.parse(completion.choices[0].message.function_call.arguments);
    console.log(JSON.stringify(sceneCritiquesResponse, null, 2));
    return sceneCritiquesResponse;
};

export const critiqueAllScenes = async (scriptData) => {
    for (const scene of scriptData.scenesData) {
        let sceneCritiques = await critiqueScene(scene);
        let sceneIndex = scene.sceneIndex;
        scene.sceneCritiques = sceneCritiques;

        console.log(chalk.dim(`\n--------------------- Scene Critiques for Scene:`),chalk.yellow(`${sceneIndex + 1}`),chalk.dim(` ---------------------\n`));
        console.log(chalk.cyan(`Scene Id:`, chalk.yellow(scene.sceneId)));
        console.log(chalk.cyan(`Scene Index:`, chalk.yellow(scene.sceneIndex + 1)));
        console.log(chalk.cyan(`Scene Slug:`), chalk.yellow(scene.sceneHeader));
        console.log(chalk.cyan(`Scene Critiques:\n`));
        console.log(chalk.dim(`-----`));

        console.log(chalk.cyan(`\nQuestions:\n`));
        
        sceneCritiques.sceneQuestions.forEach((question, index) => {
            console.log(`${chalk.cyan(`${index + 1}`)}: ${chalk.yellow(question)}`);
        });
        console.log(chalk.cyan(`\nComments:\n`));

        sceneCritiques.sceneComments.forEach((comment, index) => {
            console.log(`${chalk.cyan(`${index + 1}`)}: ${chalk.yellow(comment)}`);
        });

        console.log(chalk.cyan(`\nCritiques:\n`));

        sceneCritiques.sceneCritiques.forEach((critique, index) => {
            console.log(`${chalk.cyan(`${index + 1}`)}: ${chalk.yellow(critique)}`);
        });
        
        console.log(chalk.dim(`-----`));
        console.log(chalk.dim(`\n--------------------- END Critiques For Scene:`), chalk.yellow(`${sceneIndex + 1}`), chalk.dim(` ---------------------\n`));
    }
};
