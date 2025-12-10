import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("API Key loaded:", process.env.GOOGLE_GEMINI_API_KEY ? "Yes" : "No");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

async function listAvailableModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`);
    const data = await response.json();

    if (data.models) {
      console.log("\nAvailable models:");
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
      });
      return data.models;
    } else {
      console.log("Error fetching models:", data);
      return [];
    }
  } catch (error) {
    console.log("Error listing models:", error.message);
    return [];
  }
}

async function testModels() {
  const availableModels = await listAvailableModels();

  if (availableModels.length === 0) {
    console.log("\nNo models available. There might be an issue with your API key.");
    return;
  }

  // Try to use the first available model that supports generateContent
  for (const modelInfo of availableModels) {
    const modelName = modelInfo.name.replace('models/', '');
    if (modelInfo.supportedGenerationMethods && modelInfo.supportedGenerationMethods.includes('generateContent')) {
      try {
        console.log(`\nTesting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, respond with 'OK'");
        const response = await result.response;
        console.log(`\n✓ SUCCESS! Model "${modelName}" works!`);
        console.log(`Response: ${response.text()}`);
        console.log(`\nUse this model in your application by setting: model: "${modelName}"`);
        break;
      } catch (error) {
        console.log(`✗ ${modelName} failed: ${error.message}`);
      }
    }
  }
}

testModels();
