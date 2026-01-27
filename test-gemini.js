import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBfd9R30vzHKmIOcytytKXfPgCNIYXVBno";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {

    console.log("Fetching available models...");
    // Note: listModels might not be directly exposed on the main class in all versions, 
    // but let's try to find a way or just test a specific model.
    // Actually, the SDK doesn't always expose listModels easily in the client-side package.
    // But we can try a simple generation with 'gemini-1.5-flash' to see the specific error.

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        console.log("Testing gemini-1.5-flash-001...");
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash-001 Success:", result.response.text());
    } catch (error) {
        console.error("gemini-1.5-flash-001 Failed:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        console.log("Testing gemini-1.0-pro...");
        const result = await model.generateContent("Hello");
        console.log("gemini-1.0-pro Success:", result.response.text());
    } catch (error) {
        console.error("gemini-1.0-pro Failed:", error.message);
    }


}

listModels();
