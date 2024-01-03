import chalk from 'chalk';



const classifySceneLines = async (scriptData) => {
    for (const scene of scriptData.scenesData) {
        for (let j = 0; j < scene.sceneLines.length; j++) {
            const line = scene.sceneLines[j];
            const lineText = line.sceneLineText;
            const lineIsEmpty = !lineText.trim();
            const hasParenthesis = lineText.includes('(') && lineText.includes(')');
            const isVoiceOver = /V\.O\.|VO|V\.O|VOICE OVER/i.test(lineText);

            const isActionDirection = /CUT TO:|FADE IN:|FADE OUT:|DISSOLVE TO:|ANGLE ON:|EXT\.|INT\.|CLOSE ON:|PAN TO:|ZOOM IN:|establishing shot/i.test(lineText);

            if (lineIsEmpty) {
                line.sceneLineType = 'whitespace';
            } else if (j === 0 && scene.sceneHeader === lineText) {
                line.sceneLineType = 'header';
            } else if (isVoiceOver) {
                line.sceneLineType = 'voiceover';
            } else if (hasParenthesis) {
                line.sceneLineType = 'parenthesis';
            } else if (line.elementMatchType) {
                // Utilize the elementMatchType for classification
                switch (line.elementMatchType) {
                    case 'singleItem':
                        line.sceneLineType = 'singleElement';
                        break;
                    case 'multiItem':
                        line.sceneLineType = 'groupElement';
                        break;
                    case 'parentheticalItem':
                        line.sceneLineType = 'parenthesis';
                        break;
                    default:
                        line.sceneLineType = 'noElement';
                }
            }
        }
    };

    return scriptData;
}

/**
 * Creates a concatenated string of scene lines for each scene in the script data.
 * This string is stored in the 'sceneCleanText' property of each scene object.
 * Each line of text is separated by '\\', and newline characters are removed.
 * @param {Object} scriptData - Script data object containing scenes data.
 * @returns {Object} The updated script data object with 'sceneCleanText' set for each scene.
 */
const createsceneCleanText = async (scriptData) => {
    let scenesData = scriptData.scenesData;
    for (const scene of scenesData) {
        let sceneCleanText = '';
        for (let i = 0; i < scene.sceneLines.length; i++) {
            // Remove newline characters and concatenate with '\\'
            sceneCleanText += scene.sceneLines[i].sceneLineText.replace(/\n/g, '') + '\\';
        }

        // Trim the last '\\' if present
        scene.sceneCleanText = sceneCleanText.endsWith('\\') ? sceneCleanText.slice(0, -1) : sceneCleanText;
    }

    scriptData.scenesData = scenesData;

    return scriptData;
};




export const parseCleanup = async (scriptData) => {



    console.log(chalk.cyan(`\nCleaning Up Script ->`));
    await classifySceneLines(scriptData);
    await createsceneCleanText(scriptData);
    console.log(chalk.dim(`✔︎`));
    return scriptData;
};
