
import { GoogleGenAI, Type } from "@google/genai";
import { DanceStyle, SkillLevel } from "../types";

// Helper to ensure fresh instance right before call as per guidelines
const getClient = () => {
  // Guidelines: API key must be obtained exclusively from process.env.API_KEY
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getDanceCoachAdvice = async (
  query: string, 
  userContext: { style: DanceStyle; level: SkillLevel; goal: string }
): Promise<string> => {
  const client = getClient();
  if (!client) return "AI Service Unavailable: Missing API Key.";

  try {
    const prompt = `
      Ești un instructor de dans de elită de la școala "Ginga", pasionat și motivant.
      
      CONTEXT STUDENT:
      - Nivel: ${userContext.level}
      - Stil Principal: ${userContext.style}
      - Obiectiv Personal: ${userContext.goal}
      
      ÎNTREBARE STUDENT: "${query}"
      
      INSTRUCȚIUNI:
      Răspunde scurt (maxim 50 de cuvinte), practic și specific pentru dans.
      Folosește un ton încurajator, dar tehnic corect.
      Dacă întrebarea nu e despre dans, răspunde politicos că te ocupi doar de dans.
      Evită introducerile lungi, treci direct la sfat.
    `;

    // Correct method: ai.models.generateContent with model and string prompt
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Continuă să dansezi! Ritmul e în tine.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Nu am putut genera un sfat acum, dar te aștept la curs!";
  }
};

export const transcribeAudio = async (
  audioBase64: string,
  mimeType: string
): Promise<string> => {
  const client = getClient();
  if (!client) throw new Error("API Key Missing");

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Corrected multi-part structure using { parts: [...] }
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: "Transcribe this audio call log exactly." }
        ]
      }
    });

    return response.text || "No transcription generated.";
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export interface SalesCallAnalysis {
  transcript: string;
  summary: string;
  probability: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  objections: string[];
  nextSteps: string;
}

export const analyzeSalesCall = async (
  audioBase64: string,
  mimeType: string
): Promise<SalesCallAnalysis> => {
  const client = getClient();
  if (!client) throw new Error("API Key Missing");

  const prompt = `
    Analizează această înregistrare a unui apel de vânzări pentru școala de dans "Ginga".
    
    Te rog să returnezi un răspuns strict în format JSON cu următoarea structură:
    {
      "transcript": "Transcrierea completă în limba română",
      "summary": "Un rezumat scurt (maxim 2 fraze) al discuției",
      "probability": 0-100, // Probabilitatea ca persoana să se înscrie la curs, bazat pe interesul arătat
      "sentiment": "positive" | "neutral" | "negative",
      "objections": ["Lista", "scurtă", "de", "obiecții", "sau", "îngrijorări"],
      "nextSteps": "O acțiune recomandată pentru agentul de vânzări"
    }
    
    Fii realist cu probabilitatea. Dacă clientul spune "mă mai gândesc", probabilitatea e sub 50%. Dacă întreabă de orar și preț, e peste 70%.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Corrected multi-part structure using { parts: [...] }
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        // Using responseSchema as per guidelines for JSON responses
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            summary: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
            objections: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.STRING }
          },
          required: ["transcript", "summary", "probability", "sentiment", "objections", "nextSteps"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as SalesCallAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze call.");
  }
};
