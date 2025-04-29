import { Type as SchemaType } from "@google/genai";

const moderatorSchema = {
    type: SchemaType.OBJECT,
    description: "Schema for an AI Debate Moderator profile.",
    properties: {
        name: {
            type: SchemaType.STRING,
            description: "The name of the AI moderator for this debate session."
        },
        personality: {
            type: SchemaType.STRING,
            description: "A brief description of the moderator's personality (e.g., 'Fair and balanced', 'Inquisitive and probing', 'Formal and structured')."
        },
        moderationStyle: {
            type: SchemaType.STRING,
            description: "A brief description of how the moderator runs the debate (e.g., 'Encourages direct responses between debaters', 'Focuses on evidence and sources', 'Keeps discussion strictly on topic and time')."
        }
    },
    required: ["name", "personality", "moderationStyle"]
};

export default moderatorSchema;
