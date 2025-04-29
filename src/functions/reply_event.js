import chalk from "chalk";

function handleReplyEvent(game) {
    game.on("REPLY_AS_JUDGE", async (payload) => {
        // console.log(payload);
        console.log(chalk.redBright(`${payload.whereName} (${payload.asRole}): `) + chalk.white(payload.reply) + '\n');
        game.emit("game:" + payload.eventToEmit, payload);
    });

    game.on("REPLY_AS_PLAINTIFF", async (payload) => {
        // console.log(payload);
        console.log(chalk.bgMagenta(`${payload.whereName} (${payload.asRole}):`) + ' ' + chalk.white(payload.reply) + '\n');
        game.emit("game:" + payload.eventToEmit, payload);
    });

    game.on("REPLY_AS_DEFENDANT", async (payload) => {
        // console.log(payload);
        console.log(chalk.bgGrey(`${payload.whereName} (${payload.asRole}):`) + ' ' + chalk.white(payload.reply) + '\n');
        game.emit("game:" + payload.eventToEmit, payload);
    });

    game.on("REPLY_AS_WITNESS", async (payload) => {
        // console.log(payload);
        console.log(chalk.yellowBright(`${payload.whereName} (${payload.asRole}): `) + chalk.white(payload.reply) + '\n');
        game.emit("game:" + payload.eventToEmit, payload);
    });

    game.on("REPLY_AS_OPPONENT", async (payload) => {
        // console.log(payload);
        console.log(chalk.cyanBright(`${payload.whereName} (${payload.asRole}): `) + chalk.white(payload.reply) + '\n');
        game.emit("game:" + payload.eventToEmit, payload);
    });
}

export default handleReplyEvent;