# AI Debate Game - WebSocket API Documentation (for LibGDX Client)

This document outlines the WebSocket communication protocol between the AI Debate game server and a client, specifically providing guidance for implementation using Java and the LibGDX framework.

## 1. Connection

-   **URL:** `ws://localhost:3000` (Replace `localhost` with the server's IP/hostname if deployed elsewhere)
-   **Protocol:** WebSocket (ws)

**LibGDX Implementation:**

You'll need a Java WebSocket client library. Popular choices include:

-   `java-websocket` (org.java_websocket:Java-WebSocket)
-   `nv-websocket-client` (com.neovisionaries:nv-websocket-client)

**Example (using `java-websocket`):**

```java
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import java.net.URI;
import java.net.URISyntaxException;

// ... inside your LibGDX game screen or main class ...

URI serverUri;
WebSocketClient webSocketClient;

try {
    serverUri = new URI("ws://localhost:3000");
} catch (URISyntaxException e) {
    e.printStackTrace();
    // Handle error: Invalid server address
    return;
}

webSocketClient = new WebSocketClient(serverUri) {
    @Override
    public void onOpen(ServerHandshake handshakedata) {
        System.out.println("WebSocket Connected");
        // Connection successful, maybe update UI or game state
    }

    @Override
    public void onMessage(String message) {
        System.out.println("Received: " + message);
        // Process the incoming JSON message (see Section 3 & 5)
        handleServerMessage(message);
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println("WebSocket Closed: " + reason);
        // Handle disconnection, update UI, maybe attempt reconnect
    }

    @Override
    public void onError(Exception ex) {
        System.err.println("WebSocket Error: " + ex.getMessage());
        // Handle errors
    }
};

// Connect asynchronously
webSocketClient.connect();

// Remember to close the connection when your game/screen exits
// webSocketClient.close();
```

## 2. Message Format

All communication uses JSON objects.

**Client-to-Server:**

```json
{
  "event": "EVENT_NAME",
  "payload": {
    // Event-specific data
  }
}
```

**Server-to-Client:**

```json
{
  "type": "MESSAGE_TYPE",
  "payload": {
    // Type-specific data
  }
}
```

**LibGDX Implementation (JSON Handling):**

LibGDX has built-in JSON handling (`com.badlogic.gdx.utils.Json`), or you can use libraries like `Gson` or `Jackson`.

**Example (using LibGDX `Json`):**

```java
import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonWriter;
import com.badlogic.gdx.utils.ObjectMap; // Or use standard Java Maps

// ...

Json json = new Json();
json.setOutputType(JsonWriter.OutputType.json); // Use minimal output for network

// Sending a message
private void sendToServer(String event, ObjectMap<String, Object> payload) {
    if (webSocketClient != null && webSocketClient.isOpen()) {
        ObjectMap<String, Object> messageMap = new ObjectMap<>();
        messageMap.put("event", event);
        messageMap.put("payload", payload);
        String messageString = json.toJson(messageMap);
        System.out.println(">>> Sending: " + messageString);
        webSocketClient.send(messageString);
    } else {
        System.err.println("Cannot send message: WebSocket not connected.");
    }
}

// Receiving a message (inside onMessage)
private void handleServerMessage(String messageString) {
    try {
        // Parse the outer structure first
        ObjectMap<String, Object> data = json.fromJson(ObjectMap.class, messageString);
        String type = (String) data.get("type");
        Object payloadObj = data.get("payload"); // Payload might be complex

        // You might need to parse the payload further based on the 'type'
        // For complex payloads, define POJO classes and parse into them:
        // MyPayloadClass payload = json.fromJson(MyPayloadClass.class, json.toJson(payloadObj));

        // Process based on 'type' (see Section 5)
        // e.g., if ("GAME_UPDATE".equals(type)) { handleGameUpdate(payloadObj); }
        // ...

    } catch (Exception e) {
        System.err.println("Error parsing server message: " + e.getMessage());
    }
}

// Example POJO for a simple payload (adapt as needed)
public static class SimplePayload {
    public String message;
    // Add other fields as needed
}

public static class GameIdPayload {
    public String gameId;
}

// Example POJO for GAME_UPDATE payload (can be complex)
public static class GameUpdatePayload {
    // Fields for initial message
    public String moderatorName;
    public String reply;
    public String nextAction;
    public String nextTurn;
    public String targetDebater; // nullable
    public String decision;      // nullable
    public String reasoning;     // nullable

    // Fields for subsequent messages
    public SenderInfo sender;
    public String message; // Player's message
    public GameUpdatePayload response; // Nested AI response (same structure as initial)

    public static class SenderInfo {
        public String connectionId;
        public String role; // "DEBATER_A" or "DEBATER_B"
    }
}

```

## 3. Client-to-Server Events

Send these messages from the client to the server using the format described in Section 2.

-   **`CREATE_ROOM`**
    -   **Payload:** `{}` (Empty object)
    -   **Purpose:** Request the server to create a new debate room. The sender becomes Debater A (owner).
    -   **Example:**
        ```java
        sendToServer("CREATE_ROOM", new ObjectMap<String, Object>());
        ```

-   **`JOIN_ROOM`**
    -   **Payload:** `{ "gameId": "..." }`
    -   **Purpose:** Request to join an existing debate room as Debater B.
    -   **Example:**
        ```java
        String targetGameId = "some-uuid-string"; // Get this from user input or elsewhere
        ObjectMap<String, Object> payload = new ObjectMap<>();
        payload.put("gameId", targetGameId);
        sendToServer("JOIN_ROOM", payload);
        ```

-   **`START_GAME`**
    -   **Payload:** `{ "gameId": "..." }`
    -   **Purpose:** Sent by Debater A (the owner) to start the debate once Debater B has joined.
    -   **Example:**
        ```java
        // Assuming 'myGameId' holds the current game ID
        ObjectMap<String, Object> payload = new ObjectMap<>();
        payload.put("gameId", myGameId);
        sendToServer("START_GAME", payload);
        ```

-   **`SEND_MESSAGE`**
    -   **Payload:** `{ "gameId": "...", "message": "..." }`
    -   **Purpose:** Sent by the current debater (whose turn it is) to submit their argument/statement.
    -   **Example:**
        ```java
        String userMessage = "My argument is..."; // Get from text input field
        ObjectMap<String, Object> payload = new ObjectMap<>();
        payload.put("gameId", myGameId);
        payload.put("message", userMessage);
        sendToServer("SEND_MESSAGE", payload);
        // After sending, the client should typically wait for the GAME_UPDATE response.
        ```

## 4. Server-to-Client Messages

The client receives these messages from the server. Parse the `type` and `payload` as described in Section 2.

-   **`ROOM_CREATED`**
    -   **Payload:** `{ "gameId": "...", "message": "..." }`
    -   **Purpose:** Confirms room creation. Store the `gameId`. The client is Debater A. Update UI to show "Waiting for Debater B".
    -   **Client State:** `myRole = "DEBATER_A"`, `gameId = payload.gameId`, `isGameOwner = true`.

-   **`JOIN_SUCCESS`**
    -   **Payload:** `{ "gameId": "...", "role": "DEBATER_B", "message": "..." }`
    -   **Purpose:** Confirms successfully joining a room as Debater B. Store `gameId` and `role`. Update UI to show "Waiting for Debater A to start".
    -   **Client State:** `myRole = payload.role`, `gameId = payload.gameId`, `isGameOwner = false`.

-   **`PLAYER_JOINED`**
    -   **Payload:** `{ "connectionId": "...", "message": "..." }`
    -   **Purpose:** Informs Debater A that Debater B has joined the room. Update UI to allow Debater A to start the game.

-   **`GAME_UPDATE`**
    -   **Payload:** (Can have two structures)
        1.  **Initial Moderator Message:** `{ "moderatorName": "...", "reply": "...", "nextAction": "REQUEST_OPENING_A", "nextTurn": "DEBATER_A", ... }`
        2.  **Subsequent Update (Player Message + Moderator Response):** `{ "sender": { "role": "...", ... }, "message": "...", "response": { "moderatorName": "...", "reply": "...", "nextAction": "...", "nextTurn": "...", "decision": "...", "reasoning": "..." } }`
    -   **Purpose:** Provides the main flow of the debate.
        -   Display the moderator's `reply` (and `moderatorName`).
        -   If `sender` exists, display the player's `message` and their `sender.role`.
        -   Determine whose turn it is next using `nextTurn` (or `response.nextTurn`). Compare with `myRole` to enable/disable input.
        -   Update UI based on `nextAction` (e.g., "Waiting for Opening Statement", "Your turn to argue", "Closing Statements").
        -   If `nextAction` (or `response.nextAction`) is `DECLARE_WINNER`, the game is over. Display the `decision` and `reasoning`. Set `isGameOver = true`.
    -   **Client State:** `isGameStarted = true`, update `isMyTurn` based on `nextTurn` and `myRole`.

-   **`error`**
    -   **Payload:** `{ "message": "..." }`
    -   **Purpose:** Indicates an error occurred on the server (e.g., invalid action, wrong turn, internal error). Display the `message` to the user. If the error is "Not debater X's turn", ensure the input is disabled (`isMyTurn = false`).

-   **`JOIN_FAILED`**
    -   **Payload:** `{ "message": "..." }`
    -   **Purpose:** Failed to join the room (e.g., game not found, trying to join own game). Display `message`. Reset client state (`gameId = null`, `myRole = null`).

-   **`GAME_FULL`**
    -   **Payload:** `{ "message": "..." }`
    -   **Purpose:** The room the client tried to join already has two players. Display `message`. Reset client state.

## 5. Game State Management (Client-Side)

Maintain state variables in your LibGDX client:

```java
String myRole = null; // "DEBATER_A" or "DEBATER_B"
String gameId = null;
boolean isGameOwner = false;
boolean isGameStarted = false;
boolean isMyTurn = false;
boolean isGameOver = false;
String currentModeratorName = null;
String lastModeratorReply = null;
String currentDebateTopic = null; // Optional: Store topic details if needed
// Add UI elements: text input, send button, status label, message log area
```

Update these variables based on the messages received from the server (`handleServerMessage`). Use these variables to control the UI:

-   Show/hide "Create/Join" buttons based on `gameId == null`.
-   Show/hide "Start Game" button based on `isGameOwner && !isGameStarted && playerB_has_joined` (you need a way to know player B joined, e.g., receiving `PLAYER_JOINED`).
-   Enable/disable text input and send button based on `isGameStarted && isMyTurn && !isGameOver`.
-   Display status messages like "Waiting for opponent", "Your turn", "Debate Over".
-   Append moderator replies and player messages to a scrollable log area.
-   Display the final decision when `isGameOver` is true.

Good luck with the implementation!
