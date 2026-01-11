
import { GoogleGenAI } from "@google/genai";

// Always initialize with the direct process.env.API_KEY reference in the named parameter object.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateProductDescription = async (productName: string, price: number): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `একটি প্রোডাক্টের জন্য সুন্দর এবং আকর্ষণীয় বর্ণনা লিখুন। 
                 প্রোডাক্টের নাম: ${productName}
                 দাম: ${price} টাকা।
                 আউটপুটটি অবশ্যই বাংলা ভাষায় হতে হবে এবং ছোট (২-৩ বাক্য) হবে।`,
    });
    // The response features a .text property (getter), not a method.
    return response.text?.trim() || "কোনো বর্ণনা পাওয়া যায়নি।";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "AI বর্ণনা জেনারেট করতে ব্যর্থ হয়েছে।";
  }
};
