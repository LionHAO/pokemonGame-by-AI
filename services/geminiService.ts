import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI | null => {
  if (aiClient) return aiClient;

  // Lazily access process.env.API_KEY. 
  // This prevents the "Uncaught Error" at startup if the key is missing in the environment.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI commentary will be disabled.");
    return null;
  }

  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
    return null;
  }
};

export const getBattleCommentary = async (
  attackerName: string,
  moveName: string,
  defenderName: string,
  damage: number,
  isCritical: boolean,
  isFainted: boolean
): Promise<string> => {
  const ai = getAiClient();

  // Graceful fallback if AI is not available
  if (!ai) {
    if (isFainted) return `${defenderName} 倒下了！`;
    return `${attackerName} 使用了 ${moveName}，造成了 ${damage} 点伤害！`;
  }

  try {
    const prompt = `
      Current Battle Action:
      Attacker: ${attackerName}
      Move: ${moveName}
      Defender: ${defenderName}
      Damage Dealt: ${damage}
      Critical Hit: ${isCritical}
      Defender Fainted: ${isFainted}

      Task: Write a very short, enthusiastic, anime-style battle commentary in Chinese (Simplified) describing this specific action.
      - If it's a critical hit, be very excited.
      - If the defender fainted, announce the knockout dramatically.
      - Keep it under 25 words.
      - Do not output JSON. Just the text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || `${attackerName} 使用了 ${moveName}！`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback text on API error
    return `${attackerName} 击中了 ${defenderName}，造成了 ${damage} 点伤害！`;
  }
};

export const getIntroCommentary = async (playerPokemon: string, opponentPokemon: string): Promise<string> => {
    const ai = getAiClient();
    
    // Graceful fallback
    if (!ai) {
        return "战斗开始！宿命的对决！";
    }

    try {
        const prompt = `
            Two Pokemon are about to battle: ${playerPokemon} vs ${opponentPokemon}.
            Write a one-sentence hype intro in Chinese for this match-up.
        `;
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "战斗开始了！";
    } catch (e) {
        return "战斗开始！宿命的对决！";
    }
}