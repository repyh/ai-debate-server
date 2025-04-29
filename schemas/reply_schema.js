import { Type as SchemaType } from "@google/genai";

// Updated schema for AI Moderator's response in a two-player debate
const debateReplySchema = {
    type: SchemaType.OBJECT,
    description: "Schema for the AI Moderator's response during the debate.", // Simplified
    properties: {
        moderatorName: { // Renamed from judgeName
            type: SchemaType.STRING,
            description: "The name of the AI Moderator facilitating the debate."
        },
        reply: {
            type: SchemaType.STRING,
            description: "The Moderator's spoken statement, question, or instruction directed to one or both debaters." // Clarified
        },
        nextAction: {
            type: SchemaType.STRING,
            description: "Indicates the next required step or phase in the debate structure.", // Clarified
            enum: [
                "REQUEST_OPENING_A", // Start: Ask Debater A for opening statement
                "REQUEST_OPENING_B", // Ask Debater B for opening statement
                "REQUEST_ARGUMENT_A", // Ask Debater A for their argument/turn
                "REQUEST_ARGUMENT_B", // Ask Debater B for their argument/turn
                "REQUEST_REBUTTAL_A", // Ask Debater A for a rebuttal
                "REQUEST_REBUTTAL_B", // Ask Debater B for a rebuttal
                "REQUEST_CLARIFICATION_A", // Moderator asks Debater A a specific question
                "REQUEST_CLARIFICATION_B", // Moderator asks Debater B a specific question
                "PROVIDE_INTERIM_SUMMARY", // Moderator provides a brief summary of the debate so far
                "REQUEST_CLOSING_A", // Ask Debater A for closing statement
                "REQUEST_CLOSING_B", // Ask Debater B for closing statement
                "DELIBERATING", // Moderator indicates they are considering the arguments before the decision (Optional intermediate step)
                "DECLARE_WINNER" // Moderator is about to declare the outcome and end the debate
            ]
        },
        nextTurn: {
            type: SchemaType.STRING,
            description: "Indicates which debater's turn it is to speak next.",
            enum: [
                "DEBATER_A", // Debater A's turn
                "DEBATER_B" // Debater B's turn
            ]
        },
        targetDebater: { // Renamed from targetPlayer
            type: SchemaType.STRING,
            description: "Specifies which debater the moderator's reply or question is primarily directed towards (DEBATER_A or DEBATER_B), if applicable.", // Clarified
            enum: ["DEBATER_A", "DEBATER_B"],
            nullable: true
        },
        decision: { // Renamed from verdict
            type: SchemaType.STRING,
            description: "The final decision on the debate's outcome (e.g., which side presented a stronger argument based on the SDG topic). This field MUST be included and populated ONLY when nextAction is 'DECLARE_WINNER'.", // Clarified
            enum: [
                "DEBATER_A_WINS",
                "DEBATER_B_WINS",
                "DRAW"
            ],
            nullable: true
        },
        reasoning: {
            type: SchemaType.STRING,
            description: "Optional: The Moderator's concise reasoning behind the final decision or a request for clarification. Especially important when declaring a winner.", // Clarified
            nullable: true
        }
    },
    // Define required fields for a valid Moderator response
    required: ["moderatorName", "reply", "nextAction", "nextTurn"]
};

export default debateReplySchema;