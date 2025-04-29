import { SchemaType } from "@google/generative-ai";

// Updated schema for a 2-player debate judged by AI
const debateReplySchema = {
    type: SchemaType.OBJECT,
    description: "Schema for the AI Judge's response in a two-player debate.",
    properties: {
        judgeName: {
            type: SchemaType.STRING,
            description: "The name of the AI Judge presiding over the debate."
        },
        reply: {
            type: SchemaType.STRING,
            description: "The Judge's statement, question, or instruction directed to one or both players."
        },
        nextAction: {
            type: SchemaType.STRING,
            description: "Indicates the next required step or whose turn it is in the debate.",
            enum: [
                "REQUEST_PLAYER_A_OPENING", // Start: Ask Player 1 for opening statement
                "REQUEST_PLAYER_B_OPENING", // Ask Player 2 for opening statement
                "REQUEST_PLAYER_A_ARGUMENT", // Ask Player 1 for their argument/turn
                "REQUEST_PLAYER_B_ARGUMENT", // Ask Player 2 for their argument/turn
                // "REQUEST_PLAYER_A_REBUTTAL", // Ask Player 1 for a rebuttal
                // "REQUEST_PLAYER_B_REBUTTAL", // Ask Player 2 for a rebuttal
                // "REQUEST_CLARIFICATION_A", // Judge asks Player 1 a specific question
                // "REQUEST_CLARIFICATION_B", // Judge asks Player 2 a specific question
                "PROVIDE_INTERIM_SUMMARY", // Judge provides a summary of the debate so far
                "REQUEST_CLOSING_STATEMENT_A", // Ask Player 1 for closing statement
                "REQUEST_CLOSING_STATEMENT_B", // Ask Player 2 for closing statement
                // "DELIBERATING", // Judge indicates they are considering the arguments before the verdict
                "DECLARE_WINNER" // Judge is about to declare the winner and end the debate
            ]
        },
        targetPlayer: {
            type: SchemaType.STRING,
            description: "Specifies which player the judge's reply or question is primarily directed towards, if applicable.",
            enum: ["PLAYER_A", "PLAYER_B"] // Optional, helps clarify who should respond
        },
        verdict: {
            type: SchemaType.STRING,
            description: "The final verdict of the debate. This field MUST be included and populated ONLY when nextAction is 'DECLARE_WINNER'.",
            enum: [
                "PLAYER_A_WINS",
                "PLAYER_A_WINS",
                "DRAW"
            ]
        },
        reasoning: {
            type: SchemaType.STRING,
            description: "Optional: The Judge's reasoning behind the verdict or a request for clarification. Especially important when declaring a winner."
        }
    },
    // Define required fields for a valid Judge response
    required: ["judgeName", "reply", "nextAction"]
};

export default debateReplySchema;