import { getModel } from '../config/gemini.js';

/**
 * Summarize lecture content using Gemini AI
 */
export const summarizeLecture = async (content) => {
  try {
    const model = getModel();
    if (!model) {
      return { summary: 'AI service is currently unavailable.', keyInsights: [], quality: 0 };
    }

    const prompt = `You are an academic assistant. Analyze the following lecture content and provide:
1. A concise summary (2-3 paragraphs)
2. Key insights as a JSON array of objects with "title" and "description" fields (3-5 insights)
3. A quality score from 0-100 based on completeness and clarity

Respond ONLY with valid JSON in this exact format:
{"summary": "...", "keyInsights": [{"title": "...", "description": "..."}], "quality": 85}

Lecture content:
${content}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        keyInsights: parsed.keyInsights || [],
        quality: typeof parsed.quality === 'number' ? parsed.quality : 50,
      };
    }
    return { summary: responseText, keyInsights: [], quality: 50 };
  } catch (error) {
    console.error('AI summarize error:', error.message);
    return { summary: 'Unable to generate summary at this time.', keyInsights: [], quality: 0 };
  }
};

/**
 * Chat with AI using context and message history
 */
export const chatWithContext = async (messages, systemContext = '') => {
  try {
    const model = getModel();
    if (!model) {
      return 'AI service is currently unavailable. Please try again later.';
    }

    const contextPrompt = systemContext ? `System context: ${systemContext}\n\n` : '';
    const conversationHistory = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = contextPrompt +
      'You are CampusSphere AI, a helpful campus assistant for college students. Be concise, friendly, and helpful. Continue this conversation:\n\n' +
      conversationHistory + '\nAssistant:';

    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('AI chat error:', error.message);
    return 'I apologize, but I am unable to respond right now. Please try again later.';
  }
};

/**
 * Get study insights based on performance data
 */
export const getStudyInsights = async (performanceData) => {
  try {
    const model = getModel();
    if (!model) {
      return 'AI service is currently unavailable for study insights.';
    }

    const prompt = `You are an academic advisor AI. Based on the following student performance data, provide personalized study recommendations, time management tips, and areas to focus on. Be specific and actionable.

Performance Data:
${JSON.stringify(performanceData, null, 2)}

Provide your response as helpful, encouraging advice in 3-5 paragraphs.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI study insights error:', error.message);
    return 'Unable to generate study insights at this time. Try maintaining a consistent study schedule and reviewing your notes regularly.';
  }
};

/**
 * Get wellness recommendation based on mood history and schedule
 */
export const getWellnessRecommendation = async (moodHistory, scheduleData) => {
  try {
    const model = getModel();
    if (!model) {
      return 'AI wellness service is currently unavailable. Remember to take breaks and stay hydrated!';
    }

    const prompt = `You are a campus wellness advisor AI. Based on the student's recent mood history and schedule, provide personalized wellness recommendations. Be empathetic, supportive, and practical.

Recent Mood History:
${JSON.stringify(moodHistory, null, 2)}

Current Schedule Load:
${JSON.stringify(scheduleData, null, 2)}

Provide 3-5 specific, actionable wellness recommendations. Include suggestions for stress management, sleep, exercise, and social activities.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI wellness error:', error.message);
    return 'Remember to take regular breaks, stay hydrated, get enough sleep, and reach out to friends or counselors if you need support.';
  }
};

/**
 * Generate a daily briefing for the student
 */
export const generateDailyBriefing = async (userData) => {
  try {
    const model = getModel();
    if (!model) {
      return 'Good morning! AI briefing service is currently unavailable. Have a great day!';
    }

    const prompt = `You are CampusSphere AI. Generate a brief, friendly morning briefing for a college student based on their data. Include encouragement and practical reminders. Keep it under 200 words.

Student Data:
${JSON.stringify(userData, null, 2)}

Generate a personalized morning briefing that mentions their upcoming classes, deadlines, streak progress, and a motivational note.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI briefing error:', error.message);
    return 'Good morning! Start your day strong. Check your schedule, review your notes, and stay focused. You\'ve got this!';
  }
};

/**
 * Get placement preparation questions and tips
 */
export const getPlacementPrep = async (profile, jobType) => {
  try {
    const model = getModel();
    if (!model) {
      return {
        questions: ['Tell me about yourself.', 'Why do you want this role?', 'What are your strengths?'],
        tips: ['Research the company thoroughly.', 'Practice coding problems daily.', 'Prepare your elevator pitch.'],
      };
    }

    const prompt = `You are a placement preparation advisor. Based on the student profile and target job type, generate interview preparation content.

Student Profile:
${JSON.stringify(profile, null, 2)}

Target Job Type: ${jobType}

Respond ONLY with valid JSON in this exact format:
{
  "questions": ["question1", "question2", "question3", "question4", "question5"],
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "topics": ["topic1", "topic2", "topic3"]
}

Generate 5 relevant interview questions, 5 preparation tips, and 3 key topics to study.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        questions: parsed.questions || [],
        tips: parsed.tips || [],
        topics: parsed.topics || [],
      };
    }
    return {
      questions: ['Tell me about yourself.'],
      tips: ['Research the company.'],
      topics: ['Data Structures'],
    };
  } catch (error) {
    console.error('AI placement prep error:', error.message);
    return {
      questions: ['Tell me about yourself.', 'Why do you want this role?', 'What are your strengths?'],
      tips: ['Research the company thoroughly.', 'Practice coding problems daily.', 'Prepare your elevator pitch.'],
      topics: ['Data Structures', 'Algorithms', 'System Design'],
    };
  }
};
