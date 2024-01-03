export const generateResponseSchemas = (parsedScenes) => {
    parsedScenes.forEach(scene => {
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
                            description: `The element type of the element we are categorizing. Choose between Cast, Prop, Animal, Camera Movement, Sound, Location, Action, or Parenthesis. Here is the relevant line for context: "${elementLineText}"`
                        }
                    },
                    required: ["elementType"]
                };

                responseSchema.required.push(elementText);
                addedElements.add(elementText); // Mark this element as added
            }
        });

        // Assign the responseSchema to the scene if it has more properties than just 'meta'
        if (Object.keys(responseSchema.properties).length > 1) {
            scene.responseSchema = responseSchema;
        }
    });

    return parsedScenes;
}

export default generateResponseSchemas;
