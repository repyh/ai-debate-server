import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

// Import new classes and schemas
import DebateTopic from './DebateTopic.js';
import Moderator from './Moderator.js';
import debateTopicSchema from "../../schemas/debate_topic_schema.js";
import moderatorSchema from "../../schemas/moderator_schema.js";
import replySchema from "../../schemas/reply_schema.js"; // Keep reply schema

// Removed extends Events
class Game {
    constructor(data) {
        // Use new property names and roles
        this.topic = data.topic; // Renamed from case
        this.moderator = data.moderator; // Renamed from judge
        this.state = "INIT"; // INIT, INITIALIZED, STARTED, FINISHED
        this.turn = null; // null, DEBATER_A, DEBATER_B
        this.gameChat = null;
        this.model = "gemini-2.0-flash-lite"; // DO NOT CHANGE
        this.playerA = data.playerA; // Connection ID of Debater A
        this.playerB = data.playerB; // Connection ID of Debater B
        this.gameOwner = data.gameOwner; // Connection ID of the owner (Debater A)
        this.gameId = data.gameId;
        // Use new roles
        this.players = new Map(); // Stores { connectionId: { connection: wsConnection, role: 'DEBATER_A' | 'DEBATER_B' } }

        if (data.ownerConnection) {
            // Assign role DEBATER_A to the owner
            const ownerRole = "DEBATER_A";
            this.players.set(this.gameOwner, { connection: data.ownerConnection, role: ownerRole });
        }
    }

    // Update role assignment
    setPlayerA(connectionId, connection) {
        this.playerA = connectionId;
        this.players.set(connectionId, { connection: connection, role: "DEBATER_A" }); // Player A is Debater A
        console.log(`Debater A (${connectionId}) set for game ${this.gameId}`);
    }

    // Update role assignment
    setPlayerB(connectionId, connection) {
        this.playerB = connectionId;
        this.players.set(connectionId, { connection: connection, role: "DEBATER_B" }); // Player B is Debater B
        console.log(`Debater B (${connectionId}) set for game ${this.gameId}`);
    }

    // Helper to get player role
    getPlayerRole(connectionId) {
        const player = this.players.get(connectionId);
        return player ? player.role : null;
    }

    // Removed the switchTurn() method as turns are no longer automatic

    async initGame() {
        // Use renamed prompt file
        const debateRulePrompt = fs.readFileSync('./prompts/debate_init.txt', 'utf-8');
        const genAI = new GoogleGenAI({ apiKey: process.env.AI_API });

        const history = [
            {
                role: "user",
                parts: [
                    // Updated system prompt
                    { text: "YOU ARE GOING TO BE PART OF A NEW GAME SESSION OF A DEBATE SIMULATOR. YOU WILL ACT AS THE AI MODERATOR FOR A DEBATE BETWEEN TWO HUMAN PLAYERS (DEBATER A and DEBATER B)." },
                    { text: "YOU MUST FOLLOW THE PROVIDED RULES AND GUIDE THE DEBATE BASED ON A SPECIFIC UN SUSTAINABLE DEVELOPMENT GOAL (SDG) TOPIC." },
                    { text: `\n${debateRulePrompt}\n` },
                    // Provide moderator profile and topic details
                    { text: "Your Moderator profile:\n" + JSON.stringify(this.moderator) },
                    { text: "Debate Topic details (Based on UN SDGs):\n" + JSON.stringify(this.topic) } // Use this.topic
                ]
            },
            {
                role: "model",
                // Updated initial model response
                parts: [{ text: "Understood. I am ready to moderate the debate based on the provided SDG topic, my profile, and the rules. I will start by introducing the debate and asking Debater A for their opening statement." }]
            }
        ];

        // Use genAI.chats.create as per the documentation example
        const gameChat = genAI.chats.create({
            model: this.model, // Use the instance model name
            history: history,
            config: { // Pass generation config here
                responseMimeType: "application/json",
                responseSchema: replySchema,
                temperature: 1.2,
                topP: 0.9
            }
        });

        this.gameChat = gameChat;
        this.state = "INITIALIZED";
        console.alert("Debate chat initialized."); // Keep console alert generic
    }

