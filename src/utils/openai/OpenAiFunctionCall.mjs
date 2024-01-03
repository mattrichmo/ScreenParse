import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { tokenTrackOpenAI } from './tokenTrackerOpenAi.mjs';



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

            //console.log(JSON.stringify(completion, null, 2))


            try {

                
                JSON.parse(completion.choices[0].message.function_call.arguments);

                return completion;

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






