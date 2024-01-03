import { v4 as uuidv4 } from 'uuid';

let allScriptElements = [{
    elementId: `uuid`,
    elementText: ``,
    elementType: ``, // leave alone for now
    elementSceneLocation: [{
        sceneId: `uuid`,
        elementLineText: ``,
        sceneIndex: 0,
        sceneLineId: `uuid`,
        sceneLineNum: 0,
    }]
}];

let sceneElements = [{
    elementId: `uuid`,
    elementText: ``,
    elementType: ``, // leave alone for now
    elementLineText: ``,
}];


// REGEX RULES: 
// A Single all caps word is considered an element
// consequent all caps words on the same line are considered an element
// if there is a parenthesis following the all cap word(s) on the same line then its part of the same element
// words that are capitalized and in a parenthesis are considered an element
// words of any case in parenthesis on their own line are considered an element

export const parseAllElements = async (parsedScenes) => {
    const allScriptElements = [];

    // Define regex pattern to match sequences of capitalized words/phrases, excluding single-letter words
    const regexPattern = /(\b[A-Z]{2,}(?:\s[A-Z]+)*(?=\s[a-z]|$)|\([A-Z\s]+\)|^\([^\)]*\)$)/g;

    parsedScenes.forEach(scene => {
        scene.elements = [];

        // Start iteration from the second line of each scene
        scene.scenelines.forEach((line, index) => {
            // Skip the first line of each scene
            if (index === 0) return;

            // Extract matches based on the pattern
            const matches = line.sceneLineText.match(regexPattern);

            if (matches && matches.length > 0) {
                matches.forEach(match => {
                    // Check if this element already exists in allScriptElements
                    let existingElement = allScriptElements.find(element => element.elementText === match);

                    if (!existingElement) {
                        // Create new element for allScriptElements
                        existingElement = {
                            elementId: uuidv4(),
                            elementText: match,
                            elementType: ``,
                            elementSceneLocation: [{
                                sceneId: scene.sceneId,
                                elementLineText: line.sceneLineText,
                                sceneIndex: scene.sceneIndex,
                                sceneLineId: line.sceneLineId,
                                sceneLineNum: index
                            }]
                        };
                        allScriptElements.push(existingElement);
                    } else {
                        // Add new location to existing element
                        existingElement.elementSceneLocation.push({
                            sceneId: scene.sceneId,
                            elementLineText: line.sceneLineText,
                            sceneIndex: scene.sceneIndex,
                            sceneLineId: line.sceneLineId,
                            sceneLineNum: index
                        });
                    }

                    // Create new element for this scene's elementsArray
                    const sceneElement = {
                        elementId: existingElement.elementId,
                        elementText: existingElement.elementText,
                        elementType: existingElement.elementType,
                        elementLineText: line.sceneLineText,
                        elementLineId: line.sceneLineId,
                    };
                    scene.elements.push(sceneElement);
                });
            }
        });
    });

    return {allScriptElements, parsedScenes};
};
