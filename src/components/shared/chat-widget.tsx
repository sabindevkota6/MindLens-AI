"use client";

import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { useRef, useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MessageSquareMore,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";

function getMessageText(
  parts: Array<{ type: string; text?: string }>
): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkBreaks]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 space-y-1">{children}</ol>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-5 space-y-1">{children}</ul>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        br: () => <br />,
        code: ({ children }) => (
          <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs">{children}</code>
        ),
        h1: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
        h2: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
        h3: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
        h4: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
        h5: ({ children }) => <p className="mb-1 font-medium">{children}</p>,
        h6: ({ children }) => <p className="mb-1 font-medium">{children}</p>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const patientSuggestions = [
  "Who is available today?",
  "How do I book a session?",
  "What is the Emotion Test?",
];

const counselorSuggestions = [
  "How do I set my availability?",
  "Where are my appointments?",
  "How do I edit my profile?",
];

// the chat widget is a floating bubble in the bottom-right corner of the dashboard.
// sendMessage() is the core api for sending user messages now
export function ChatWidget({ role = "PATIENT" }: { role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // useChat v6 uses DefaultChatTransport which hits /api/chat by default.
  // stable id keeps conversation alive across page navigations
  const { messages, sendMessage, status, error } = useChat({ id: "mindlens-assistant" });

  const suggestions = role === "COUNSELOR" ? counselorSuggestions : patientSuggestions;

  const isLoading = status === "submitted" || status === "streaming";

  // auto-scroll to the bottom whenever new messages arrive or streaming updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // focus the input field when the chat window opens so the user can start typing immediately
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // handling form submission to send the user's message via the ai sdk
  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(
      { text: trimmed },
      {
        body: {
          currentPathname: pathname,
        },
      }
    );
    setInput("");
  };

  // handling clicking a suggestion chip to send immediately without form
  const handleSuggestion = (suggestion: string) => {
    if (isLoading) return;
    sendMessage(
      { text: suggestion },
      {
        body: {
          currentPathname: pathname,
        },
      }
    );
  };

  return (
    <>
      {/* chat window that renders as a fixed panel above the floating button */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-[380px] h-[540px] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold leading-none">
                  MindLens Assistant
                </p>
                <p className="text-xs text-white/75 mt-0.5">
                  Ask me anything about the platform
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-gray-50/50"
          >
            {/* welcome message shown when there are no messages yet */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-8 px-2 space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Hi there! 👋
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[260px]">
                    I can help you check counselor availability, navigate the
                    app, or answer questions about MindLens features.
                  </p>
                </div>

                {/* quick suggestion ideas to help new users get started */}
                <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                      onClick={() => handleSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const messageText = getMessageText(
                message.parts as Array<{ type: string; text?: string }>
              );

              // skip rendering empty messages (e.g. tool-only responses with no text follow-up)
              if (!messageText.trim() && message.role === "assistant") {
                return null;
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                    {/* avatar for assistant messages */}
                    {message.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-primary text-white rounded-br-md whitespace-pre-wrap"
                          : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md [&_ol]:mt-2 [&_ul]:mt-2 [&_li_p]:mb-0"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm leading-relaxed break-words [&_a]:text-primary [&_a]:underline [&_ol]:pl-5 [&_ul]:pl-5 [&_ol]:space-y-1 [&_ul]:space-y-1 [&_p]:mb-2 [&_p:last-child]:mb-0">
                          <AssistantMessage content={messageText} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{messageText}</p>
                      )}
                    </div>

                    {/* avatar for user messages */}
                    {message.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    )}
                  </div>
                );
            })}

            {/* typing indicator while ai is generating a response */}
            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}

            {/* error display in case the api call fails */}
            {error && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Something went wrong. Please try again.
              </div>
            )}
          </div>

          {/* input form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-sm h-9 bg-gray-50 rounded-full px-4"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-full bg-primary hover:bg-primary/90 h-9 w-9 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* floating action button — toggles the chat open/closed */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-5 right-5 z-50 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 ring-[3px] ring-white/40",
          isOpen
            ? "bg-gray-700 hover:bg-gray-800 h-12 w-12 justify-center"
            : "bg-primary hover:bg-primary/90 h-12 px-5"
        )}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <MessageSquareMore className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-semibold">AI Chat</span>
          </>
        )}
      </button>
    </>
  );
}
