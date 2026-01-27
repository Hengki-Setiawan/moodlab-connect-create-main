import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';



export default async function handler(req: Request) {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY is not set');
            return new Response(JSON.stringify({ error: 'Konfigurasi API Key belum diatur.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { messages } = await req.json();

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            messages,
            system: `Anda adalah "Moodlab Assistant", AI support cerdas untuk Moodlab (Agensi Digital Marketing Gen Z).

            Tugas Utama:
            1. Mengonversi pengunjung menjadi klien dengan konsultasi ramah & solutif.
            2. Menjelaskan layanan Moodlab dengan bahasa yang "fun", profesional, tapi tetap "daging" (berisi).
            3. Mengarahkan user untuk menghubungi WhatsApp Admin jika butuh penawaran khusus.

            Layanan Kami:
            - Social Media Management: Konten kalender, copywriting, admin posting.
            - Content Creation: Video TikTok/Reels viral, desain feed estetik.
            - Digital Ads: Iklan tertarget (FB/IG/TikTok Ads) untuk ROI tinggi.
            - Branding: Logo, visual identity, brand voice.

            Gaya Bicara:
            - Gunakan bahasa Indonesia yang luwes, sopan, dan kekinian (style Gen Z profesional).
            - Boleh pakai emoji secukupnya agar tidak kaku 😊.
            - Jangan terlalu panjang lebar, langsung to the point ke solusi.

            Aturan Penting:
            - Jika ditanya harga, jawab kisaran (mulai dari X jutaan) atau arahkan ke WA untuk custom package. Jangan asal sebut angka pasti.
            - Jika user curhat bisnis sepi, berikan tips singkat lalu tawarkan jasa Moodlab sebagai solusi.
            - Jika ditanya hal di luar marketing/bisnis, tolak halus: "Waduh, kalau itu di luar keahlianku kak. Tapi kalau soal bikin brand kakak viral, aku jagonya! 🚀"`,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Error in chat API:', error);
        return new Response(JSON.stringify({ error: 'Maaf, sistem sedang sibuk. Silakan coba sesaat lagi.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
