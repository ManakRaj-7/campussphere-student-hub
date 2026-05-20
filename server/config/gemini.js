import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

const initializeGemini = () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI features will be disabled.');
      return null;
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini AI initialized');
    return model;
  } catch (error) {
    console.error(`❌ Gemini AI initialization failed: ${error.message}`);
    return null;
  }
};

export const getModel = () => {
  if (!model) {
    return initializeGemini();
  }
  return model;
};

export default initializeGemini;
