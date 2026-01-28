import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { chatWithAI, generateProductDescription, analyzeMood } from "@/lib/groq";
import { Loader2, Send, Sparkles, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";

interface AITestProps {
    hideNavbar?: boolean;
}

export default function AITest({ hideNavbar = false }: AITestProps) {
    // Chatbot State
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; parts: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

    // Magic Description State
    const [productName, setProductName] = useState("");
    const [productCategory, setProductCategory] = useState("Lilin Aromaterapi");
    const [descResult, setDescResult] = useState<any>(null);
    const [descLoading, setDescLoading] = useState(false);

    // MoodMatch State
    const [moodInput, setMoodInput] = useState("");
    const [moodResult, setMoodResult] = useState<any>(null);
    const [moodLoading, setMoodLoading] = useState(false);

    // --- Handlers ---

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMessage = { role: "user" as const, parts: chatInput };
        const updatedHistory = [...chatHistory, newMessage];
        setChatHistory(updatedHistory);
        setChatInput("");
        setChatLoading(true);

        try {
            const response = await chatWithAI(chatInput, chatHistory);
            setChatHistory([...updatedHistory, { role: "model", parts: response }]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            setChatHistory([...updatedHistory, { role: "model", parts: `Error: ${error.message || "Terjadi kesalahan pada AI."}` }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleGenerateDesc = async () => {
        if (!productName) return;
        setDescLoading(true);
        try {
            const result = await generateProductDescription(productName, productCategory);
            setDescResult(result);
        } catch (error) {
            console.error(error);
        } finally {
            setDescLoading(false);
        }
    };

    const handleMoodMatch = async () => {
        if (!moodInput) return;
        setMoodLoading(true);
        try {
            const result = await analyzeMood(moodInput);
            setMoodResult(result);
        } catch (error) {
            console.error(error);
        } finally {
            setMoodLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {!hideNavbar && <Navbar />}
            <div className="container mx-auto pt-32 pb-20 px-4">
                <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    Moodlab AI Playground
                </h1>

                <Tabs defaultValue="chatbot" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
                        <TabsTrigger value="magic">Magic Description</TabsTrigger>
                        <TabsTrigger value="mood">MoodMatch</TabsTrigger>
                    </TabsList>

                    {/* 1. Chatbot Tab */}
                    <TabsContent value="chatbot">
                        <Card className="h-[600px] flex flex-col">
                            <CardHeader>
                                <CardTitle>AI Assistant</CardTitle>
                                <CardDescription>Tanya apa saja tentang Moodlab</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-md mb-4">
                                    {chatHistory.length === 0 && (
                                        <div className="text-center text-gray-400 mt-20">
                                            <p>Mulai percakapan dengan AI...</p>
                                        </div>
                                    )}
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border shadow-sm'}`}>
                                                {msg.parts}
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border shadow-sm p-3 rounded-lg flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Mengetik...
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleChat} className="flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        disabled={chatLoading}
                                    />
                                    <Button type="submit" disabled={chatLoading}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 2. Magic Description Tab */}
                    <TabsContent value="magic">
                        <Card>
                            <CardHeader>
                                <CardTitle>Magic Description Generator</CardTitle>
                                <CardDescription>Buat deskripsi produk otomatis untuk Admin</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nama Produk</Label>
                                        <Input
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="Contoh: Lilin Aroma Lavender"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kategori</Label>
                                        <Input
                                            value={productCategory}
                                            onChange={(e) => setProductCategory(e.target.value)}
                                            placeholder="Contoh: Lilin"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleGenerateDesc} disabled={descLoading || !productName} className="w-full">
                                    {descLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Generate Description
                                </Button>

                                {descResult && (
                                    <div className="bg-slate-50 p-6 rounded-lg border space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div>
                                            <h3 className="font-semibold mb-2">Deskripsi:</h3>
                                            <p className="text-gray-700 leading-relaxed">{descResult.description}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Benefit:</h3>
                                            <ul className="list-disc list-inside text-gray-700 space-y-1">
                                                {descResult.benefits.map((b: string, i: number) => (
                                                    <li key={i}>{b}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 3. MoodMatch Tab */}
                    <TabsContent value="mood">
                        <Card>
                            <CardHeader>
                                <CardTitle>MoodMatch Search</CardTitle>
                                <CardDescription>Cari produk berdasarkan perasaanmu</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Bagaimana perasaanmu hari ini?</Label>
                                    <Textarea
                                        value={moodInput}
                                        onChange={(e) => setMoodInput(e.target.value)}
                                        placeholder="Contoh: Aku lagi stress banget banyak tugas, butuh sesuatu yang bikin tenang..."
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handleMoodMatch} disabled={moodLoading || !moodInput} className="w-full bg-purple-600 hover:bg-purple-700">
                                    {moodLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
                                    Cari Produk yang Cocok
                                </Button>

                                {moodResult && (
                                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-purple-100 p-2 rounded-full">
                                                <Heart className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-purple-900">Analisis Mood</h3>
                                                <p className="text-purple-800">{moodResult.mood_analysis}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-md shadow-sm">
                                            <p className="italic text-gray-600 mb-4">"{moodResult.message}"</p>
                                            <h4 className="font-medium mb-2">Rekomendasi Kami:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {moodResult.suggested_products.map((p: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
