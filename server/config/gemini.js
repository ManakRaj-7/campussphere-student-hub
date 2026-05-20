import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

class OpenRouterModel {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  
  async generateContent(prompt) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-pro-exp-02-05:free',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
        throw new Error(`OpenRouter Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      response: {
        text: () => {
           return data.choices?.[0]?.message?.content || "";
        }
      }
    };
  }
}

const initializeGemini = () => {
  try {
    if (process.env.OPENROUTER_API_KEY) {
      console.log('✅ OpenRouter AI initialized (Using Free Model)');
      model = new OpenRouterModel(process.env.OPENROUTER_API_KEY);
      return model;
    } else if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('✅ Gemini AI initialized');
      return model;
    } else {
      console.warn('⚠️ No AI API KEY set. AI features will be disabled.');
      return null;
    }
  } catch (error) {
    console.error(`❌ AI initialization failed: ${error.message}`);
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
