let rawDocument = {
    meta: {
        rawDocumentId: '',
        url: '',
        rawDocumentType: '',
        rawDocumentName: '',
        rawDocumentSizeBytes: 0,
        rawDocumentPageCount: 0,
        rawDocumentAllLinesCount: 0,
    },
    rawDocumentPages: [],
    rawDocumentLines: [],
    rawDocumentString: '',
};



let script = {
    meta: {
        scriptId: '',
        scriptName: '',
        authors: [{
            authorId: '',
            authorName: '',
            authorRole: '',
        }],
    },
    cover: {
        coverId: '',
        scriptTitle: '',
        scriptSubtitle: '',

    },
    scenes: [{
        sceneId: '',
        sceneHeader: '',
        sceneIndex: 0,
        sceneCleanText: '',
        sceneLines: [{
            sceneId: '',
            sceneLineId: '',
            sceneLineText: '',
            sceneLineType: '',
        }],
        elements: [{
            elementId: '',
            sceneId: '',
            elementLineId: '',
            sceneLineNum: 0,
            elementText: '',
            elementType: '',
            elementLineText: '',
        }],
    }],

};

let scriptData = {
    scenesData: [{
        sceneId: '',
        sceneHeader: '',
        sceneIndex: 0,
        sceneCleanText: '',
        sceneLines: [{
            sceneId: '',
            sceneLineId: '',
            sceneLineText: '',
            sceneLineType: '',
        }],
        elements: [{
            elementId: '',
            sceneId: '',
            elementText: '',
            elementClass: '',
            elementLines:[{
                elementLineId: '',
                sceneLineNum: 0,
                sceneLineText: '',
            }]
        }],

    }],
    scriptBusiness: {
        useageData: {
            openaiCalls: [{
             openAiCallUUID: ``,
             openAiRawCompletion: {},
             cost: {
                 costPromptUSD: 0,
                 costCompletion: 0,
                 costTotal: 0,
     
             }
            }],
            totals: {
             totalPromptTokens: 0,
             totalCompletionTokens: 0,
             totalTokens: 0,
             totalPromptCost: 0,
             totalCompletionCost: 0,
             totalCost: 0,
            }
        }
    },
    masterElements: {
        allElements : [{
            masterElementId: '',
            elementText: '',
            elementClass: '',
            sceneAppearences: [{
                sceneId: '',
                sceneNum: 0,
                sceneLineAppearences: [{
                    lineId: '',
                    lineNum: 0,
                    lineText: '',
                }],
            }],
        }],
        sortedElements: {
            cast: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    dialogueSets: [{
                        dialogueSetId: '',
                        dialogueSetNum: 0,
                        dialogueLines: [{
                            dialogueId: '',
                            dialogueNum: 0,
                            dialogueText: '',
                        }],
                    }],
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],

                }],
            }],
            props: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            locations: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            parenthesis: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            transitions: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            sounds: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            action: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }], 
            }],
            shot: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }], 
                }],
            }],
            animal: [{
                masterElementId: '',
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '', 
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0, 
                        lineText: '',
                    }],
                }],
            }],
            vehicle: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0, 
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            music: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0, 
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            weather: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0, 
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            time: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0, 
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            date: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0, 
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            duration: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '',
                    sceneNum: 0, 
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0,
                        lineText: '',
                    }],
                }],
            }],
            transition: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '', 
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0, 
                        lineText: '',
                    }],
                }],
            }],
            camera: [{
                masterElementId: '', 
                elementText: '',
                elementClass: '',
                sceneAppearences: [{
                    sceneId: '', 
                    sceneNum: 0,
                    sceneLineAppearences: [{
                        lineId: '',
                        lineNum: 0, 
                        lineText: '',
                    }],
                }],
            }],
        },
    },
};


