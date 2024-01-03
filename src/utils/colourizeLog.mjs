import chalk from 'chalk';

const colors = ['red', 'blue', 'green', 'yellow', 'magenta', 'cyan', 'white'];
const brightColors = colors.map(color => `${color}Bright`);

export const colourizeLog = (obj, depth = 0, isBright = false, isRoot = true) => {
    const colorIndex = depth % colors.length;
    const currentColor = isBright ? brightColors[colorIndex] : colors[colorIndex];
    const indent = ' '.repeat(depth * 2);

    if (isRoot) {
        console.log(Array.isArray(obj) ? '[' : '{');
    }

    if (typeof obj !== 'object' || obj === null) {
        // Directly log non-object types
        console.log(chalk[currentColor](indent + obj));
    } else {
        // Process each child, alternating color intensity between siblings
        Object.keys(obj).forEach((key, index) => {
            const useBright = index % 2 !== 0; // Alternate color intensity
            const value = obj[key];
            const valueStr = typeof value === 'object' && value !== null ? 
                Array.isArray(value) ? '[' : '{' : JSON.stringify(value);
            const coloredKey = chalk[currentColor](indent + key + ': ' + valueStr);

            console.log(coloredKey);

            if (typeof value === 'object' && value !== null) {
                colourizeLog(value, depth + 1, useBright, false);
                const closingIndent = ' '.repeat((depth + 1) * 2);
                console.log(chalk[currentColor](`${closingIndent}${Array.isArray(value) ? ']' : '}'}`));
            }
        });
    }

    if (isRoot) {
        console.log(Array.isArray(obj) ? ']' : '}');
    }
};

export default colourizeLog;