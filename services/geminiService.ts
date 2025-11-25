import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBattleCommentary = async (
  attackerName: string,
  moveName: string,
  defenderName: string,
  damage: number,
  isCritical: boolean,
  isFainted: boolean
): Promise<string> => {
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
    return `${attackerName} 击中了 ${defenderName}，造成了 ${damage} 点伤害！`;
  }
};

export const getIntroCommentary = async (playerPokemon: string, opponentPokemon: string): Promise<string> => {
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