


// a modified version of ScreenJSON


let script = {
    scriptId: `uuidv4()`,
    meta: {
        cover: {
            title : {
              en: "THE SHAWSHANK REDEMPTION",
              es_mx: "Sueño de fuga"
            },
            authors : ["01979fca-6ac3-479e-9f33-d89498836eb1"],
            additional : {
              "en" : "Based upon the story Rita Hayworth and Shawshank Redemption by Stephen King"
            }
          }
    },
    scenes: {
        sceneHeading: {
            sceneHeadingId: `uuidv4()`,
            sceneHeadingRawText: '',
            setting: '',
            time: '',
            location: '',
        },
        elements: {
            elementId: `uuidv4()`,
        },
        cast: {
            castId: `uuidv4()`,
            castList: [{
                castMemberId: `uuidv4()`,
                castMemberLines: [{
                    castMemberLineId: `uuidv4()`,
                    castMemberLineRawText: '',
                    castMemberLineNum: 0,
                }],
            }],
        },

    },
};
