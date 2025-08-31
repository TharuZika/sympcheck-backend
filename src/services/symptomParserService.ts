import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

interface SymptomParseResult {
  symptoms: string[];
  isValid: boolean;
  warnings: string[];
  originalInput: string;
}

export class SymptomParserService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  public async parseSymptoms(input: string): Promise<SymptomParseResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
      You are a medical symptom parser. Your task is to extract individual symptoms from natural language input and validate if they are medical symptoms.

      Input: "${input}"

      Please analyze this input and:
      1. Extract individual symptoms from the text
      2. Normalize each symptom to standard medical terminology
      3. Validate if each extracted item is actually a medical symptom
      4. Provide warnings for any non-medical terms or unclear descriptions

      Rules:
      - Only extract actual medical symptoms (pain, fever, nausea, etc.)
      - Ignore non-medical words (articles, conjunctions, etc.)
      - Convert colloquial terms to medical terms (e.g., "tummy ache" → "abdominal pain")
      - Separate compound symptoms (e.g., "headache and nausea" → ["headache", "nausea"])
      - If no valid symptoms are found, mark as invalid

      Return your response as a JSON object with this exact structure:
      {
        "symptoms": ["symptom1", "symptom2", "symptom3"],
        "isValid": true/false,
        "warnings": ["warning1", "warning2"],
        "confidence": 0.0-1.0
      }

      Examples:
      - "I have a headache and vomit" → {"symptoms": ["headache", "vomiting"], "isValid": true, "warnings": [], "confidence": 0.95}
      - "headache, vomit, fever" → {"symptoms": ["headache", "vomiting", "fever"], "isValid": true, "warnings": [], "confidence": 0.98}
      - "I feel bad today" → {"symptoms": [], "isValid": false, "warnings": ["'feel bad' is too vague - please describe specific symptoms"], "confidence": 0.2}
      - "my car is broken" → {"symptoms": [], "isValid": false, "warnings": ["Input does not contain medical symptoms"], "confidence": 0.1}

      Only return the JSON object, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini symptom parsing response:', text);

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          return {
            symptoms: parsed.symptoms || [],
            isValid: parsed.isValid || false,
            warnings: parsed.warnings || [],
            originalInput: input
          };
        } else {
          throw new Error('No JSON found in Gemini response');
        }
      } catch (parseError) {
        console.error('JSON parsing failed for symptom parsing:', parseError);
        return this.fallbackParsing(input);
      }

    } catch (error) {
      console.error('Gemini symptom parsing error:', error);
      return this.fallbackParsing(input);
    }
  }

  private fallbackParsing(input: string): SymptomParseResult {
    const commonSymptoms = [
      'headache', 'fever', 'cough', 'nausea', 'vomiting', 'diarrhea', 'fatigue',
      'dizziness', 'chest pain', 'abdominal pain', 'back pain', 'sore throat',
      'runny nose', 'congestion', 'shortness of breath', 'muscle aches',
      'joint pain', 'rash', 'itching', 'swelling', 'bloating', 'constipation',
      'insomnia', 'anxiety', 'depression', 'loss of appetite', 'weight loss',
      'weight gain', 'blurred vision', 'ear pain', 'toothache', 'heartburn'
    ];

    const inputLower = input.toLowerCase();
    const foundSymptoms: string[] = [];
    const warnings: string[] = [];

    for (const symptom of commonSymptoms) {
      if (inputLower.includes(symptom) || 
          inputLower.includes(symptom.replace(' ', '')) ||
          (symptom === 'vomiting' && (inputLower.includes('vomit') || inputLower.includes('throw up'))) ||
          (symptom === 'nausea' && inputLower.includes('nauseous')) ||
          (symptom === 'diarrhea' && inputLower.includes('loose stool')) ||
          (symptom === 'constipation' && inputLower.includes('can\'t poop')) ||
          (symptom === 'abdominal pain' && (inputLower.includes('stomach ache') || inputLower.includes('tummy ache')))) {
        foundSymptoms.push(symptom);
      }
    }

    const uniqueSymptoms = [...new Set(foundSymptoms)];

    if (uniqueSymptoms.length === 0) {
      warnings.push('No recognizable symptoms found. Please describe specific symptoms like headache, fever, nausea, etc.');
    }

    return {
      symptoms: uniqueSymptoms,
      isValid: uniqueSymptoms.length > 0,
      warnings,
      originalInput: input
    };
  }
}
