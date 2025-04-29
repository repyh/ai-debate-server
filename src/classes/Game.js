import { GoogleGenerativeAI } from "@google/generative-ai";
// Removed Events import as we are not emitting anymore
import Events from 'events';
import fs from 'fs';

import Case from './Case.js';
import Judge from './Judge.js';

import caseSchema from "../schemas/case_schema.js";
import judgeSchema from "../schemas/judge_schema.js";
import replySchema from "../schemas/reply_schema.js";

// Removed extends Events
class Game extends Events {
    constructor(data) {
        // super(); // Removed super() call
        this.case = data.case;
        this.judge = data.judge;
        this.state = "INIT";
        this.turn = "INIT";
        this.playerRepresent = "PLAINTIFF"; // Default, can be set
        this.gameChat = null; // Initialize gameChat
        this.model = "gemini-2.0-flash-lite";
    }

    async initGame() {
        const caseRulePrompt = fs.readFileSync('./prompts/case_init.txt', 'utf-8'); // Adjusted path assuming execution from root

        // No longer needs to return a promise explicitly, async handles it
        const genAI = new GoogleGenerativeAI(process.env.AI_API);
        const model = genAI.getGenerativeModel({
            model: this.model // Using a recommended model
        });

        const history = [
            {
                role: "user",
                parts: [
                    {
                        text: "YOU ARE GOING TO BE PART OF A NEW GAME SESSION OF A COURTROOM SIMULATOR. YOU ARE GOING AGAINST A REAL HUMAN PLAYER. YOU ARE GOING TO PLAY THE PART OF THE JUDGE, WITNESSES, OPPONENT LAWYER, PLAINTIFF, AND DEFENDANT."
                    },
                    {
                        text: "YOU ARE GOING TO PLAY YOUR PART INDEPENDANTLY AND EXCLUSIVELY FROM OTHER ROLE SO ACT LIKE NO OTHER PEOPLE."
                    },
                    {
                        text: `\n${caseRulePrompt}\n` // Ensure newlines
                    },
                    // Removed the instruction to reply as judge immediately here.
                    // We will ask for the initial message separately.
                    {
                        text: "Judge profile:\n" + JSON.stringify(this.judge)
                    },
                    {
                        text: "Case details:\n" + JSON.stringify(this.case)
                    }
                ]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am ready to proceed with the case simulation based on the provided details and rules. I will act as the Judge initially." }]
            }
        ];

        // Validate history structure if necessary before starting chat
        // console.log("Initial History:", JSON.stringify(history, null, 2));

        const gameChat = model.startChat({
            history: history,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: replySchema,
                temperature: 1.2,
                topP: 0.9
            }
        });

