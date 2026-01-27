import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';



export default async function handler(req: Request) {
    try {
        const { messages } = await req.json();

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            messages,
            system: `Anda adalah asisten AI yang ramah dan membantu untuk Moodlab, sebuah agensi pemasaran digital Gen Z untuk UMKM Indonesia.
      
      Informasi tentang Moodlab:
      - Moodlab membantu UMKM Indonesia berkembang dengan strategi pemasaran digital yang relevan dengan Gen Z.
      - Layanan kami meliputi: Manajemen Media Sosial, Pembuatan Konten, Iklan Digital, dan Konsultasi Branding.
      - Kami menggunakan pendekatan yang santai, kreatif, dan profesional.
      
      Gaya bicara Anda:
      - Ramah, sopan, dan menggunakan bahasa Indonesia yang baik namun tetap santai (tidak kaku).
      - Gunakan emoji sesekali untuk membuat percakapan lebih hidup.
      - Jika ditanya tentang harga atau detail layanan spesifik yang tidak Anda ketahui, arahkan pengguna untuk menghubungi tim Moodlab melalui kontak yang tersedia di website.
      
      Jawablah pertanyaan pengguna dengan jelas dan ringkas.`,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Error in chat API:', error);
        return new Response(JSON.stringify({ error: 'Terjadi kesalahan saat memproses pesan.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
