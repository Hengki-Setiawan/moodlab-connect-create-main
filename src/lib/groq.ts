import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// Initialize the API
const API_KEY = "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";

const groq = createGroq({
    apiKey: API_KEY,
});

const model = groq('llama-3.3-70b-versatile');

// 1. Chatbot Function
export async function chatWithAI(message: string, history: { role: "user" | "model"; parts: string }[] = [], context: string = "") {
    try {
        const systemInstruction = `
                Kamu adalah asisten AI ramah dan profesional untuk "Moodlab", sebuah agensi pemasaran digital yang fokus pada Gen Z.
                
                Tujuanmu: Membantu pengunjung memahami layanan dan produk Moodlab.
                
                Informasi Moodlab:
                - Tagline: "Mengubah popularitas menjadi loyalitas".
                - Fokus: Konten autentik, strategi berbasis data, dan tren terkini.
                - Layanan: Konsultasi Pemasaran (Sosmed, SEO/Website), Kerjasama Agensi (Konten, Web Dev).
                - Produk Digital: Template Konten (Mulai Rp 50rb), E-book Digital Marketing (Mulai Rp 80rb).
                
                DATA PRODUK TERBARU (Gunakan ini untuk menjawab pertanyaan tentang harga/stok):
                ${context}
                
                Gaya Bicara:
                - Santai tapi sopan (gunakan sapaan "Kak").
                - Singkat, padat, dan membantu.
                - Jangan berikan jawaban panjang lebar jika tidak diminta.
                - Jika ditanya harga spesifik jasa (bukan produk digital), arahkan untuk konsultasi lebih lanjut di halaman Kontak.
            `;

        // Convert history to AI SDK format
        // Gemini uses 'model', AI SDK uses 'assistant'
        const messages: any[] = history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts
        }));

        // Add the new message
        messages.push({ role: 'user', content: message });

        const { text } = await generateText({
            model: model,
            system: systemInstruction,
            messages: messages,
        });

        return text;
    } catch (error) {
        console.error("Error in chatWithAI:", error);
        throw error;
    }
}

// 2. Magic Description Function
export async function generateProductDescription(productName: string, category: string, keywords: string = "") {
    try {
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

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

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

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in analyzeMood:", error);
        throw error;
    }
}

// 4. Sosmed Caption Creator
export async function generateCaption(topic: string, tone: string, platform: string) {
    try {
        const prompt = `
      Bertindaklah sebagai Social Media Specialist Moodlab.
      Buatkan caption ${platform} yang menarik untuk topik berikut:
      
      Topik: ${topic}
      Tone: ${tone}
      
      Format Output (JSON):
      {
        "caption": "Caption lengkap dengan emoji",
        "hashtags": ["#tag1", "#tag2", "#tag3"]
      }
      
      Pastikan output hanya JSON valid tanpa markdown. Bahasa Indonesia.
    `;

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in generateCaption:", error);
        throw error;
    }
}

// 5. SEO Blog Outline Generator
export async function generateSEOOutline(keyword: string) {
    try {
        const prompt = `
      Bertindaklah sebagai SEO Specialist Moodlab.
      Buatkan kerangka artikel blog yang SEO-friendly untuk keyword: "${keyword}".
      
      Format Output (JSON):
      {
        "title": "Judul Artikel yang Menarik (Clickbait tapi relevan)",
        "meta_description": "Deskripsi meta untuk SEO (max 160 karakter)",
        "outline": [
          { "heading": "H2: Subjudul 1", "points": ["Poin 1", "Poin 2"] },
          { "heading": "H2: Subjudul 2", "points": ["Poin 1", "Poin 2"] }
        ]
      }
      
      Pastikan output hanya JSON valid tanpa markdown. Bahasa Indonesia.
    `;

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in generateSEOOutline:", error);
        throw error;
    }
}

// 6. Review Sentiment Analyzer
export async function analyzeSentiment(reviewText: string) {
    try {
        const prompt = `
      Analisis sentimen ulasan pelanggan berikut untuk Moodlab:
      "${reviewText}"
      
      Format Output (JSON):
      {
        "sentiment": "Positif" | "Netral" | "Negatif",
        "score": 1-10 (10 sangat puas),
        "summary": "Ringkasan singkat apa yang disukai/tidak disukai",
        "action_item": "Saran tindakan untuk tim Moodlab"
      }
      
      Pastikan output hanya JSON valid tanpa markdown. Bahasa Indonesia.
    `;

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in analyzeSentiment:", error);
        throw error;
    }
}

// 7. Auto-Reply Review
export async function generateReviewReply(reviewText: string, sentiment: string) {
    try {
        const prompt = `
      Buatkan balasan ulasan pelanggan yang sopan, profesional, dan personal.
      
      Ulasan Pelanggan: "${reviewText}"
      Sentimen: ${sentiment}
      
      Jika sentimen positif, ucapkan terima kasih dan ajak belanja lagi.
      Jika sentimen negatif, minta maaf dan tawarkan solusi (hubungi CS).
      
      Output langsung teks balasannya saja, tanpa tanda kutip. Bahasa Indonesia.
    `;

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

        return text;
    } catch (error) {
        console.error("Error in generateReviewReply:", error);
        throw error;
    }
}

// 8. Auto-SEO Product
export async function generateProductSEO(productName: string, description: string) {
    try {
        const prompt = `
      Buatkan metadata SEO untuk produk berikut:
      Nama Produk: ${productName}
      Deskripsi: ${description}
      
      Format Output (JSON):
      {
        "meta_title": "Judul SEO (max 60 karakter) yang menarik",
        "meta_description": "Deskripsi SEO (max 160 karakter) yang mengandung keyword",
        "keywords": "keyword1, keyword2, keyword3, keyword4"
      }
      
      Pastikan output hanya JSON valid tanpa markdown. Bahasa Indonesia.
    `;

        const { text } = await generateText({
            model: model,
            prompt: prompt,
        });

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error in generateProductSEO:", error);
        throw error;
    }
}
