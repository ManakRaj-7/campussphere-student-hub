const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-3-flash-preview';
const DEFAULT_FALLBACK_MODELS = [
  'google/gemini-3-flash-preview',
  'google/gemini-3.1-flash-lite-preview',
  'google/gemini-3.1-flash-lite',
  'google/gemini-2.5-flash-lite',
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-24b-instruct-2501:free',
  'mistralai/mistral-small-3.2-24b-instruct'
];

const DEFAULT_REFERER = process.env.OPENROUTER_HTTP_REFERER || process.env.CLIENT_URL || 'http://localhost:5173';
const DEFAULT_APP_TITLE = process.env.OPENROUTER_APP_TITLE || 'CampusSphere';
const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 20000;
const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 700;
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE) || 0.35;
const AI_STREAMING = process.env.AI_STREAMING !== 'false';

let modelInstance = null;

class OpenRouterAPIError extends Error {
  constructor(message, statusCode = 500, type = 'openrouter_error') {
    super(message);
    this.name = 'OpenRouterAPIError';
    this.statusCode = statusCode;
    this.type = type;
  }
}

class OpenRouterProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.models = this._loadModels();
    this.referer = DEFAULT_REFERER;
    this.appTitle = DEFAULT_APP_TITLE;
  }

  _loadModels() {
    const rawModels = process.env.OPENROUTER_FALLBACK_MODELS || DEFAULT_FALLBACK_MODELS.join(',');
    const models = rawModels
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);

    if (models.length === 0) {
      return DEFAULT_FALLBACK_MODELS;
    }

    if (!models.includes(PRIMARY_MODEL)) {
      return [PRIMARY_MODEL, ...models];
    }

    return models;
  }

  _normalizeMessages(messages) {
    if (!messages) {
      throw new OpenRouterAPIError('Messages are required for OpenRouter requests.', 400, 'invalid_payload');
    }

    if (typeof messages === 'string') {
      return [{ role: 'user', content: messages }];
    }

    if (!Array.isArray(messages)) {
      throw new OpenRouterAPIError('Messages must be an array or string.', 400, 'invalid_payload');
    }

    return messages.map((message) => {
      const role = message.role === 'assistant' ? 'assistant' : message.role === 'system' ? 'system' : 'user';
      return {
        role,
        content: String(message.content || '').trim(),
      };
    }).filter((message) => message.content.length > 0);
  }

  _getModelLabel(modelName) {
    if (modelName === 'google/gemini-3-flash-preview') return 'Gemini 3 Flash';
    if (modelName.startsWith('google/gemini-3.1-flash')) return 'Gemini 3.1 Flash Lite';
    if (modelName.startsWith('google/gemini-2.5-flash-lite')) return 'Gemini 2.5 Flash Lite';
    if (modelName.startsWith('deepseek/deepseek-chat-v3-0324')) return 'DeepSeek Chat v3';
    if (modelName.startsWith('meta-llama/llama-3.3-70b-instruct')) return 'LLaMA 3.3 70B Instruct';
    if (modelName.startsWith('mistralai/mistral-small-24b-instruct-2501')) return 'Mistral Small 24B Instruct';
    if (modelName.startsWith('mistralai/mistral-small-3.2-24b-instruct')) return 'Mistral Small 3.2 24B Instruct';
    return modelName;
  }

  _createRequestPayload(modelName, messages, stream) {
    return {
      model: modelName,
      messages,
      stream,
      max_tokens: AI_MAX_TOKENS,
      temperature: AI_TEMPERATURE,
    };
  }

  async _handleResponse(response, modelName, stream) {
    const contentType = response.headers.get('content-type') || '';

    if (stream || contentType.includes('text/event-stream')) {
      return this._parseStreamingResponse(response, modelName);
    }

    const responseText = await response.text();

    if (!responseText) {
      throw new OpenRouterAPIError('Empty response from OpenRouter.', response.status, 'empty_response');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      throw new OpenRouterAPIError(`Malformed JSON response from OpenRouter: ${jsonError.message}`, 502, 'malformed_json');
    }

    const message = data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content;
    if (!message) {
      throw new OpenRouterAPIError('OpenRouter returned no text in choices.', 502, 'missing_content');
    }

    return message;
  }

  async _parseStreamingResponse(response, modelName) {
    if (!response.body) {
      throw new OpenRouterAPIError('Streaming not available from OpenRouter response.', response.status, 'stream_unavailable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      buffer += decoder.decode(value || new Uint8Array(), { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          return text;
        }

        if (!payload) continue;

        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            const errorMessage = parsed.error?.message || 'OpenRouter streaming error';
            throw new OpenRouterAPIError(errorMessage, response.status, 'stream_error');
          }
          const deltaText = parsed.choices?.[0]?.delta?.content;
          if (deltaText) {
            text += deltaText;
          }
        } catch (parseError) {
          throw new OpenRouterAPIError(`Stream parse failed: ${parseError.message}`, 502, 'stream_parse_error');
        }
      }
    }

    if (text.length > 0) {
      return text;
    }

    throw new OpenRouterAPIError('OpenRouter stream completed without returning text.', 502, 'empty_stream');
  }

  _buildRequestHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.referer,
      'X-Title': this.appTitle,
    };
  }

  async _fetchModel(modelName, messages, stream) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: this._buildRequestHeaders(),
        body: JSON.stringify(this._createRequestPayload(modelName, messages, stream)),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unable to read error body.');
        const message = `OpenRouter ${response.status} ${response.statusText}: ${errorBody}`;
        if (response.status === 401 || response.status === 403) {
          throw new OpenRouterAPIError('Invalid or unauthorized OpenRouter API key.', response.status, 'invalid_api_key');
        }
        if (response.status === 404) {
          throw new OpenRouterAPIError(`Model not found: ${modelName}`, 404, 'model_unavailable');
        }
        if (response.status === 429) {
          throw new OpenRouterAPIError('Rate limit reached on OpenRouter. Please try again later.', 429, 'rate_limit');
        }
        if (response.status >= 500) {
          throw new OpenRouterAPIError('OpenRouter upstream error. Retrying fallback models.', response.status, 'provider_error');
        }
        throw new OpenRouterAPIError(message, response.status, 'openrouter_error');
      }

      return await this._handleResponse(response, modelName, stream);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new OpenRouterAPIError('OpenRouter request timed out.', 408, 'timeout');
      }
      if (error instanceof OpenRouterAPIError) {
        throw error;
      }
      throw new OpenRouterAPIError(`Network failure while contacting OpenRouter: ${error.message}`, 503, 'network_error');
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateContent(messages, options = {}) {
    const normalizedMessages = this._normalizeMessages(messages);
    const stream = options.stream !== undefined ? options.stream : AI_STREAMING;
    let lastError = null;
    const attemptedModels = [];

    for (const modelName of this.models) {
      attemptedModels.push(modelName);
      try {
        console.log(`🤖 [OpenRouter] Attempting AI generation using model: ${modelName}`);
        const content = await this._fetchModel(modelName, normalizedMessages, stream);
        console.log(`✅ [OpenRouter] Completed AI generation using model: ${modelName}`);

        return {
          response: {
            text: () => content,
          },
          provider: 'openrouter',
          model: modelName,
          label: this._getModelLabel(modelName),
          fallbackActivated: attemptedModels.length > 1,
          attemptedModels,
        };
      } catch (error) {
        if (error.statusCode === 401 || error.statusCode === 403 || error.type === 'invalid_api_key') {
          console.error(`❌ [OpenRouter] Authorization failure: ${error.message}`);
          throw error;
        }

        console.warn(`⚠️ [OpenRouter] Model ${modelName} failed: ${error.message}. Trying next model...`);
        lastError = error;
      }
    }

    const message = `OpenRouter fallback failed after ${attemptedModels.length} attempts. ${lastError?.message || 'No response received.'}`;
    console.error(`❌ [OpenRouter] ${message}`);
    throw new OpenRouterAPIError(message, 502, 'fallback_failed');
  }
}

const initializeGemini = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️ OpenRouter API key is missing. AI features will be disabled until OPENROUTER_API_KEY is configured.');
    return null;
  }

  try {
    const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY);
    console.log(`✅ OpenRouter AI initialized with primary model: ${PRIMARY_MODEL}`);
    return provider;
  } catch (error) {
    console.error(`❌ OpenRouter AI initialization failed: ${error.message}`);
    return null;
  }
};

export const getModel = () => {
  if (!modelInstance) {
    modelInstance = initializeGemini();
  }
  return modelInstance;
};

export default initializeGemini;