    // Renamed method and updated prompt
    async doInitialModeratorMessage() {
        if (!this.gameChat) {
            throw new Error("Game chat not initialized. Call initGame first.");
        }
        if (this.state !== "INITIALIZED") {
            throw new Error("Game already started or not initialized.");
        }

        console.log("Requesting initial moderator message...");
        const prompt = `
                AS THE MODERATOR, PROVIDE YOUR OPENING REMARKS TO START THE DEBATE.
                INTRODUCE YOURSELF, THE DEBATE TOPIC (INCLUDING THE SPECIFIC UN SDG), AND THE DEBATERS (Debater A and Debater B).
                STATE THE BASIC STRUCTURE/RULES BRIEFLY (e.g., opening statements, argument rounds, closing statements).
                YOUR RESPONSE SHOULD BE IN THE EXPECTED JSON FORMAT.
                SPECIFY THAT IT IS DEBATER A's TURN NEXT using the 'nextTurn' field ('DEBATER_A').
                SET the 'nextAction' field to 'REQUEST_OPENING_A'.
                YOUR MODERATOR PROFILE: ${JSON.stringify(this.moderator)}
                DEBATE TOPIC (SDG Focus): ${JSON.stringify(this.topic)} // Use this.topic
            `;
        // Use the object format { message: prompt } for sendMessage
        const result = await this.gameChat.sendMessage({ message: prompt });

        // Access response text directly via result.text
        const responseText = result.text;
        console.log("Received initial moderator response text:", responseText); // Added log
        const parsedResponse = JSON.parse(responseText);

        this.state = "STARTED";
        // Ensure turn uses new role names
        this.turn = parsedResponse.nextTurn || "DEBATER_A"; // Use DEBATER_A
        console.log(`Debate started. Initial turn set to: ${this.turn}`);

        return parsedResponse;
    }

    /**
     * Handles a message sent by a player during their turn.
     * Gets the AI's response and updates the turn based on AI decision.
     * @param {string} connectionId - The ID of the player sending the message.
     * @param {string} message - The text message from the player.
     * @returns {Promise<object>} - The AI's response object.
     */
    async handlePlayerMessage(connectionId, message) {
        if (this.state !== "STARTED") {
            throw new Error("Game not started or already finished.");
        }
        // Check if it's the correct player's turn using new roles
        const expectedPlayerId = this.turn === 'DEBATER_A' ? this.playerA : (this.turn === 'DEBATER_B' ? this.playerB : null);
        if (connectionId !== expectedPlayerId) {
            throw new Error(`Not debater ${connectionId}'s turn (Current turn: ${this.turn}, expected ID: ${expectedPlayerId}).`);
        }
        if (!this.gameChat) {
            throw new Error("Debate chat not initialized.");
        }

        const playerRole = this.getPlayerRole(connectionId);
        if (!playerRole) {
            throw new Error(`Could not determine role for player ${connectionId}.`);
        }

        console.log(`Debater ${connectionId} (${playerRole}) sending message: "${message}"`);

        const aiResponse = await this.getAIResponseToPlayer(playerRole, message);

        // Check if the AI declared a winner
        if (aiResponse && aiResponse.nextAction === 'DECLARE_WINNER') {
            this.state = 'FINISHED';
            this.turn = null; // No more turns
            // Use new field names from schema
            console.log(`Debate ${this.gameId} finished. Decision: ${aiResponse.decision}. Reason: ${aiResponse.reasoning}`);
            // Optionally store verdict details
            // this.verdict = aiResponse.verdict;
            // this.reasoning = aiResponse.reasoning;
        }
        // Update turn only if the game is NOT finished, using new roles
        else if (aiResponse && aiResponse.nextTurn && (aiResponse.nextTurn === 'DEBATER_A' || aiResponse.nextTurn === 'DEBATER_B')) { // Use DEBATER_A/B
            this.turn = aiResponse.nextTurn;
            console.log(`Turn updated by AI to: ${this.turn}`);
        } else if (this.state !== 'FINISHED') { // Only warn if game not finished
            console.warn(`AI Moderator response did not specify a valid nextTurn. Turn remains: ${this.turn}`);
            // If game didn't finish but nextTurn is missing, maybe keep turn or default?
            // For now, we keep the turn as is if it's not explicitly changed and game not finished.
        }

        // TODO: Potentially update game state based on other aiResponse.nextAction values

        return aiResponse;
    }


