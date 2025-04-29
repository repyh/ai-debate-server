import { Type as SchemaType } from "@google/genai";

const debateTopicSchema = {
    type: SchemaType.OBJECT,
    description: "Schema for a debate topic based on UN Sustainable Development Goals (SDGs).",
    properties: {
        sdgGoal: {
            type: SchemaType.INTEGER,
            description: "The number (1-17) of the relevant UN SDG.",
            minimum: 1,
            maximum: 17
        },
        sdgTitle: {
            type: SchemaType.STRING,
            description: "The official title of the relevant UN SDG."
        },
        topic: {
            type: SchemaType.STRING,
            description: "The specific, debatable statement or question related to the SDG for this debate session."
        },
        context: {
            type: SchemaType.STRING,
            description: "Brief background information or context for the specific debate topic."
        },
        sideA_stance: {
            type: SchemaType.STRING,
            description: "A suggested initial perspective or stance for Debater A (e.g., 'Proposes solution X', 'Argues for policy Y')."
        },
        sideB_stance: {
            type: SchemaType.STRING,
            description: "A suggested initial perspective or stance for Debater B (e.g., 'Argues against solution X', 'Proposes alternative Z')."
        }
    },
    required: ["sdgGoal", "sdgTitle", "topic", "context", "sideA_stance", "sideB_stance"]
};

export default debateTopicSchema;
