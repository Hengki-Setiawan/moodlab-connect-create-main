const apiKey = "AIzaSyCEZuQBqufLuQruwJ-wC6FOJkvG42ON-LY";

async function checkAndTest() {
    // 1. List Models
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Listing models...");
    try {
        const response = await fetch(listUrl);
        const data = await response.json();
        if (response.ok) {
            const models = data.models.map(m => m.name);
            console.log("Found models count:", models.length);
            const has15Flash = models.includes("models/gemini-1.5-flash");
            console.log("Has gemini-1.5-flash:", has15Flash);

            const flashModels = models.filter(m => m.includes("flash"));
            console.log("Flash models:", flashModels);
        } else {
            console.error("List failed:", data);
        }
    } catch (e) { console.error("List error:", e); }

    // 2. Test gemini-2.5-flash-lite (seen in previous output)
    const modelName = "gemini-2.5-flash-lite"; // Try without models/ prefix first
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log(`Testing generation with ${modelName}...`);
    try {
        const response = await fetch(genUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log("SUCCESS! Response:", JSON.stringify(data, null, 2));
        } else {
            console.log("FAILED:", JSON.stringify(data, null, 2));
        }
    } catch (e) { console.error("Gen error:", e); }
}

checkAndTest();
