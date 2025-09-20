import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Loader2 } from 'lucide-react';


function ChatAI({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: 'Hi, how can I help you with this problem?' }], timestamp: new Date() }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to the bottom of the chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-focus on the input field
    useEffect(() => {
        inputRef.current?.focus();
    }, [messages]);

    const formatTimestamp = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const onSubmit = async (data) => {
        const userMessage = {
            role: 'user',
            parts: [{ text: data.message }],
            timestamp: new Date()
        };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        reset();
        setIsLoading(true);

        try {
            const response = await axiosClient.post("/ai/chat", {
                messages: updatedMessages,
                title: problem.title,
                description: problem.description,
                visibleTestCases: problem.testCases,
                startCode: problem.startCode
            });

            if (!response.data?.message) {
                throw new Error("Invalid response format");
            }

            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: response.data.message }],
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{
                    text: error.response?.data?.message ||
                        'Sorry, I encountered an issue. Please try again.'
                }],
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[80vh] min-h-[500px] bg-base-100 rounded-lg shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-base-300">
                <h2 className="text-lg font-semibold text-center">AI Chat Assistant 🤖</h2>
            </div>

            {/* Message Display Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                        {/* Message Bubble */}
                        <div className={`p-4 rounded-lg max-w-lg shadow-md transition-transform duration-300
                            ${msg.role === "user" ? "bg-primary text-primary-content rounded-br-none" : "bg-base-200 text-base-content rounded-bl-none"}`}
                        >
                            <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                        {/* Timestamp */}
                        <span className={`text-xs mt-1 text-gray-500
                            ${msg.role === "user" ? "text-right mr-1" : "text-left ml-1"}`}
                        >
                            {formatTimestamp(msg.timestamp)}
                        </span>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-center my-4">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="p-4 bg-base-100 border-t border-base-300"
            >
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        placeholder="Ask me anything about this problem..."
                        className="input input-bordered flex-1 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                        {...register("message", {
                            required: "Message is required",
                            minLength: {
                                value: 2,
                                message: "Message must be at least 2 characters"
                            }
                        })}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary rounded-full p-3 transition-transform duration-200 hover:scale-105 active:scale-95"
                        disabled={!!errors.message || isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
                    </button>
                </div>
                {errors.message && (
                    <p className="text-error text-sm mt-2 ml-4">
                        {errors.message.message}
                    </p>
                )}
            </form>
        </div>
    );
}

export default ChatAI;