import pdf from 'pdf-parse';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // optional, for better images

async function extractTextFromPdf(base64) {
  const buffer = Buffer.from(base64.split(',')[1], 'base64');
  const data = await pdf(buffer);
  return data.text;
}

async function generateQuestionsFromText(text, numQuestions = 10) {
  const prompt = `Extract ${numQuestions} multiple-choice questions from the following text. If the text is not educational, try to create general or logical questions based on the content. For each question, provide:\n- question\n- 4 answers (array)\n- correct (index of correct answer)\nReturn as a JSON array.\n\nText:\n${text}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });
  const data = await res.json();
  let questions = [];
  try {
    questions = JSON.parse(data.choices[0].message.content);
  } catch {
    questions = [];
  }
  return questions;
}

async function fetchImage(query) {
  // Try Unsplash first if key is set
  if (UNSPLASH_ACCESS_KEY) {
    const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await res.json();
    if (data && data.urls && data.urls.regular) return data.urls.regular;
  }
  // Fallback: use DuckDuckGo image search (public, but less reliable)
  const ddgRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`);
  const html = await ddgRes.text();
  const match = html.match(/imgurl=([^&]+)&/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { content, filename, numQuestions } = req.body;
  if (!content) return res.status(400).json({ error: 'No PDF content provided' });
  try {
    // 1. Extract text from PDF
    const text = await extractTextFromPdf(content);
    console.log('Extracted text:', text);
    // 2. Generate questions from text (OpenAI)
    const questions = await generateQuestionsFromText(text, numQuestions || 10);
    // 3. Fetch quiz image (based on filename or first question topic)
    let quizImage = null;
    if (questions.length > 0) {
      quizImage = await fetchImage(filename.replace(/\.[^.]+$/, '') || questions[0].question);
    }
    // 4. Fetch image for each question
    for (let q of questions) {
      q.image = await fetchImage(q.question);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(200).json({ questions: [], quizImage: null, message: 'No suitable questions found in the PDF. Try a more educational or clear file.' });
    }
    res.status(200).json({ questions, quizImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 