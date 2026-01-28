import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chatWithAI, generateProductDescription, analyzeMood, generateCaption, generateSEOOutline, analyzeSentiment } from "@/lib/groq";
import { Loader2, Send, Sparkles, Heart, Instagram, Search, MessageSquare } from "lucide-react";
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

    // Caption Creator State
    const [captionTopic, setCaptionTopic] = useState("");
    const [captionTone, setCaptionTone] = useState("Aesthetic");
    const [captionPlatform, setCaptionPlatform] = useState("Instagram");
    const [captionResult, setCaptionResult] = useState<any>(null);
    const [captionLoading, setCaptionLoading] = useState(false);

    // SEO Outline State
    const [seoKeyword, setSeoKeyword] = useState("");
    const [seoResult, setSeoResult] = useState<any>(null);
    const [seoLoading, setSeoLoading] = useState(false);

    // Sentiment Analysis State
    const [reviewInput, setReviewInput] = useState("");
    const [sentimentResult, setSentimentResult] = useState<any>(null);
    const [sentimentLoading, setSentimentLoading] = useState(false);

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

    const handleGenerateCaption = async () => {
        if (!captionTopic) return;
        setCaptionLoading(true);
        try {
            const result = await generateCaption(captionTopic, captionTone, captionPlatform);
            setCaptionResult(result);
        } catch (error) {
            console.error(error);
        } finally {
            setCaptionLoading(false);
        }
    };

    const handleGenerateSEO = async () => {
        if (!seoKeyword) return;
        setSeoLoading(true);
        try {
            const result = await generateSEOOutline(seoKeyword);
            setSeoResult(result);
        } catch (error) {
            console.error(error);
        } finally {
            setSeoLoading(false);
        }
    };

    const handleAnalyzeSentiment = async () => {
        if (!reviewInput) return;
        setSentimentLoading(true);
        try {
            const result = await analyzeSentiment(reviewInput);
            setSentimentResult(result);
        } catch (error) {
            console.error(error);
        } finally {
            setSentimentLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {!hideNavbar && <Navbar />}
            <div className="container mx-auto pt-32 pb-20 px-4">
                <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    Moodlab AI Playground
                </h1>

                <Tabs defaultValue="chatbot" className="max-w-5xl mx-auto">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8 h-auto">
                        <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
                        <TabsTrigger value="magic">Desc Gen</TabsTrigger>
                        <TabsTrigger value="mood">MoodMatch</TabsTrigger>
                        <TabsTrigger value="caption">Caption</TabsTrigger>
                        <TabsTrigger value="seo">SEO Blog</TabsTrigger>
                        <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
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

                    {/* 4. Caption Creator Tab */}
                    <TabsContent value="caption">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sosmed Caption Creator</CardTitle>
                                <CardDescription>Buat caption Instagram/TikTok instan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Topik / Produk</Label>
                                    <Input
                                        value={captionTopic}
                                        onChange={(e) => setCaptionTopic(e.target.value)}
                                        placeholder="Contoh: Promo Diskon 50% Akhir Tahun"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tone</Label>
                                        <Select value={captionTone} onValueChange={setCaptionTone}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Aesthetic">Aesthetic</SelectItem>
                                                <SelectItem value="Lucu & Receh">Lucu & Receh</SelectItem>
                                                <SelectItem value="Profesional">Profesional</SelectItem>
                                                <SelectItem value="Hard Selling">Hard Selling</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Platform</Label>
                                        <Select value={captionPlatform} onValueChange={setCaptionPlatform}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Instagram">Instagram</SelectItem>
                                                <SelectItem value="TikTok">TikTok</SelectItem>
                                                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button onClick={handleGenerateCaption} disabled={captionLoading || !captionTopic} className="w-full bg-pink-600 hover:bg-pink-700">
                                    {captionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-4 w-4" />}
                                    Buat Caption
                                </Button>

                                {captionResult && (
                                    <div className="bg-pink-50 p-6 rounded-lg border border-pink-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div>
                                            <h3 className="font-semibold mb-2 text-pink-900">Caption:</h3>
                                            <p className="text-gray-800 whitespace-pre-line">{captionResult.caption}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2 text-pink-900">Hashtags:</h3>
                                            <p className="text-blue-600">{captionResult.hashtags.join(" ")}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 5. SEO Outline Tab */}
                    <TabsContent value="seo">
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Blog Outline</CardTitle>
                                <CardDescription>Riset konten blog dalam hitungan detik</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Keyword Utama</Label>
                                    <Input
                                        value={seoKeyword}
                                        onChange={(e) => setSeoKeyword(e.target.value)}
                                        placeholder="Contoh: Manfaat Lilin Aromaterapi"
                                    />
                                </div>
                                <Button onClick={handleGenerateSEO} disabled={seoLoading || !seoKeyword} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {seoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Generate Outline
                                </Button>

                                {seoResult && (
                                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-blue-900">{seoResult.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">Meta: {seoResult.meta_description}</p>
                                        </div>
                                        <div className="space-y-4">
                                            {seoResult.outline.map((section: any, idx: number) => (
                                                <div key={idx} className="bg-white p-4 rounded border border-blue-100">
                                                    <h4 className="font-semibold text-blue-800 mb-2">{section.heading}</h4>
                                                    <ul className="list-disc list-inside text-gray-600">
                                                        {section.points.map((point: string, i: number) => (
                                                            <li key={i}>{point}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 6. Sentiment Analysis Tab */}
                    <TabsContent value="sentiment">
                        <Card>
                            <CardHeader>
                                <CardTitle>Review Sentiment Analyzer</CardTitle>
                                <CardDescription>Analisis kepuasan pelanggan dari ulasan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Teks Ulasan / Feedback</Label>
                                    <Textarea
                                        value={reviewInput}
                                        onChange={(e) => setReviewInput(e.target.value)}
                                        placeholder="Paste ulasan pelanggan di sini..."
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handleAnalyzeSentiment} disabled={sentimentLoading || !reviewInput} className="w-full bg-orange-500 hover:bg-orange-600">
                                    {sentimentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                    Analisis Sentimen
                                </Button>

                                {sentimentResult && (
                                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-orange-900">Sentimen:</h3>
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${sentimentResult.sentiment === 'Positif' ? 'bg-green-100 text-green-700' : sentimentResult.sentiment === 'Negatif' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {sentimentResult.sentiment}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <h3 className="font-semibold text-orange-900">Skor:</h3>
                                                <span className="text-2xl font-bold text-orange-600">{sentimentResult.score}/10</span>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded border border-orange-100">
                                            <h4 className="font-medium text-orange-800 mb-1">Ringkasan:</h4>
                                            <p className="text-gray-700 mb-3">{sentimentResult.summary}</p>

                                            <h4 className="font-medium text-orange-800 mb-1">Saran Tindakan:</h4>
                                            <p className="text-gray-700 italic">"{sentimentResult.action_item}"</p>
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
