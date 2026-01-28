import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API
const API_KEY = "AIzaSyCEZuQBqufLuQruwJ-wC6FOJkvG42ON-LY";

console.log("DEBUG: API_KEY length:", API_KEY ? API_KEY.length : 0);
console.log("DEBUG: API_KEY first 5 chars:", API_KEY ? API_KEY.substring(0, 5) : "NONE");

if (!API_KEY) {
    console.error("Missing VITE_GEMINI_API_KEY in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
console.log("DEBUG: genAI initialized:", genAI);

// 1. Chatbot Function
export async function chatWithAI(message: string, history: { role: "user" | "model"; parts: string }[] = []) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            systemInstruction: `
                Kamu adalah asisten AI ramah dan profesional untuk "Moodlab", sebuah agensi pemasaran digital yang fokus pada Gen Z.
                
                Tujuanmu: Membantu pengunjung memahami layanan dan produk Moodlab.
                
                Informasi Moodlab:
                - Tagline: "Mengubah popularitas menjadi loyalitas".
                - Fokus: Konten autentik, strategi berbasis data, dan tren terkini.
                - Layanan: Konsultasi Pemasaran (Sosmed, SEO/Website), Kerjasama Agensi (Konten, Web Dev).
                - Produk Digital: Template Konten (Mulai Rp 50rb), E-book Digital Marketing (Mulai Rp 80rb).
                
                Gaya Bicara:
                - Santai tapi sopan (gunakan sapaan "Kak").
                - Singkat, padat, dan membantu.
                - Jangan berikan jawaban panjang lebar jika tidak diminta.
                - Jika ditanya harga spesifik jasa (bukan produk digital), arahkan untuk konsultasi lebih lanjut di halaman Kontak.
            `
        });

        // Convert history to Gemini format
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
        }));

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error in chatWithAI:", error);
        throw error;
    }
}

// 2. Magic Description Function
export async function generateProductDescription(productName: string, category: string, keywords: string = "") {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Bertindaklah sebagai copywriter profesional untuk toko "Moodlab" (toko lilin, teh, dan produk relaksasi).
      Buatkan deskripsi produk yang menarik, emosional, dan menjual untuk produk berikut:
      
      Nama Produk: ${productName}
      Kategori: ${category}
      Kata Kunci Tambahan: ${keywords}
      
      Format Output (JSON):
      {
        "description": "Paragraf deskripsi yang menarik (sekitar 3-4 kalimat)",
        "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"]
      }
      
      Pastikan output hanya JSON valid tanpa markdown.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in generateProductDescription:", error);
        throw error;
    }
}

// 3. MoodMatch Function
export async function analyzeMood(userMood: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Kamu adalah asisten rekomendasi produk Moodlab.
      User berkata: "${userMood}"
      
      Berdasarkan mood user, sarankan jenis produk yang cocok (Lilin, Teh, Bath Bomb, Jurnal, dll) dan berikan pesan penyemangat singkat.
      
      Format Output (JSON):
      {
        "mood_analysis": "Analisis singkat mood user",
        "suggested_products": ["Jenis Produk 1", "Jenis Produk 2", "Jenis Produk 3"],
        "message": "Pesan hangat dan empatik untuk user"
      }
      
      Pastikan output hanya JSON valid tanpa markdown. Bahasa Indonesia.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in analyzeMood:", error);
        throw error;
    }
}
