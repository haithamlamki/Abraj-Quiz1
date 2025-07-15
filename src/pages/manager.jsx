import Button from "@/components/Button";
import GameWrapper from "@/components/game/GameWrapper";
import ManagerPassword from "@/components/ManagerPassword";
import { GAME_STATES, GAME_STATE_COMPONENTS_MANAGER } from "@/constants";
import { usePlayerContext } from "@/context/player";
import { useSocketContext } from "@/context/socket";
import { useRouter } from "next/router";
import { createElement, useEffect, useState, Fragment } from "react";
import { useLanguage } from "@/context/language";
import { useRef } from "react";
import toast from "react-hot-toast";

export default function Manager() {
  const { socket } = useSocketContext();
  const { lang, toggleLang } = useLanguage();
  // Remove all isAr, lang, and Arabic text. Only use English text in UI and messages.

  const [nextText, setNextText] = useState("Start");
  const [state, setState] = useState({
    ...GAME_STATES,
    status: {
      ...GAME_STATES.status,
      name: "SHOW_ROOM",
    },
  });
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ question: "", answers: ["", "", "", ""], correct: 0, time: 10 });
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setNextText("Start");
  }, []);

  useEffect(() => {
    socket.on("game:status", (status) => {
      setState({
        ...state,
        status: status,
        question: {
          ...state.question,
          current: status.question,
        },
      });
    });

    socket.on("manager:inviteCode", (inviteCode) => {
      setState({
        ...state,
        created: true,
        status: {
          ...state.status,
          data: {
            ...state.status.data,
            inviteCode: inviteCode,
          },
        },
      });
    });

    // Listen for game:reset to redirect manager
    const handleGameReset = () => {
      router.push("/manager");
      toast.success("Game ended. You have returned to the manager page.");
    };
    socket.on("game:reset", handleGameReset);

    return () => {
      socket.off("game:status");
      socket.off("manager:inviteCode");
      socket.off("game:reset", handleGameReset);
    };
  }, [state, socket, router]);

  // Listen for questions updates from backend
  useEffect(() => {
    if (!state.created) return;
    socket.emit("manager:addQuestion", null); // trigger to get current questions
    socket.on("manager:questionsUpdated", (q) => setQuestions(q || []));
    return () => socket.off("manager:questionsUpdated");
  }, [state.created, socket]);

  // Handle form input
  const handleFormChange = (e, idx) => {
    if (idx !== undefined) {
      const newAnswers = [...form.answers];
      newAnswers[idx] = e.target.value;
      setForm({ ...form, answers: newAnswers });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };
  const handleCorrectChange = (idx) => setForm({ ...form, correct: idx });
  const resetForm = () => {
    setForm({ question: "", answers: ["", "", "", ""], correct: 0, time: 10 });
    setEditIndex(null);
    setShowForm(false);
  };
  const handleAddOrEdit = () => {
    if (editIndex !== null) {
      socket.emit("manager:editQuestion", { index: editIndex, questionObj: form });
    } else {
      socket.emit("manager:addQuestion", form);
    }
    resetForm();
  };
  const handleEdit = (idx) => {
    setEditIndex(idx);
    setForm(questions[idx]);
    setShowForm(true);
  };
  const handleDelete = (idx) => {
    if (window.confirm("Are you sure to delete this question?")) {
      socket.emit("manager:deleteQuestion", idx);
    }
  };

  const handleCreate = () => {
    socket.emit("manager:createRoom");
  };

  const handleSkip = () => {
    setNextText("Skip");
    switch (state.status.name) {
      case "SHOW_ROOM":
        socket.emit("manager:startGame");
        break;
      case "SELECT_ANSWER":
        socket.emit("manager:abortQuiz");
        break;
      case "SHOW_RESPONSES":
        socket.emit("manager:showLeaderboard");
        break;
      case "SHOW_LEADERBOARD":
        socket.emit("manager:nextQuestion");
        break;
    }
  };

  // Handle file upload and AI question generation
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setGeneratedQuestions([]);
    // Read file as base64 or text
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      // Send to backend for AI question generation
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content,
        }),
      });
      const data = await res.json();
      setGeneratedQuestions(data.questions || []);
      setUploading(false);
    };
    if (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      reader.readAsDataURL(file); // For binary files, send as base64
    } else {
      reader.readAsText(file); // For txt
    }
  };
  const handleAddGenerated = (q) => {
    socket.emit("manager:addQuestion", q);
    setGeneratedQuestions((prev) => prev.filter((item) => item !== q));
  };

  // Add End Game handler with confirmation and toast
  const handleEndGame = () => {
    if (window.confirm("Are you sure you want to end the game and return to the manager page?")) {
      socket.emit("manager:abortQuiz");
      // router.push("/manager");
      // toast.success("Game ended. You have returned to the manager page.");
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isManager') !== 'true') {
      router.push('/manager-login');
    }
  }, [router]);

  // Remove ManagerPassword and password modal logic
  // Only render the manager UI if authenticated
  if (typeof window !== 'undefined' && localStorage.getItem('isManager') !== 'true') {
    return null;
  }

  return (
    <div dir="ltr" style={{ position: "relative" }}>
      {/* Game Control Panel */}
      {state.created && (
        <div className="fixed top-0 right-0 left-0 z-50 flex flex-row justify-center gap-4 py-3 px-4">
          {/* Start Game */}
          {state.status.name === "SHOW_ROOM" && (
            <Button className="main-btn px-6 py-2 text-lg font-bold" onClick={() => socket.emit("manager:startGame")}>Start Game</Button>
          )}
          {/* Next */}
          {[
            "SHOW_RESPONSES",
            "SHOW_LEADERBOARD"
          ].includes(state.status.name) && (
            <Button className="main-btn px-6 py-2 text-lg font-bold" onClick={() => socket.emit("manager:nextQuestion")}>Next</Button>
          )}
          {/* Show Leaderboard */}
          {state.status.name === "SELECT_ANSWER" && (
            <Button className="main-btn px-6 py-2 text-lg font-bold" onClick={() => socket.emit("manager:showLeaderboard")}>Show Leaderboard</Button>
          )}
          {/* End Game */}
          {state.status.name !== "SHOW_ROOM" && (
            <Button className="main-btn px-6 py-2 text-lg font-bold bg-red-600 hover:bg-red-700" onClick={handleEndGame}>End Game</Button>
          )}
      </div>
      )}
      {/* Main Content */}
      {!state.created ? (
        <div>
          <ManagerPassword />
        </div>
      ) : (
        <Fragment>
          {/* Manage Questions Button - fixed top left */}
          {state.status.name === "SHOW_ROOM" && (
            <button
              className="fixed top-6 right-8 z-50 main-btn px-4 py-2 text-lg font-bold"
              onClick={() => window.open('/questions-editor', '_blank')}
              style={{ minWidth: 160 }}
            >
              Manage Questions
            </button>
          )}
          <GameWrapper textNext={nextText} onNext={handleSkip} manager>
            {(() => {
              const Component = GAME_STATE_COMPONENTS_MANAGER[state.status.name];
              if (state.status.name === 'FINISH' && typeof Component === 'function') {
                return createElement(Component, { data: state.status.data, questions });
              }
              return typeof Component === 'function'
                ? createElement(Component, { data: state.status.data })
                : null;
            })()}
          </GameWrapper>
        </Fragment>
      )}
    </div>
  );
}
