import { Server } from "socket.io"
import { GAME_STATE_INIT, WEBSOCKET_SERVER_PORT } from "../config.mjs"
import Manager, { loadQuestionsFromFile } from "./roles/manager.js"
import Player from "./roles/player.js"
import { abortCooldown } from "./utils/cooldown.js"
import * as deepCloneModule from "./utils/deepClone.js";
import fs from "fs/promises";
const deepClone = deepCloneModule.default;

let gameState = JSON.parse(JSON.stringify(GAME_STATE_INIT));

const QUESTIONS_FILE = new URL("./questions.json", import.meta.url).pathname;

// Load persistent questions on server start
(async () => {
  let loaded = await loadQuestionsFromFile();
  if (!loaded || !Array.isArray(loaded.questions) || loaded.questions.length === 0) {
    loaded = { quizName: "Abraj Quiz", questions: GAME_STATE_INIT.questions };
    try {
      await fs.writeFile(QUESTIONS_FILE, JSON.stringify(loaded, null, 2), "utf-8");
      console.log("Initialized questions.json with default questions.");
    } catch (err) {
      console.error("Failed to initialize questions.json:", err);
    }
  } else {
    console.log("Loaded questions from questions.json");
  }
  gameState.questions = loaded.questions;
  gameState.quizName = loaded.quizName || "Abraj Quiz";
})();

const io = new Server({
  cors: {
    origin: "*",
  },
})

console.log(`Server running on port ${WEBSOCKET_SERVER_PORT}`);
io.listen(WEBSOCKET_SERVER_PORT);

io.on("connection", (socket) => {
  console.log(`A user connected ${socket.id}`);

  socket.on("player:checkRoom", (roomId) =>
    Player.checkRoom(gameState, io, socket, roomId)
  );

  socket.on("player:join", (player) =>
    Player.join(gameState, io, socket, player)
  );

  socket.on("manager:createRoom", (password) =>
    Manager.createRoom(gameState, io, socket, password)
  );
  socket.on("manager:kickPlayer", (playerId) =>
    Manager.kickPlayer(gameState, io, socket, playerId)
  );

  socket.on("manager:startGame", () => {
    gameState.started = true;
    io.to(gameState.room).emit("game:status", {
      name: "SHOW_START",
      data: {
        time: 3,
        subject: gameState.quizName,
      },
    });
    Manager.startGame(gameState, io, socket);
  });

  socket.on("player:selectedAnswer", (answerKey) =>
    Player.selectedAnswer(gameState, io, socket, answerKey)
  );

  socket.on("manager:abortQuiz", () => Manager.abortQuiz(gameState, io, socket));

  socket.on("manager:nextQuestion", () =>
    Manager.nextQuestion(gameState, io, socket)
  );

  socket.on("manager:showLeaderboard", () =>
    Manager.showLoaderboard(gameState, io, socket)
  );

  socket.on("manager:addQuestion", (questionObj) =>
    Manager.addQuestion(gameState, io, socket, questionObj)
  );
  socket.on("manager:editQuestion", (payload) =>
    Manager.editQuestion(gameState, io, socket, payload)
  );
  socket.on("manager:deleteQuestion", (index) =>
    Manager.deleteQuestion(gameState, io, socket, index)
  );
  socket.on("manager:replaceQuestions", (questions) =>
    Manager.replaceQuestions(gameState, io, socket, questions)
  );

  socket.on("disconnect", () => {
    console.log(`user disconnected ${socket.id}`);
    if (gameState.manager === socket.id) {
      console.log("Reset game");
      io.to(gameState.room).emit("game:reset");
      gameState.started = false;
      gameState = JSON.parse(JSON.stringify(GAME_STATE_INIT));

      abortCooldown();

      return;
    }

    const player = gameState.players.find((p) => p.id === socket.id);

    if (player) {
      gameState.players = gameState.players.filter((p) => p.id !== socket.id);
      socket.to(gameState.manager).emit("manager:removePlayer", player.id);
    }
  });
});