        this.gameChat = gameChat;
        this.state = "INITIALIZED"; // Update state
        console.alert("Game chat initialized.");
    }

    async doInitialJudgeMessage() {
        if (!this.gameChat) {
            throw new Error("Game chat not initialized. Call initGame first.");
        }
        if (this.state !== "INITIALIZED") {
            throw new Error("Game already started or not initialized.");
        }

        console.log("Requesting initial judge message...");
        const result = await this.gameChat.sendMessage(
            `
                AS THE JUDGE, PROVIDE YOUR OPENING STATEMENT TO START THE COURT SESSION.
                ADDRESS BOTH SIDES (PLAINTIFF AND DEFENDANT) AND OUTLINE THE CASE BRIEFLY BASED ON THE PROVIDED DETAILS.
                YOUR RESPONSE SHOULD BE IN THE EXPECTED JSON FORMAT.
                REPLY PROFILE: ${JSON.stringify(this.judge)}
                CASE CONTEXT: ${JSON.stringify(this.case)}
            `
        );
        const response = await result.response.text();
        this.state = "STARTED";
        this.turn = "PLAYER_A";
        
        const resJSON = JSON.parse(response);
        this.emit('game:' + resJSON.nextActionm, resJSON);

        return JSON.parse(response);
    }

    async messageAsPlayer(message) {
        if (!this.gameChat) throw new Error("Game chat not initialized.");
        if (this.state !== "STARTED") throw new Error("Game not started or already finished.");


        console.log("Sending player message to AI...");
        const result = await this.gameChat.sendMessage(
            `
                THE PLAYER (${this.playerRepresent}) HAS SENT A MESSAGE.
                THE MESSAGE IS ADDRESSED TO: [Determine recipient from message context, e.g., Judge, Witness name, Opponent].
                ACT AS THE INTENDED RECIPIENT AND PROVIDE A REALISTIC RESPONSE BASED ON YOUR ROLE, THE CASE CONTEXT, AND THE MESSAGE.
                IF THE MESSAGE IS FOR THE JUDGE, ACT AS THE JUDGE.
                IF THE MESSAGE IS FOR THE OPPONENT LAWYER, ACT AS THE OPPONENT LAWYER.
                IF THE MESSAGE IS FOR A WITNESS, ACT AS THAT WITNESS.
                IF THE MESSAGE IS FOR THE PLAINTIFF/DEFENDANT (and player is not them), ACT AS THEM.

                PLAYER MESSAGE: "${message}"

                CASE CONTEXT: ${JSON.stringify(this.case)}
                YOUR CURRENT ROLE PROFILE (if applicable, e.g., Judge): ${JSON.stringify(this.judge)} // Adapt based on recipient

                WHAT IS YOUR REPLY AND ACTION (as the recipient)? ENSURE THE RESPONSE IS IN THE REQUIRED JSON FORMAT.
            `
        );
        const response = await result.response.text();
        console.log("Received AI response to player message.");

        return JSON.parse(response);
    }

    async messageAsOpponentLawyer(message) {
        if (!this.gameChat) throw new Error("Game chat not initialized.");

        const result = await this.gameChat.sendMessage(
            `
                YOU ARE GOING TO ACT AS THE OPPONENT LAWYER.
                CASE CONTEXT: ${JSON.stringify(this.case)}
                YOU WERE CALLED UPON BY SOMEONE TO PROVIDE A REPLY.
                MESSAGE: ${message}

                WHAT IS YOUR REPLY? (Return JSON)
            `
        )
        const response = await result.response.text();
        return JSON.parse(response);
    }

    async messageAsJudge(message) {
        if (!this.gameChat) throw new Error("Game chat not initialized.");

        const result = await this.gameChat.sendMessage(
            `
                YOU ARE GOING TO ACT AS THE JUDGE.
                CASE CONTEXT: ${JSON.stringify(this.case)}
                MESSAGE: ${message}

                WHAT IS YOUR REPLY? (Return JSON)
                REPLY PROFILE: ${JSON.stringify(this.judge)}
            `
        );
        const response = await result.response.text();
        return JSON.parse(response); 
    }

    async messageAsWitness(message, witnessName) {
        if (!this.gameChat) throw new Error("Game chat not initialized.");

        const witnessProfile = [...(this.case.defendantWitnesses || []), ...(this.case.plaintiffWitnesses || [])].find(w => w.name === witnessName);
        if (!witnessProfile) throw new Error(`Witness ${witnessName} not found in case.`);

        const result = await this.gameChat.sendMessage(
            `
                YOU ARE GOING TO ACT AS THE WITNESS: ${witnessName}.
                CASE CONTEXT: ${JSON.stringify(this.case)}
                PROFILE OF WITNESS: ${JSON.stringify(witnessProfile)}
                MESSAGE: ${message}

                WHAT IS YOUR REPLY? (Return JSON)
            `
        );
        const response = await result.response.text();
        return JSON.parse(response);
    }

    async messageAsPlaintiff(message) {
        if (!this.gameChat) throw new Error("Game chat not initialized.");
        
        const result = await this.gameChat.sendMessage(
            `
                YOU ARE GOING TO ACT AS THE PLAINTIFF.
                CASE CONTEXT: ${JSON.stringify(this.case)}
                PROFILE OF PLAINTIFF: ${JSON.stringify(this.case.plaintiff)}
                MESSAGE: ${message}

                WHAT IS YOUR REPLY? (Return JSON)
            `
        );
        const response = await result.response.text();
        return JSON.parse(response);
    }

    async messageAsDefendant(message) {
        if (!this.gameChat) throw new Error("Game chat not initialized.");
        
        const result = await this.gameChat.sendMessage(
            `
                YOU ARE GOING TO ACT AS THE DEFENDANT.
                CASE CONTEXT: ${JSON.stringify(this.case)}
                PROFILE OF DEFENDANT: ${JSON.stringify(this.case.defendant)}
                MESSAGE: ${message}

                WHAT IS YOUR REPLY? (Return JSON)
            `
        );
        const response = await result.response.text();
        return JSON.parse(response);
    }

    static async generateCase(requestedPrompt, caseType, baseTopic) {
        const prompt = (
            requestedPrompt ??
            `Generate a sample ${caseType} case on a topic of: ${baseTopic} \ncase (RANDOM AND VARY YOUR RESPONSES) court case for a game in a format of below (the case should be able to be concluded with the information generated) MAKE SURE THE HIDDENDETAILS CAN BE REVEALED/CONCLUDED BASED ON OTHER AVAILABLE DETAILS SUCH AS PLAINTIFF DETAIL, DEFENDANT DETAIL, FACTS, EVIDENCE, AND REGULAR DETAILS:`
        );

        const genAI = new GoogleGenerativeAI(process.env.AI_API);
        const model = genAI.getGenerativeModel({
            model: this.model,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: caseSchema,
                temperature: 1.5, // Slightly higher temp for more varied cases
                topP: 0.9
            },
            // cachedContent: false // Consider if caching is needed here
        });

        console.log("Generating case...");
        const result = await model.generateContent(prompt);
        const caseData = JSON.parse(result.response.text());
        console.log("Case generated.");
        return new Case(caseData);
    }

    static async generateJudgeProfile() {
        const prompt = "Generate a unique and detailed judge profile (name, personality, background, judicial philosophy) for a courtroom simulation game. Ensure the profile is distinct each time. Respond ONLY with the JSON object matching the required schema.";

        const genAI = new GoogleGenerativeAI(process.env.AI_API);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: judgeSchema,
                temperature: 1.2,
                topP: 0.9
            },
        });

        console.log("Generating judge profile...");
        const result = await model.generateContent(prompt);
        const judgeData = JSON.parse(result.response.text());
        console.log("Judge profile generated.");
        return new Judge(judgeData);
    }
}

export default Game;