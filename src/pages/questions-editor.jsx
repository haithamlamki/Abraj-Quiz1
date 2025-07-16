import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { useLanguage } from "@/context/language";
import { useSocketContext } from "@/context/socket";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

/**
 * Default Questions Editor Page
 * Allows editing, adding, and saving questions before starting the game.
 * @returns {JSX.Element}
 */
export default function QuestionsEditor() {
  const { socket } = useSocketContext();
  const router = useRouter();
  // Default 4 questions
  const defaultQuestions = [
    {
      question: "What is the capital of France?",
      answers: ["Paris", "London", "Madrid", "Rome"],
      correct: 0,
      time: 3,
    },
    {
      question: "What is the largest planet?",
      answers: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: 2,
      time: 3,
    },
    {
      question: "Who wrote Harry Potter?",
      answers: ["J.K. Rowling", "Tolkien", "Shakespeare", "Agatha Christie"],
      correct: 0,
      time: 3,
    },
    {
      question: "What is the chemical symbol for water?",
      answers: ["H2O", "CO2", "O2", "NaCl"],
      correct: 0,
      time: 3,
    },
  ];
  const [questions, setQuestions] = useState([...defaultQuestions]);
  const [quizName, setQuizName] = useState("Abraj Quiz");
  const [quizImage, setQuizImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [numQuestions, setNumQuestions] = useState(10);
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isManager') !== 'true') {
      router.push('/manager-login');
    }
  }, [router]);

  if (typeof window !== 'undefined' && localStorage.getItem('isManager') !== 'true') {
    return null;
  }

  // Handlers
  const handleChange = (idx, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (field === "answers") updated[idx].answers = value;
      else updated[idx][field] = value;
      return updated;
    });
  };
  const handleAnswerChange = (qIdx, aIdx, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].answers[aIdx] = value;
      return updated;
    });
  };
  const handleCorrectChange = (qIdx, aIdx) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].correct = aIdx;
      return updated;
    });
  };
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question: "", answers: ["", "", "", ""], correct: 0, time: 3 },
    ]);
  };
  const handleDelete = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleQuizImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setQuizImage(ev.target.result);
    reader.readAsDataURL(file);
  };
  const handleQuestionImageChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQuestions((prev) => {
        const updated = [...prev];
        updated[idx].image = ev.target.result;
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };
  const handleSaveAll = () => {
    if (socket && questions.length > 0) {
      socket.emit("manager:replaceQuestions", { quizName, quizImage, questions });
      toast.success("All questions saved successfully! The page will now close.");
      window.close();
    } else {
      toast.error("No questions to save.");
    }
  };

  // Handler for PDF upload and AI question generation
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    setPdfFile(file);
  };
  const handleStartGeneration = async () => {
    console.log('PDF file:', pdfFile);
    if (!pdfFile) return;
    setUploading(true);
    setGeneratedQuestions([]);
    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      console.log('FileReader loaded:', event.target.result.slice(0, 30));
      const content = event.target.result;
      console.log('Sending fetch to /api/generate-questions');
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: pdfFile.name,
          content,
          numQuestions,
        }),
      });
      const data = await res.json();
      console.log('Fetch response:', data);
      if (data.message) {
        toast.error(data.message);
      }
      if (data.quizImage) setQuizImage(data.quizImage);
      if (Array.isArray(data.questions)) setQuestions(data.questions);
      setUploading(false);
      if (!data.message) toast.success("Questions generated successfully!");
    };
    reader.readAsDataURL(pdfFile);
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#f7fafc] flex flex-col items-center py-8 px-2">
      {/* زر إغلاق صفحة الأسئلة */}
      <button
        className="fixed top-8 left-8 z-50 main-btn px-6 py-2 text-lg font-bold"
        onClick={() => window.close()}
      >
        Close Page
      </button>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 relative">
        <h1 className="text-3xl font-bold text-[#04A2C9] mb-6 text-center">
          Default Questions Editor
        </h1>
        <div className="mb-6 flex flex-col items-center">
          <label className="font-bold text-gray-700 mb-1">Quiz Name</label>
          <input
            type="text"
            className="w-full max-w-xs border rounded px-3 py-2 text-gray-900 mb-2 text-center"
            value={quizName}
            onChange={e => setQuizName(e.target.value)}
            placeholder="Enter quiz name"
          />
          <label className="font-bold text-gray-700 mb-1 mt-2">Quiz Image (Background)</label>
          <div className="flex justify-center w-full mb-2">
            <label className="main-btn px-4 py-2 text-base font-bold cursor-pointer mb-2">
              Choose Image
              <input type="file" accept="image/*" onChange={handleQuizImageChange} className="hidden" />
            </label>
          </div>
          {quizImage && <img src={quizImage} alt="Quiz Background Preview" className="max-h-40 rounded shadow mb-2" />}
          <label className="font-bold text-gray-700 mb-1 mt-2">Number of Questions</label>
          <select
            value={numQuestions}
            onChange={e => setNumQuestions(Number(e.target.value))}
            className="mb-2 border rounded px-3 py-2 w-32 text-center text-gray-900" // dark font
          >
            {[5, 10, 15, 20, 25, 30, 40, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <label className="font-bold text-gray-700 mb-1 mt-2">Upload PDF to Generate Questions</label>
          <div className="flex flex-col items-center w-full mb-2">
            <label className="main-btn px-4 py-2 text-base font-bold cursor-pointer mb-2">
              Upload PDF
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
            </label>
            {pdfFile && (
              <span style={{ color: '#04A2C9', fontWeight: 'bold', marginTop: 4 }}>
                {pdfFile.name}
              </span>
            )}
            <button
              className="main-btn px-6 py-2 text-lg font-bold mt-2"
              onClick={handleStartGeneration}
              disabled={!pdfFile || uploading}
            >
              Start Generation
            </button>
          </div>
          {uploading && <p style={{ color: '#fff', background: '#04A2C9', borderRadius: 8, padding: '6px 16px', marginTop: 8 }}>Uploading and generating questions...</p>}
          {generatedQuestions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-bold text-[#04A2C9] mb-2">Generated Questions</h3>
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="rounded-lg border border-[#04A2C9] bg-white p-4 flex flex-col gap-2 shadow relative mb-2">
                  {/* زر حذف السؤال */}
                  <button
                    className="absolute top-2 right-2 text-red-600 font-bold text-xl hover:text-red-800"
                    title="Delete Question"
                    onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))}
                  >
                    🗑️ Delete
                  </button>
                  <label className="font-bold text-gray-700 mb-1">Question {idx + 1}</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 text-gray-900 mb-2"
                    value={q.question}
                    onChange={e => handleChange(idx, "question", e.target.value)}
                    placeholder="Question text"
                  />
                  <label className="font-bold text-gray-700 mb-1">Question Image</label>
                  <input type="file" accept="image/*" onChange={e => handleQuestionImageChange(idx, e)} className="mb-2" />
                  {q.image && <img src={q.image} alt={`Question ${idx + 1} Preview`} className="max-h-32 rounded shadow mb-2" />}
                  <div className="mb-2">
                    <label className="font-bold text-gray-700 mb-1">Answers</label>
                    {Array.isArray(q.answers) ? q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          className="flex-1 border rounded px-3 py-2 text-gray-900"
                          value={a}
                          onChange={e => handleAnswerChange(idx, aIdx, e.target.value)}
                          placeholder={`Answer ${aIdx + 1}`}
                        />
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correct === aIdx}
                          onChange={() => handleCorrectChange(idx, aIdx)}
                        />
                        <span className="text-xs font-bold text-[#04A2C9]">Correct</span>
                      </div>
                    )) : null}
                  </div>
                  <div className="mb-2">
                    <label className="font-bold text-gray-700 mb-1">Timer (seconds)</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      className="w-32 border rounded px-3 py-2 text-gray-900"
                      value={q.time}
                      onChange={e => handleChange(idx, "time", Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button className="main-btn px-6 py-2 text-lg font-bold fixed top-8 right-8" onClick={handleSaveAll}>
          Save All
        </Button>
        <div className="flex flex-col gap-8 mt-12">
          {Array.isArray(questions) ? questions.map((q, idx) => (
            <div key={idx} className="rounded-lg border border-[#04A2C9] bg-white p-4 flex flex-col gap-2 shadow relative">
              {/* زر حذف السؤال */}
              <button
                className="absolute top-2 right-2 text-red-600 font-bold text-xl hover:text-red-800"
                title="Delete Question"
                onClick={() => handleDelete(idx)}
              >
                🗑️ Delete
              </button>
              <label className="font-bold text-gray-700 mb-1">Question {idx + 1}</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-gray-900 mb-2"
                value={q.question}
                onChange={e => handleChange(idx, "question", e.target.value)}
                placeholder="Question text"
              />
              <label className="font-bold text-gray-700 mb-1">Question Image</label>
              <input type="file" accept="image/*" onChange={e => handleQuestionImageChange(idx, e)} className="mb-2" />
              {q.image && <img src={q.image} alt={`Question ${idx + 1} Preview`} className="max-h-32 rounded shadow mb-2" />}
              <div className="mb-2">
                <label className="font-bold text-gray-700 mb-1">Answers</label>
                {Array.isArray(q.answers) ? q.answers.map((a, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      className="flex-1 border rounded px-3 py-2 text-gray-900"
                      value={a}
                      onChange={e => handleAnswerChange(idx, aIdx, e.target.value)}
                      placeholder={`Answer ${aIdx + 1}`}
                    />
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={q.correct === aIdx}
                      onChange={() => handleCorrectChange(idx, aIdx)}
                    />
                    <span className="text-xs font-bold text-[#04A2C9]">Correct</span>
                  </div>
                )) : null}
              </div>
              <div className="mb-2">
                <label className="font-bold text-gray-700 mb-1">Timer (seconds)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="w-32 border rounded px-3 py-2 text-gray-900"
                  value={q.time}
                  onChange={e => handleChange(idx, "time", Number(e.target.value))}
                />
              </div>
            </div>
          )) : null}
        </div>
        <Button className="main-btn px-6 py-2 text-lg font-bold mt-8 w-full" onClick={handleAddQuestion}>
          Add Question
        </Button>
      </div>
    </div>
  );
} 