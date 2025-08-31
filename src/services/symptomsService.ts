import { GoogleGenerativeAI } from '@google/generative-ai';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface SymptomPayload {
  symptoms: string[];
  originalInput: string;
  age?: string;
}

interface MLPrediction {
  disease: string;
  probability: number;
}

interface MLResponse {
  predictions: MLPrediction[];
  error?: string;
}

interface MedicalAdvice {
  general_care: string[];
  seek_attention: string;
  critical_level: 'Low' | 'Medium' | 'High';
  precautions: string[];
  next_steps: string;
  disclaimer: string;
}

interface EnhancedPrediction {
  disease: string;
  probability: number;
  medical_advice: MedicalAdvice;
}

interface SymptomResponse {
  status: string;
  predictions: EnhancedPrediction[];
  input_symptoms: string[];
  original_input: string;
  age?: string;
  timestamp: string;
  disclaimer: string;
}

export class SymptomsService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  public async analyzeSymptoms(payload: SymptomPayload): Promise<SymptomResponse> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('Step 1: Getting disease predictions from ML model...');
      
      const mlPredictions = await this.callMLModel(payload.symptoms);
      
      if (mlPredictions.error || !mlPredictions.predictions || mlPredictions.predictions.length === 0) {
        throw new Error(`ML Model Error: ${mlPredictions.error || 'No predictions returned'}`);
      }

      console.log('Step 2: Enhancing predictions with Gemini AI...');
      
      const enhancedPredictions = await this.enhanceWithGemini(
        mlPredictions.predictions, 
        payload.symptoms, 
        payload.age
      );

      return {
        status: 'success',
        predictions: enhancedPredictions,
        input_symptoms: payload.symptoms,
        original_input: payload.originalInput,
        age: payload.age,
        timestamp,
        disclaimer: 'This prediction is for informational purposes only. Always consult with healthcare professionals for medical advice.'
      };

    } catch (error) {
      console.error('Error in analyzeSymptoms:', error);
      throw error;
    }
  }
  private async callMLModel(symptoms: string[]): Promise<MLResponse> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../../../sympcheck-model/predict_diseases_only.py');
      const pythonProcess = spawn('python', [pythonScript, JSON.stringify(symptoms)]);
      
      let result = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python ML model failed: ${error}`));
          return;
        }
        
        try {
          const mlResponse: MLResponse = JSON.parse(result);
          console.log('ML Model Response:', mlResponse);
          resolve(mlResponse);
        } catch (parseError) {
          reject(new Error(`Failed to parse ML model output: ${parseError}`));
        }
      });
    });
  }

  private async enhanceWithGemini(
    predictions: MLPrediction[], 
    symptoms: string[], 
    age?: string
  ): Promise<EnhancedPrediction[]> {
    const enhancedPredictions: EnhancedPrediction[] = [];
    
    for (const prediction of predictions) {
      try {
        console.log(`Generating medical advice for ${prediction.disease}...`);
        const medicalAdvice = await this.generateMedicalAdvice(
          prediction.disease, 
          prediction.probability, 
          symptoms, 
          age
        );
        
        enhancedPredictions.push({
          disease: prediction.disease,
          probability: prediction.probability,
          medical_advice: medicalAdvice
        });
      } catch (error) {
        console.error(`Failed to generate advice for ${prediction.disease}:`, error);
        
        enhancedPredictions.push({
          disease: prediction.disease,
          probability: prediction.probability,
          medical_advice: this.generateFallbackAdvice(prediction.disease, prediction.probability)
        });
      }
    }
    
    return enhancedPredictions;
  }

  private async generateMedicalAdvice(
    disease: string, 
    probability: number, 
    symptoms: string[], 
    age?: string
  ): Promise<MedicalAdvice> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const ageInfo = age ? `Patient Age: ${age} years old` : 'Age not provided';
      
      const prompt = `
      As a medical AI assistant, provide comprehensive advice for a patient with the following information:
      
      Predicted Disease: ${disease}
      Confidence Level: ${probability}%
      Reported Symptoms: ${symptoms.join(', ')}
      ${ageInfo}
      
      Please provide a structured response with the following sections:
      
      1. General Care Instructions (3-4 specific bullet points)
      2. When to Seek Medical Attention (specific guidance based on the disease)
      3. Critical Level Assessment (Low/Medium/High with explanation)
      4. Important Precautions (2-3 specific precautions)
      5. Recommended Next Steps (specific actionable advice)
      
      Keep the response medically accurate, concise, and actionable. Always emphasize consulting healthcare professionals for proper diagnosis and treatment.
      
      Format your response as a JSON object with these exact keys:
      {
        "general_care": ["instruction1", "instruction2", "instruction3", "instruction4"],
        "seek_attention": "specific guidance text",
        "critical_level": "Low|Medium|High",
        "precautions": ["precaution1", "precaution2", "precaution3"],
        "next_steps": "recommended actions",
        "disclaimer": "medical disclaimer text"
      }
      
      Only return the JSON object, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`Gemini response for ${disease}:`, text);
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const advice = JSON.parse(jsonMatch[0]);
          return advice;
        } else {
          throw new Error('No JSON found in Gemini response');
        }
      } catch (parseError) {
        console.error('JSON parsing failed, using text parsing:', parseError);
        return this.parseGeminiTextResponse(text, disease, probability);
      }
      
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private parseGeminiTextResponse(text: string, disease: string, probability: number): MedicalAdvice {
    const response_lower = text.toLowerCase();
    
    let critical_level: 'Low' | 'Medium' | 'High' = 'Medium';
    if (probability > 80 || response_lower.includes('high') || response_lower.includes('urgent')) {
      critical_level = 'High';
    } else if (probability < 30 || response_lower.includes('low') || response_lower.includes('mild')) {
      critical_level = 'Low';
    }
    
    return {
      general_care: [
        'Monitor symptoms closely and track any changes',
        'Stay hydrated with water and clear fluids',
        'Get adequate rest and avoid strenuous activities',
        'Maintain good hygiene and wash hands frequently'
      ],
      seek_attention: `Based on the symptoms and ${disease} prediction (${probability}% confidence), consult a healthcare provider for proper evaluation and diagnosis.`,
      critical_level: critical_level,
      precautions: [
        'Do not ignore worsening symptoms',
        'Follow medical advice strictly if consulting a doctor',
        'Avoid self-medication without professional guidance'
      ],
      next_steps: 'Schedule an appointment with your healthcare provider for proper diagnosis and treatment plan.',
      disclaimer: 'This is not professional medical advice. Please consult a healthcare provider for accurate diagnosis and treatment.'
    };
  }

  private generateFallbackAdvice(disease: string, probability: number): MedicalAdvice {
    let critical_level: 'Low' | 'Medium' | 'High' = 'Medium';
    if (probability > 80) critical_level = 'High';
    else if (probability < 30) critical_level = 'Low';
    
    return {
      general_care: [
        'Monitor symptoms closely and track changes',
        'Stay hydrated with water and clear fluids',
        'Get adequate rest and avoid strenuous activities',
        'Maintain good hygiene practices'
      ],
      seek_attention: `Consult a healthcare provider for proper evaluation of ${disease} (${probability}% confidence).`,
      critical_level: critical_level,
      precautions: [
        'Do not ignore worsening symptoms',
        'Follow medical advice strictly',
        'Avoid self-medication'
      ],
      next_steps: 'Schedule an appointment with your healthcare provider for proper diagnosis.',
      disclaimer: 'This is not professional medical advice. Please consult a healthcare provider for accurate diagnosis and treatment.'
    };
  }
} 