
import { GoogleGenAI } from "@google/genai";
import { ThumbnailSettings } from "./types.ts";

export const generateThumbnail = async (
  frames: string[], 
  settings: ThumbnailSettings
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Task: Create a high-energy, cinematic YouTube thumbnail based on the provided character frames.
    
    Style Reference:
    - Background: Epic, stormy, dark, with dramatic lighting.
    - Effects: Intense glowing energy/lightning effects (blue and red/orange) swirling around characters.
    - Quality: 4K, high contrast, professional digital art look.
    
    Character Details:
    - Number of characters to feature: ${settings.characterCount}.
    - Pose: Use the poses from the provided images, making them even more dynamic and heroic.
    - Design: Add elemental armor or glowing markings as seen in top-tier action anime/gaming thumbnails.
    
    Text Overlay (MANDATORY):
    - Primary Text: "${settings.mainText}"
    - Secondary/Sub Text: "${settings.subText}"
    - Position: Place both texts at the ${settings.textPosition.replace('-', ' ')} of the image.
    - Font Style: Bold, heavy font, thick black outline, vibrant yellow or white color (like a modern YouTube thumbnail).
    
    Additional Instructions:
    - ${settings.additionalPrompt || "Make it look exactly like a Season 2 Official high-budget anime release poster."}
    - Ensure the character faces are clear and expressive.
  `;

  const imageParts = frames.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: 'image/png',
    },
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw error;
  }
};

export const editGeneratedThumbnail = async (
  base64Image: string,
  editPrompt: string
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: `Refine this thumbnail: ${editPrompt}. Maintain the cinematic style and character poses but adjust the specific elements requested.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing thumbnail:", error);
    throw error;
  }
};
