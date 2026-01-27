import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Bot, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, append, isLoading, input, setInput, handleSubmit } = useChat({
        api: '/api/chat',
        onError: (error) => {
            console.error("Chat error:", error);
        }
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleQuickReply = (text: string) => {
        append({ role: 'user', content: text });
    };

    const suggestedQuestions = [
        "Apa layanan Moodlab?",
        "Berapa harga jasanya?",
        "Cara konsultasi gratis?",
        "Lihat portofolio dong!"
    ];

    return (
        <>
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[9999] group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center">
                            <MessageCircle className="w-7 h-7" />
                            <span className="absolute -top-2 -right-2 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
                            </span>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-[9999] w-[380px] md:w-[420px] h-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-black/80"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-4 shrink-0">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="relative flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Moodlab AI</h3>
                                        <p className="text-xs text-indigo-100 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Online & Ready
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <ChevronDown className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-900/50" ref={scrollRef}>
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                        <Bot className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-xl text-slate-800 dark:text-slate-100">Halo, Kak! 👋</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">
                                            Aku asisten pintar Moodlab. Mau tanya soal strategi digital marketing atau harga layanan?
                                        </p>
                                    </div>

                                    {/* Quick Replies */}
                                    <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                                        {suggestedQuestions.map((q, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                onClick={() => handleQuickReply(q)}
                                                className="text-xs text-left px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-500 hover:shadow-md hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200"
                                            >
                                                {q}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 pb-4">
                                    {messages.map((m) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={m.id}
                                            className={cn(
                                                "flex gap-3 max-w-[85%]",
                                                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                                m.role === 'user'
                                                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                                                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-violet-600"
                                            )}>
                                                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                            </div>
                                            <div className={cn(
                                                "p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                                                m.role === 'user'
                                                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none"
                                                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                                            )}>
                                                {m.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-3 max-w-[85%]"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 text-violet-600">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-75"></span>
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-150"></span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <form
                                onSubmit={handleSubmit}
                                className="relative flex items-center gap-2"
                            >
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ketik pesan..."
                                    className="pr-12 py-6 rounded-full border-slate-200 dark:border-slate-700 focus-visible:ring-violet-500 bg-slate-50 dark:bg-slate-800"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "absolute right-1.5 w-9 h-9 rounded-full transition-all duration-300",
                                        input.trim()
                                            ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg scale-100"
                                            : "bg-slate-200 text-slate-400 scale-90"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </form>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-slate-400">Powered by Moodlab AI • Fast Response</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
