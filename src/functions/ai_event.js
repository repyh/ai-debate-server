import chalk from "chalk";
import PromptSync from "prompt-sync";

const prompt = PromptSync();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function handleAIEvent(game) {
    game.on("game:CALL_PLAYER", async (payload) => {
        const input = prompt(chalk.greenBright("Your reply: "));
        console.log('');
        // console.log(input);
        game.messageAsPlayer(input);
    })

    game.on("game:CALL_OPPONENT_LAWYER", async (payload) => {
        await sleep(3000);
        game.messageAsOpponentLawyer("context request data: " + JSON.stringify(payload) + "\n\n" + payload.reply);
    })

    game.on("game:CALL_PLAINTIFF", async (payload) => {
        await sleep(3000);
        game.messageAsPlaintiff("context request data: " + JSON.stringify(payload) + "\n\n" + payload.reply);
    })

    game.on("game:CALL_DEFENDANT", async (payload) => {
        await sleep(3000);
        game.messageAsDefendant("context request data: " + JSON.stringify(payload) + "\n\n" + payload.reply);
    })

    game.on("game:CALL_WITNESS", async (payload) => {
        await sleep(3000);
        game.messageAsWitness("context request data: " + JSON.stringify(payload) + "\n\n" + payload.reply);
    })

    game.on("game:DISMISS_PLAYER", async (payload) => {
        await sleep(3000);
        game.messageAsJudge("You have dismissed the player, you may now continue according to the flow of the court. DO NOT REPLY WITH THE PREVIOUS REQUEST. PREVIOUS REQUEST: " + JSON.stringify(payload.reply))
    })

    game.on("game:DISMISS_OPPONENT_LAWYER", async (payload) => {
        await sleep(3000);
        game.messageAsJudge("You have dismissed the opponent lawyer, you may now continue according to the flow of the court. DO NOT REPLY WITH THE PREVIOUS REQUEST. PREVIOUS REQUEST: " + JSON.stringify(payload.reply))
    })

    game.on("game:DISMISS_PLAINTIFF", async (payload) => {
        await sleep(3000);
        game.messageAsJudge("You have dismissed the plaintiff, you may now continue according to the flow of the court. DO NOT REPLY WITH THE PREVIOUS REQUEST. PREVIOUS REQUEST: " + JSON.stringify(payload.reply))
    })

    game.on("game:DISMISS_DEFENDANT", async (payload) => {
        await sleep(3000);
        game.messageAsJudge("You have dismissed the defendant, you may now continue according to the flow of the court. DO NOT REPLY WITH THE PREVIOUS REQUEST. PREVIOUS REQUEST: " + JSON.stringify(payload.reply))
    })

    game.on("game:DISMISS_WITNESS", async (payload) => {
        await sleep(3000);
        game.messageAsJudge("You have dismissed the witness, you may now continue according to the flow of the court. DO NOT REPLY WITH THE PREVIOUS REQUEST. PREVIOUS REQUEST: " + JSON.stringify(payload.reply))
    })

    game.on("game:END_COURT", async (payload) => {
        console.log("\nCOURT IS DONE!")
    })  
}

export default handleAIEvent;