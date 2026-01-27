import fetch from 'node-fetch';

const API_KEY = "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";

const MODELS_TO_TRY = [
    'google/gemini-2.0-flash-exp:free', // Often busy
    'google/gemini-1.5-flash:free',      // Reliable?
    'google/gemini-1.5-pro:free',        // Reliable?
    'meta-llama/llama-3.2-11b-vision-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'deepseek/deepseek-r1-distill-llama-70b:free' // Sometimes available
];

async function testOpenRouter() {
    for (const model of MODELS_TO_TRY) {
        console.log(`\nTesting OpenRouter with model: ${model}`);

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://moodlab.id",
                    "X-Title": "Moodlab Test Script"
                },
                body: JSON.stringify({
                    "model": model,
                    "messages": [
                        { "role": "user", "content": "Hello" }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`FAILED (${response.status}):`, errorText);
                continue;
            }

            const data = await response.json();
            console.log("SUCCESS! Response:", data.choices[0].message.content);
            return; // Stop after first success

        } catch (error) {
            console.error("Network/Script Error:", error);
        }
    }
    console.log("\nAll models failed.");
}

testOpenRouter();
