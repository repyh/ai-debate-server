import { SchemaType } from '@google/generative-ai';

const caseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        title: {
            type: SchemaType.STRING,
            description: "Title of the case"
        },
        type: {
            type: SchemaType.STRING,
            description: "Type of the case",
            enum: ["CRIMINAL", "CIVIL", "DIVORCE", "APPEAL"]
        },
        context: {
            type: SchemaType.STRING,
            description: "Short summary of the case"
        },
        summary: {
            type: SchemaType.STRING,
            description: "Detailed summary of the case"
        },
        defendantWitnesses: {
            type: SchemaType.ARRAY,
            description: "List of witnesses in the case for defendant",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: {
                        type: SchemaType.STRING,
                        description: "Name of the witness"
                    },
                    occupation: {
                        type: SchemaType.STRING,
                        description: "Occupation of the witness"
                    },
                    address: {
                        type: SchemaType.STRING,
                        description: "Address of the witness"
                    },
                    details: {
                        type: SchemaType.ARRAY,
                        description: "Details of the witness needed for the case. THE WITNESS CANNOT BE THE ATTORNEY OF EITHER THE DEFENDANT OR PLAINTIFF.",
                        items: {
                            type: SchemaType.STRING,
                            description: "descriptive details"
                        },
                        minItems: 5
                    },
                    testimony: {
                        type: SchemaType.STRING,
                        description: "What the witness said to the courtroom. Use first person perspective."
                    },
                    relation: {
                        type: SchemaType.STRING,
                        description: "How the witness relates to the case. For example: 'saw the defendant at the crime scene' or 'was involved with defendant/plaintiff in previous case', or etc"
                    },
                    side: {
                        type: SchemaType.STRING,
                        description: "Side the witness is on",
                        enum: ["PLAINTIFF", "DEFENDANT"]
                    },
                    hiddenDetails: {
                        type: SchemaType.ARRAY,
                        description: "Hidden details of the witness known only to the witness in points. MINIMUM OF 5 ITEMS REQUIRED",
                        items: {
                            type: SchemaType.STRING,
                            description: "descriptive details"
                        },
                        minItems: 7
                    }
                },
                required: ["name", "occupation", "address", "details", "testimony", "side", "hiddenDetails"]
            },
            minItems: 5
        },
        plaintiffWitnesses: {
            type: SchemaType.ARRAY,
            description: "List of witnesses in the case for plaintiff",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: {
                        type: SchemaType.STRING,
                        description: "Name of the witness"
                    },
                    occupation: {
                        type: SchemaType.STRING,
                        description: "Occupation of the witness"
                    },
                    address: {
                        type: SchemaType.STRING,
                        description: "Address of the witness"
                    },
                    details: {
                        type: SchemaType.ARRAY,
                        description: "Details of the witness needed for the case. THE WITNESS CANNOT BE THE ATTORNEY OF EITHER THE DEFENDANT OR PLAINTIFF.",
                        items: {
                            type: SchemaType.STRING,
                            description: "descriptive details"
                        },
                        minItems: 5
                    },
                    testimony: {
                        type: SchemaType.STRING,
                        description: "What the witness said to the courtroom. Use first person perspective."
                    },
                    relation: {
                        type: SchemaType.STRING,
                        description: "How the witness relates to the case. For example: 'saw the defendant at the crime scene' or 'was involved with defendant/plaintiff in previous case', or etc"
                    },
                    side: {
                        type: SchemaType.STRING,
                        description: "Side the witness is on",
                        enum: ["PLAINTIFF", "DEFENDANT"]
                    },
                    hiddenDetails: {
                        type: SchemaType.ARRAY,
                        description: "Hidden details of the witness known only to the witness in points. MINIMUM OF 5 ITEMS REQUIRED",
                        items: {
                            type: SchemaType.STRING,
                            description: "descriptive details"
                        },
                        minItems: 7
                    }
                },
                required: ["name", "occupation", "address", "details", "testimony", "side", "hiddenDetails"]
            },
            minItems: 5
        },
        plaintiff: {
            type: SchemaType.OBJECT,
            description: "Plaintiff details",
            properties: {
                name: {
                    type: SchemaType.STRING,
                    description: "Name of the plaintiff"
                },
                occupation: {
                    type: SchemaType.STRING,
                    description: "Occupation of the plaintiff"
                },
                address: {
                    type: SchemaType.STRING,
                    description: "Address of the plaintiff"
                },
                details: {
                    type: SchemaType.ARRAY,
                    description: "Details of the plaintiff needed for the case in points",
                    items: {
                        type: SchemaType.STRING,
                        description: "descriptive details"
                    },
                    minItems: 5
                },
                hiddenDetails: {
                    type: SchemaType.ARRAY,
                    description: "Hidden details of the plaintiff known only to the plaintiff in points. MINIMUM OF 10 ITEMS REQUIRED",
                    items: {
                        type: SchemaType.STRING,
                        description: "descriptive details"
                    },
                }
            },
            required: ["name", "occupation", "address", "details", "hiddenDetails"]
        },
        defendant: {
            type: SchemaType.OBJECT,
            description: "Defendant details",
            properties: {
                name: {
                    type: SchemaType.STRING,
                    description: "Name of the defendant"
                },
                occupation: {
                    type: SchemaType.STRING,
                    description: "Occupation of the defendant"
                },
                address: {
                    type: SchemaType.STRING,
                    description: "Address of the defendant"
                },
                details: {
                    type: SchemaType.ARRAY,
                    description: "Details of the defendant needed for the case",
                    items: {
                        type: SchemaType.STRING,
                        description: "descriptive details"
                    },
                    minItems: 5
                },
                hiddenDetails: {
                    type: SchemaType.ARRAY,
                    description: "Hidden details of the defendant known only to the defendant in points. MINIMUM OF 10 ITEMS REQUIRED",
                    items: {
                        type: SchemaType.STRING,
                        description: "descriptive details"
                    },
                }
            },
            required: ["name", "occupation", "address", "details", "hiddenDetails"]
        },
        details: {
            type: SchemaType.ARRAY,
            description: "All details of the cases in points. MINIMUM OF 10 ITEMS REQUIRED",
            items: {
                type: SchemaType.STRING
            },
            minItems: 10
        },
        hiddenDetails: {
            type: SchemaType.ARRAY,
            description: "Hidden details of the cases in points. MINIMUM OF 10 ITEMS REQUIRED",
            items: {
                type: SchemaType.STRING
            },
            minItems: 10
        },
        evidence: {
            type: SchemaType.ARRAY,
            description: "Evidence of the case in points, may include things related to one or several of the witnesses, may also not, for example: 'there was a chat history providing a verbal agreement was made', 'there was a photo of the defendant with x', 'there was a dna of the defendant', etc. MINIMUM OF 10 ITEMS REQUIRED",
            items: {
                type: SchemaType.STRING
            },
            minItems: 10
        },
        facts: {
            type: SchemaType.ARRAY,
            description: "Facts of the case needed for the court in points. MINIMUM OF 10 ITEMS REQUIRED",
            items: {
                type: SchemaType.STRING
            },
            minItems: 10
        },
        truth: {
            type: SchemaType.STRING,
            description: "Truth of the case"
        },
        plaintiffType: {
            type: SchemaType.STRING,
            description: "Type of the plaintiff",
            enum: ["INDIVIDUAL", "CORPORATION", "GOVERNMENT"]
        },
        defendantType: {
            type: SchemaType.STRING,
            description: "Type of the defendant",
            enum: ["INDIVIDUAL", "CORPORATION", "GOVERNMENT"]
        }
    },
    required: [
        "title",
        "context",
        "summary",
        "plaintiff",
        "defendant",
        "details",
        "hiddenDetails",
        "evidence",
        "facts",
        "truth",
        "plaintiffType",
        "defendantType",
        "type"
    ]
};

export default caseSchema;