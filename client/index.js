// Change the websocket import to be CommonJS compatible
import pkg from 'websocket';
const { client: WebSocketClient } = pkg;
import readline from 'readline';

const serverAddress = 'ws://localhost:3000'; // Adjust if your server runs elsewhere

const client = new WebSocketClient();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let connection = null;
let myConnectionId = null; // Will be assigned by the server (though not explicitly sent back in current server code)
let gameId = null;
let myRole = null; // 'PLAINTIFF' or 'DEFENDANT'
let isMyTurn = false;
let isGameOwner = false;
let isGameStarted = false; // Added state variable
let isGameOver = false; // Added game over flag

// --- Helper Functions ---

function sendToServer(event, payload) {
    if (connection && connection.connected) {
        const message = JSON.stringify({ event, payload });
        console.log(`\n>>> Sending: ${message}`);
        connection.sendUTF(message);
    } else {
        console.error("Not connected to server.");
        promptUser(); // Re-prompt if not connected
    }
}

function displayGameUpdate(payload) {
    console.log("\n--- Debate Update ---"); // Changed title
    let nextTurnPlayer = null;
    let isFinalUpdate = false;

    // Check for regular debater message + moderator response structure
    if (payload.sender && payload.response) {
        console.log(`[${payload.sender.role || 'System'}] stated: ${payload.message}`); // Changed verb
        // Use moderatorName and decision fields from updated schema
        console.log(`[${payload.response.moderatorName || 'Moderator'}] responded: ${payload.response.reply}`); // Changed verb
        nextTurnPlayer = payload.response.nextTurn; // DEBATER_A or DEBATER_B

        if (payload.response.nextAction === 'DECLARE_WINNER') {
            isFinalUpdate = true;
            isGameOver = true;
            console.log("\n====================");
            console.log("   DEBATE OVER");
            console.log(` Decision: ${payload.response.decision}`); // Use decision
            if (payload.response.reasoning) {
                console.log(` Reasoning: ${payload.response.reasoning}`);
            }
            console.log("====================");
        }
    }
    // Check for initial moderator message structure (using moderatorName)
    else if (payload.moderatorName && payload.reply) {
        console.log(`[${payload.moderatorName} (Moderator)]: ${payload.reply}`); // Display moderator name
        nextTurnPlayer = payload.nextTurn; // DEBATER_A or DEBATER_B
        if (!isGameStarted) {
             isGameStarted = true;
             console.log("Debate has officially started!");
        }
    }
    // Fallback
    else if (payload.message) {
         console.log(`[System/Unknown]: ${payload.message}`);
         nextTurnPlayer = payload.nextTurn;
         if (nextTurnPlayer) isGameStarted = true;
    } else {
        console.log(`[System/Unknown]: ${JSON.stringify(payload)}`);
    }


    // Determine next turn using updated roles
    if (!isGameOver && nextTurnPlayer) {
        isMyTurn = (myRole === 'DEBATER_A' && nextTurnPlayer === 'DEBATER_A') ||
                   (myRole === 'DEBATER_B' && nextTurnPlayer === 'DEBATER_B');

        if (isMyTurn) {
            console.log("\n*** It's your turn to speak! ***"); // Updated text
        } else {
            const waitingFor = nextTurnPlayer === 'DEBATER_A' ? 'DEBATER A' : 'DEBATER B'; // User-friendly display
            console.log(`\n--- Waiting for ${waitingFor} ---`);
        }
    } else if (!isGameOver) {
         isMyTurn = false;
         console.log("\n--- Waiting for moderator or opponent... ---"); // Changed waiting message
    } else {
        isMyTurn = false;
    }

    console.log("--------------------");
    promptUser();
}

