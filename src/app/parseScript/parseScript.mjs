import {sceneHeaderRegex, elementRegex, validElementCategoryTypes} from '../../data/regexPatterns/regexPatterns.mjs';
import {parseScenes} from './components/parseScenes.mjs';
import { parseCleanup } from './components/parseCleanup.mjs';

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';






// MAIN --------------------------------------------
/**
 * Main function to parse a script from a raw document.
 * This involves parsing scenes, performing cleanup operations, and logging progress.
 * @param {Object} rawDocument - The raw document object containing the script data to be parsed.
 * @returns {Object} The parsed script data object after processing.
 */

export const parseScript = async (rawDocument) => {



    console.log(chalk.cyan(`\nParsing Scenes ->`));
    let scriptData = await parseScenes(rawDocument);
    console.log(chalk.dim(`✔︎`))
    await parseCleanup(scriptData);


    return scriptData;
};

