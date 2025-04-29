import { SchemaType } from "@google/generative-ai";

const judgeSchema = {
    type: SchemaType.OBJECT,
    properties: {
        name: {
            type: SchemaType.STRING,
            description: "Name of the judge"
        },
        occupation: {
            type: SchemaType.STRING,
            description: "Occupation of the judge"
        },
        address: {
            type: SchemaType.STRING,
            description: "Address of the judge"
        },
        details: {
            type: SchemaType.ARRAY,
            description: "Details of the judge needed for the profile in points",
            items: {
                type: SchemaType.STRING,
                description: "descriptive details"
            },
            minItems: 5
        },
        hiddenDetails: {
            type: SchemaType.ARRAY,
            description: "Hidden details of the judge known only to the judge in points. THIS IS USED TO MAKE PERSONALITY. MINIMUM OF 10 ITEMS REQUIRED",
            items: {
                type: SchemaType.STRING,
                description: "descriptive details"
            },
            minItems: 10
        },
        moodLevel: {
            type: SchemaType.STRING,
            description: "Mood level of the judge",
            enum: ["HAPPY", "NEUTRAL", "ANGRY"]
        },
        personality: {
            type: SchemaType.OBJECT,
            description: "Personality of the person",
            properties: {
                introvert: {
                    type: SchemaType.INTEGER,
                    description: "meter of introvertedness of value 0-100 EXCLUSIVELY."
                },
                extrovert: {
                    type: SchemaType.INTEGER,
                    description: "meter of extrovertedness of value 0-100 EXCLUSIVELY."
                },
                emotional: {
                    type: SchemaType.INTEGER,
                    description: "meter of emotionalness of value 0-100 EXCLUSIVELY."
                },
                rational: {
                    type: SchemaType.INTEGER,
                    description: "meter of rationalness of value 0-100 EXCLUSIVELY."
                },
                kind: {
                    type: SchemaType.INTEGER,
                    description: "meter of kindness of value 0-100 EXCLUSIVELY."
                },
                mischief: {
                    type: SchemaType.INTEGER,
                    description: "meter of mischief of value 0-100 EXCLUSIVELY."
                },
                charisma: {
                    type: SchemaType.INTEGER,
                    description: "meter of charisma of value 0-100 EXCLUSIVELY."
                },
                intelligence: {
                    type: SchemaType.INTEGER,
                    description: "meter of intelligence of value 0-100 EXCLUSIVELY."
                },
                wisdom: {
                    type: SchemaType.INTEGER,
                    description: "meter of wisdom of value 0-100 EXCLUSIVELY."
                }
            }
        }
    },
    required: ["name", "occupation", "address", "details", "hiddenDetails", "moodLevel"]
};

export default judgeSchema;