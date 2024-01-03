import { v4 as uuidv4 } from 'uuid'; 
import chalk from 'chalk';

export const tokenTrackOpenAI = async (completion) => {
    const openAiCallUUID = uuidv4();
    const model = completion.model;
    const usage = completion.usage;

    const cost = calculateCost(model, usage);


    // Create an object to track the OpenAI call
    const openAiCall = {
        openAiCallUUID: openAiCallUUID,
        openAiRawCompletion: completion,
        cost: cost
    };

    console.log(openAiCall)


    return openAiCall
};

function calculateCost(model, usage) {
    let costPerInputToken, costPerOutputToken;

    switch (model) {
        case 'gpt-4-1106-preview':
        case 'gpt-4-1106-vision-preview':
            costPerInputToken = 0.01 / 1000;
            costPerOutputToken = 0.03 / 1000;
            break;
        case 'gpt-4':
            costPerInputToken = 0.03 / 1000;
            costPerOutputToken = 0.06 / 1000;
            break;
        case 'gpt-4-32k':
            costPerInputToken = 0.06 / 1000;
            costPerOutputToken = 0.12 / 1000;
            break;
        case 'gpt-3.5-turbo-1106':
            costPerInputToken = 0.0010 / 1000;
            costPerOutputToken = 0.0020 / 1000;
            break;
        default:
            // Defaulting to gpt-3.5-turbo-1106 if model is not recognized
            costPerInputToken = 0.0010 / 1000;
            costPerOutputToken = 0.0020 / 1000;
            break;
    }

    // Calculate costs based on usage
    const cost = {
        costPromptUSD: usage.prompt_tokens * costPerInputToken,
        costCompletionUSD: usage.completion_tokens * costPerOutputToken,
        costTotalUSD: (usage.prompt_tokens * costPerInputToken) + (usage.completion_tokens * costPerOutputToken),
    }

    return cost;
}
