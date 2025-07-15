import { GAME_STATE_INIT } from "../../config.mjs"
import { abortCooldown, cooldown, sleep } from "../utils/cooldown.js"
import deepClone from "../utils/deepClone.js"
import generateRoomId from "../utils/generateRoomId.js"
import { startRound } from "../utils/round.js"
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUESTIONS_FILE = path.resolve(__dirname, "../questions.json");
console.log('QUESTIONS_FILE path:', QUESTIONS_FILE);

async function saveQuestionsToFile(data) {
  try {
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save questions.json:", err);
  }
}

export async function loadQuestionsFromFile() {
  try {
    const data = await fs.readFile(QUESTIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.warn("No questions.json found or invalid, using default questions.");
    return null;
  }
}

const Manager = {
  createRoom: (game, io, socket, password) => {
    if (game.password !== password) {
      io.to(socket.id).emit("game:errorMessage", "Bad Password")
      return
    }

    if (game.manager || game.room) {
      io.to(socket.id).emit("game:errorMessage", "Already manager")
      return
    }

    let roomInvite = generateRoomId()
    game.room = roomInvite
    game.manager = socket.id

    socket.join(roomInvite)
    io.to(socket.id).emit("manager:inviteCode", roomInvite)

    console.log("New room created: " + roomInvite)
  },

  kickPlayer: (game, io, socket, playerId) => {
    if (game.manager !== socket.id) {
      return
    }

    const player = game.players.find((p) => p.id === playerId)
    game.players = game.players.filter((p) => p.id !== playerId)

    io.in(playerId).socketsLeave(game.room)
    io.to(player.id).emit("game:kick")
    io.to(game.manager).emit("manager:playerKicked", player.id)
  },

  startGame: async (game, io, socket) => {
    if (game.started || !game.room) {
      return
    }

    game.started = true
    io.to(game.room).emit("game:status", {
      name: "SHOW_START",
      data: {
        time: 3,
        subject: game.quizName,
      },
    })

    await sleep(3)
    io.to(game.room).emit("game:startCooldown")

    await cooldown(3, io, game.room)
    startRound(game, io, socket)
  },

  nextQuestion: (game, io, socket) => {
    if (!game.started) {
      return
    }

    if (socket.id !== game.manager) {
      return
    }

    if (!game.questions[game.currentQuestion + 1]) {
      return
    }

    game.currentQuestion++
    startRound(game, io, socket)
  },

  abortQuiz: (game, io, socket) => {
    if (!game.started) {
      return
    }

    if (socket.id !== game.manager) {
      return
    }

    abortCooldown(game, io, game.room)
    // Emit game:reset to both manager and all players in the room
    io.to(game.room).emit("game:reset");
    io.to(game.manager).emit("game:reset");
  },

  showLoaderboard: (game, io, socket) => {
    if (!game.questions[game.currentQuestion + 1]) {
      socket.emit("game:status", {
        name: "FINISH",
        data: {
          subject: game.quizName,
          top: game.players.slice(0, 3).sort((a, b) => b.points - a.points),
          leaderboard: game.players.sort((a, b) => b.points - a.points),
        },
      })

      game = deepClone(GAME_STATE_INIT)
      return
    }

    socket.emit("game:status", {
      name: "SHOW_LEADERBOARD",
      data: {
        leaderboard: game.players
          .sort((a, b) => b.points - a.points)
          .slice(0, 5),
        subject: game.quizName,
      },
    })
  },

  // Add a new question
  addQuestion: (game, io, socket, questionObj) => {
    if (game.manager !== socket.id) return;
    game.questions.push(questionObj);
    io.to(socket.id).emit("manager:questionsUpdated", game.questions);
  },

  // Edit an existing question by index
  editQuestion: (game, io, socket, { index, questionObj }) => {
    if (game.manager !== socket.id) return;
    if (index < 0 || index >= game.questions.length) return;
    game.questions[index] = questionObj;
    io.to(socket.id).emit("manager:questionsUpdated", game.questions);
  },

  // Delete a question by index
  deleteQuestion: (game, io, socket, index) => {
    if (game.manager !== socket.id) return;
    if (index < 0 || index >= game.questions.length) return;
    game.questions.splice(index, 1);
    io.to(socket.id).emit("manager:questionsUpdated", game.questions);
  },

  // Replace all questions at once
  replaceQuestions: (game, io, socket, payload) => {
    if (game.manager !== socket.id) return;
    let quizName = payload.quizName || "Abraj Quiz";
    let questions = Array.isArray(payload.questions) ? payload.questions : [];
    game.questions = questions;
    game.quizName = quizName;
    saveQuestionsToFile({ quizName, questions });
    io.to(socket.id).emit("manager:questionsUpdated", { quizName, questions });
  },
}

export default Manager
