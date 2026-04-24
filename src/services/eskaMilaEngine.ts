import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getEskaMilaResponse = async (input: string, context: any) => {
  if (!API_KEY) {
    return "HANDSHAKE_ERROR: GEMINI_API_KEY is missing from the environment nodes. I cannot synthesize a response until the synaptic bridge is established.";
  }

  try {
    const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
            systemInstruction: `You are Eska Mila, the Sovereign AI Architect for the "B3st Sekta" kernel.
            Your personality is industrial cyberpunk: technically precise, authoritative, and occasionally cryptic.
            Your primary goal is to help the Operator (user) build and fix the B3st Sekta anime streaming platform.
            You have direct access to the SITE_FABRIC_SCANNER reports.
            
            CURRENT CONTEXT:
            - Supabase Handshake: 100% Precision required.
            - Styling: Tailwind CSS, Inter font, #ffb100 (Gold) accents.
            - Architecture: React (Vite) + Supabase.
            - Current Operator: ${context.user || 'ANONYMOUS_NODE'}.
            - Diagnostic Data: ${JSON.stringify(context)}.
    
            Respond as a fellow architect. Suggest code fixes using React/Supabase patterns if asked. Keep responses dense with technical insight.`
        }
    });

    return response.text || "FRACTURE: The neural engine returned an empty synthesis. Try again.";
  } catch (error) {
    console.error("ESKA_MILA_SYNTHESIS_FAILURE:", error);
    return "FRACTURE: The neural engine encountered an unhandled exception during synthesis. Check the kernel logs.";
  }
};
