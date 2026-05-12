import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './index';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});