function handleServerMessage(message) {
    if (message.type === 'utf8') {
        console.log(`\n<<< Received: ${message.utf8Data}`);
        try {
            const data = JSON.parse(message.utf8Data);

            switch (data.type) {
                case 'error':
                    console.error(`\n!!! Server Error: ${data.message}`);
                    if (data.message.includes("Not debater")) { // Check for debate-specific error text
                        isMyTurn = false; // Correct turn status if server rejects message
                    }
                    promptUser();
                    break;
                case 'ROOM_CREATED':
                    gameId = data.payload.gameId;
                    myRole = 'DEBATER_A'; // Creator is Debater A
                    isGameOwner = true;
                    console.log(`\nDebate Room created! Game ID: ${gameId}. You are DEBATER A.`); // Updated text
                    console.log("Waiting for Debater B to join...");
                    break;
                case 'JOIN_SUCCESS':
                    gameId = data.payload.gameId;
                    myRole = data.payload.role; // DEBATER_A or DEBATER_B
                    isGameOwner = (myRole === 'DEBATER_A');
                    console.log(`\nJoined debate room ${gameId}! You are ${myRole}.`); // Updated text
                    if (!isGameOwner) {
                        console.log("Waiting for the debate owner (DEBATER A) to start..."); // Updated text
                    }
                    promptUser();
                    break;
                case 'JOIN_FAILED':
                case 'GAME_FULL':
                    console.error(`\nFailed to join room: ${data.message}`);
                    gameId = null;
                    myRole = null;
                    isGameOwner = false;
                    isGameStarted = false; // Reset state
                    isGameOver = false;
                    promptUser();
                    break;
                case 'PLAYER_JOINED': // Server event type kept generic
                     console.log(`\nDebater B (${data.payload.connectionId}) joined the debate.`); // Updated text
                     promptUser(); // Re-prompt owner to start
                     break;
                case 'GAME_UPDATE':
                    displayGameUpdate(data.payload);
                    break;
                default:
                    console.log("\nReceived unhandled message type:", data.type);
                    promptUser();
            }
        } catch (e) {
            console.error("\nError parsing server message:", e);
            promptUser();
        }
    }
}

function promptUser() {
    if (!connection || !connection.connected) {
        console.log("\nNot connected.");
        rl.question('Connect to server? (yes/no): ', (answer) => {
            if (answer.toLowerCase() === 'yes') {
                client.connect(serverAddress, null);
            } else {
                rl.close();
            }
        });
        return;
    }

    // *** ADDED CHECK FOR GAME OVER ***
    if (isGameOver) {
        console.log("\nThe debate has ended.");
        rl.question('Disconnect? (yes/no): ', (answer) => {
            if (answer.toLowerCase() === 'yes') {
                rl.close();
            } else {
                // Keep client running but don't prompt for game actions
                console.log("Client still connected. Press Ctrl+C to exit.");
            }
        });
        return; // Don't proceed to other prompts
    }
    // *** END ADDED CHECK ***

    if (!gameId) {
        // Updated create/join room logic text
         rl.question('Choose action: (1) Create Debate Room, (2) Join Debate Room <gameId>: ', (answer) => {
             const parts = answer.split(' ');
             const action = parts[0];
             const id = parts[1];

             if (action === '1') {
                 sendToServer('CREATE_ROOM', {});
             } else if (action === '2' && id) {
                 sendToServer('JOIN_ROOM', { gameId: id });
             } else {
                 console.log("Invalid input. Use '1' or '2 <gameId>'."); // More specific help
                 promptUser();
             }
         });
    } else if (isGameOwner && !isGameStarted) {
         rl.question('Debater B has joined. Start debate? (yes/no): ', (answer) => { // Updated text
             if (answer.toLowerCase() === 'yes') {
                 console.log("Sending START_GAME command...");
                 sendToServer('START_GAME', { gameId });
             } else {
                 console.log("Waiting to start debate..."); // Updated text
                 setTimeout(promptUser, 2000);
             }
         });
    } else if (isGameStarted && isMyTurn) {
        rl.question('Your argument/statement: ', (message) => { // Updated prompt text
            if (message.trim()) {
                sendToServer('SEND_MESSAGE', { gameId, message: message.trim() });
                isMyTurn = false; // Assume turn ends after sending
            } else {
                console.log("Message cannot be empty.");
                promptUser(); // Re-prompt if empty
            }
        });
    } else if (isGameStarted && !isMyTurn) {
        console.log("Waiting for opponent or moderator..."); // Updated text
    } else {
         // Catch-all for other waiting states (e.g., waiting for game to start after joining)
         console.log("Waiting for debate to start...");
    }
}

// --- WebSocket Client Event Handlers ---

client.on('connectFailed', (error) => {
    console.error('Connect Error: ' + error.toString());
    promptUser(); // Allow retry
});

client.on('connect', (conn) => {
    connection = conn;
    console.log('WebSocket Client Connected');

    connection.on('error', (error) => {
        console.error("Connection Error: " + error.toString());
        // Handle connection loss potentially
        connection = null;
        gameId = null;
        myRole = null;
        isMyTurn = false;
        isGameOwner = false;
        promptUser();
    });

    connection.on('close', () => {
        console.log('Connection Closed');
        connection = null;
        gameId = null;
        myRole = null;
        isMyTurn = false;
        isGameOwner = false;
        rl.close(); // End client on disconnect
    });

    connection.on('message', handleServerMessage);

    // Initial prompt after connection
    promptUser();
});

// --- Start the client ---
console.log(`Attempting to connect to ${serverAddress}...`);
client.connect(serverAddress, null);

// Handle graceful exit
rl.on('close', () => {
    console.log('\nExiting client.');
    if (connection && connection.connected) {
        connection.close();
    }
    process.exit(0);
});
