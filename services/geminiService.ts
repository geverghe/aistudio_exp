import { GoogleGenAI, Type } from "@google/genai";
import { Entity, SemanticModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateAssistantResponse = async (
  prompt: string,
  context: SemanticModel,
  history: { role: string; text: string }[]
): Promise<string> => {
  try {
    const contextStr = JSON.stringify(context, null, 2);
    
    const systemInstruction = `
      You are a specialized Data Agent for Google Cloud Dataplex.
      
      Your goal is to assist Data Engineers and Business Users in two ways:
      1. Modeling: Suggesting entities, properties, and relationships based on business descriptions.
      2. Analytics: Answering business questions by interpreting the provided Semantic Model (Knowledge Graph).

      Current Semantic Model Context:
      ${contextStr}

      If the user asks a business question (e.g., "What is the revenue?"), explain how you would derive the answer using the defined entities and their bindings (SQL logic description).
      If the user wants to model data, suggest JSON structures for Entities.
    `;

    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Replay history
    for (const msg of history) {
      if (msg.role === 'user') {
        await chat.sendMessage({ message: msg.text });
      }
      // We don't manually add model responses in the SDK chat history reconstruction 
      // typically for simple turns, but for robust history we'd handle this. 
      // For this prototype, we'll just send the last message with system instruction context.
    }

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "I'm sorry, I couldn't process that request.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error connecting to the Semantic Model agent. Please check your API key.";
  }
};

export const suggestEntitiesFromDescription = async (description: string): Promise<Partial<Entity>[]> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze this business requirement and suggest a list of Data Entities with properties. 
            Requirement: "${description}".
            Return valid JSON matching this schema: Array<{ name: string, description: string, properties: Array<{ name: string, dataType: string, description: string }> }>
            `,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
}