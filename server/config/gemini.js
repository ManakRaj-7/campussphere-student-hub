import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

class OpenRouterModel {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.models = [
      'z-ai/glm-4.5-air:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen3-coder:free'
    ];
  }
  
  async generateContent(prompt) {
    let lastError = null;
    
    for (const modelName of this.models) {
      try {
        console.log(`🤖 [OpenRouter] Attempting AI generation using model: ${modelName}`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'CampusSphere',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        
        if (!response.ok) {
          throw new Error(`Response Status ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('Empty model response received.');
        }
        
        console.log(`✅ [OpenRouter] Successfully completed AI generation using model: ${modelName}`);
        return {
          response: {
            text: () => content
          }
        };
      } catch (error) {
        console.warn(`⚠️ [OpenRouter] Model ${modelName} failed: ${error.message}. Trying next model...`);
        lastError = error;
      }
    }
    
    console.error('❌ [OpenRouter] All models in the fallback queue failed.');
    throw new Error(`OpenRouter Fallback Failure: All models failed. Last error: ${lastError?.message}`);
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
