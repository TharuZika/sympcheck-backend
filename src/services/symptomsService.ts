interface SymptomPayload {
  symptomps: string;
  sympList: string[];
  age: string;
}

interface PossibleCondition {
  name: string;
  probability: string;
  description: string;
}

interface SymptomResponse {
  status: string;
  possibleConditions: PossibleCondition[];
  recommendations: string[];
  condition: number;
  age: number;
  timestamp: string;
}

export class SymptomsService {
  public analyzeSymptoms(payload: SymptomPayload): SymptomResponse {
    const age = parseInt(payload.age);
    
    const timestamp = new Date().toISOString();
    
    const conditionScore = Math.min(100, payload.sympList.length * 20);
    
    const possibleConditions = this.generatePossibleConditions(payload.sympList);
    
    const recommendations = this.generateRecommendations(payload.sympList, age);
    
    return {
      status: "success",
      possibleConditions,
      recommendations,
      condition: conditionScore,
      age,
      timestamp
    };
  }
  
  private generatePossibleConditions(symptoms: string[]): PossibleCondition[] {
    const conditions: PossibleCondition[] = [];
    
    if (symptoms.some(s => s.toLowerCase().includes('vomit')) && 
        symptoms.some(s => s.toLowerCase().includes('fever')) && 
        symptoms.some(s => s.toLowerCase().includes('headache'))) {
      conditions.push({
        name: "Viral Gastroenteritis",
        probability: "high",
        description: "A viral infection that causes vomiting, fever, and headache. Usually self-limiting and can improve with hydration and rest."
      });
      
      conditions.push({
        name: "Migraine",
        probability: "medium",
        description: "Severe headache often accompanied by vomiting and sensitivity to light and sound."
      });
      
      conditions.push({
        name: "Dengue Fever",
        probability: "medium",
        description: "A mosquito-borne illness common in tropical areas. Look for other signs like rash and joint pain. Immediate medical attention is recommended if symptoms worsen."
      });
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('fever')) && 
        symptoms.some(s => s.toLowerCase().includes('headache'))) {
      conditions.push({
        name: "Common Cold",
        probability: "high",
        description: "A viral upper respiratory infection causing fever and headache."
      });
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('vomit'))) {
      conditions.push({
        name: "Food Poisoning",
        probability: "medium",
        description: "Gastrointestinal illness caused by contaminated food or water."
      });
    }
    
    if (conditions.length === 0) {
      conditions.push({
        name: "General Illness",
        probability: "medium",
        description: "Based on your symptoms, you may have a general illness. Monitor your symptoms and consult a healthcare provider if they worsen."
      });
    }
    
    return conditions;
  }
  
  private generateRecommendations(symptoms: string[], age: number): string[] {
    const recommendations: string[] = [];
    
    recommendations.push("Stay hydrated by drinking fluids like water and oral rehydration solutions.");
    recommendations.push("Monitor your temperature regularly.");
    recommendations.push("Rest and avoid strenuous activity.");
    recommendations.push("If symptoms persist for more than 48 hours or worsen, consult a doctor immediately.");
    
    if (age < 18) {
      recommendations.push("Consider consulting a pediatrician for proper diagnosis and treatment.");
    } else if (age > 65) {
      recommendations.push("Elderly individuals should seek medical attention promptly for fever and vomiting.");
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('vomit'))) {
      recommendations.push("Avoid solid foods for a few hours after vomiting, then try bland foods like crackers or toast.");
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('fever'))) {
      recommendations.push("Take acetaminophen or ibuprofen to reduce fever, following dosage instructions.");
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('headache'))) {
      recommendations.push("Rest in a quiet, dark room to help relieve headache symptoms.");
    }
    
    return recommendations;
  }
} 