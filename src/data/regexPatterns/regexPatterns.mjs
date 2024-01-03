export const sceneHeaderRegex = [
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


export const elementRegex = /(\b[A-Z]{2,}(?:\s[A-Z]+)*(?=\s\p{P}|\s[a-z]|$)|\([A-Z\s]+\)|^\([^\)]*\)$)/g;
export const validElementCategoryTypes = ["CAST", "PROP", "LOCATION", "TRANSITION", "SOUND", "ACTION", "SHOT", "ANIMAL", "VEHICLE", "MUSIC", "WEATHER", "TIME", "DATE", "DURATION", "CAMERA"];