    /**
     * Gets the AI's response to a player's message.
     * The AI determines the recipient, acts as them, and decides the next turn.
     * @param {string} playerRole - The role ('PLAINTIFF' or 'DEFENDANT') of the player sending the message.
     * @param {string} message - The player's message content.
     * @returns {Promise<object>} - The parsed JSON response from the AI.
     */
    async getAIResponseToPlayer(playerRole, message) {
        // Ensure gameChat is initialized (redundant check if called via handlePlayerMessage, but good practice)
        if (!this.gameChat) throw new Error("Debate chat not initialized.");

        console.log(`Getting AI Moderator response to message from ${playerRole}...`);
        // Updated prompt context and instructions for moderator role
        const prompt = `
                DEBATER ${playerRole === 'DEBATER_A' ? 'A' : 'B'} HAS SENT A MESSAGE/ARGUMENT.
                DEBATER MESSAGE: "${message}"

                CONTEXT:
                - DEBATE TOPIC (SDG Focus): ${JSON.stringify(this.topic)} // Use this.topic
                - YOUR MODERATOR PROFILE: ${JSON.stringify(this.moderator)} // Use this.moderator
                - CURRENT TURN: ${this.turn} (This was the debater who just sent the message)
                - DEBATE HISTORY/RULES: (Refer to initial prompt and ongoing conversation history)

                INSTRUCTIONS AS MODERATOR:
                1. Evaluate the debater's message/argument based on its relevance to the SDG topic, the debate rules, and the current phase.
                2. Provide a relevant moderator response ('reply'). This could be acknowledging the point, asking a clarifying question to the debater, transitioning to the next phase/debater, or reminding of rules/time limits. Keep it concise and neutral.
                3. **Crucially, determine the next logical step ('nextAction') in the debate structure (e.g., REQUEST_ARGUMENT_B, REQUEST_REBUTTAL_A, REQUEST_CLOSING_A, DECLARE_WINNER).** Follow standard debate flow.
                4. **Equally crucially, determine whose turn it should be next ('nextTurn': 'DEBATER_A' or 'DEBATER_B').** This usually alternates but might stay the same if asking for clarification from the current speaker.
                5. Ensure your entire response strictly adheres to the required JSON schema.
                6. If 'nextAction' is 'DECLARE_WINNER', you MUST include the 'decision' ('DEBATER_A_WINS', 'DEBATER_B_WINS', or 'DRAW') and 'reasoning' fields based *only* on the arguments presented during this debate. Otherwise, 'decision' and 'reasoning' should be null or omitted. Base the decision on argument quality, relevance to the SDG topic, and persuasiveness.
            `;
        // Use the object format { message: prompt } for sendMessage
        const result = await this.gameChat.sendMessage({ message: prompt });

        // Access response text directly via result.text
        const responseText = result.text;
        console.log("Received AI Moderator response text:", responseText);

        // ... existing try/catch for parsing ...
        try {
            const parsedResponse = JSON.parse(responseText);
            // ... existing validation ...
            if (parsedResponse.nextAction === 'DECLARE_WINNER' && !parsedResponse.decision) {
                 console.warn("AI Moderator response declared winner but missing 'decision' field.");
                 // Handle error - AI didn't follow instructions
            }
            return parsedResponse;
        } catch (e) {
            console.error("Failed to parse AI Moderator response:", responseText, e);
            throw new Error("Invalid JSON response from AI Moderator.");
        }
    }

    // Removed messageAsOpponentLawyer method
    // Removed messageAsJudge method
    // Removed messageAsWitness method
    // Removed messageAsPlaintiff method
    // Removed messageAsDefendant method

    static defaultModel = "gemini-2.0-flash-lite"; // DO NOT CHANGE

    // Renamed static method and updated prompt
    static async generateDebateTopic(requestedPrompt = null, specificSDG = null) {
        const sdgFocus = specificSDG ? `focusing on UN SDG ${specificSDG}` : `related to one of the 17 UN Sustainable Development Goals (SDGs)`;
        const promptText = (
            requestedPrompt ??
            `Generate a specific, debatable topic ${sdgFocus}. The topic should allow for clear opposing stances (e.g., 'For' vs 'Against', 'Approach X' vs 'Approach Y'). Ensure the topic is specific enough for a focused debate but allows for multiple arguments. Provide brief context. Format the output STRICTLY according to the debateTopicSchema JSON schema, including sdgGoal (1-17), sdgTitle, topic, context, sideA_stance (perspective for Debater A), and sideB_stance (perspective for Debater B). VARY YOUR RESPONSES AND SDG FOCUS.`
        );

        const genAI = new GoogleGenAI({ apiKey: process.env.AI_API });
        console.log("Generating debate topic...");
        // Use the direct generateContent method with config, referencing the static model name
        const result = await genAI.models.generateContent({
            model: Game.defaultModel, // DO NOT CHANGE
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: debateTopicSchema, // Use correct schema
                temperature: 1.5,
                topP: 0.9
            },
        });

        const topicData = JSON.parse(result.text);
        console.log("Debate topic generated:", topicData.topic);
        return new DebateTopic(topicData); // Use renamed class
    }

    // Renamed static method and updated prompt
    static async generateModeratorProfile() {
        const promptText = "Generate a unique and detailed AI debate moderator profile (name, personality, moderationStyle) for a debate simulation game focused on UN SDG topics. Ensure the profile is distinct each time (e.g., different names, styles like 'Inquisitive', 'Formal', 'Encouraging', 'Strict'). Respond ONLY with the JSON object matching the moderatorSchema.";

        const genAI = new GoogleGenAI({ apiKey: process.env.AI_API });
        console.log("Generating moderator profile...");
        // Use the direct generateContent method with config
        const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash-latest", // DO NOT CHANGE
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: moderatorSchema, // Use correct schema
                temperature: 1.2,
                topP: 0.9
            },
        });

        const moderatorData = JSON.parse(result.text);
        console.log("Moderator profile generated:", moderatorData.name);
        return new Moderator(moderatorData); // Use renamed class
    }
}

export default Game;