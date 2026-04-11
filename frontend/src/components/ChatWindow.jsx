import { useState, useEffect, useRef, useCallback } from "react";

function TypingIndicator({ seller }) {
  return (
    <div className="flex items-start gap-4 animate-fade-in pl-2">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg"
        style={{ backgroundColor: seller.color }}
      >
        {seller.avatar}
      </div>
      <div className="bg-accord-card/60 backdrop-blur-sm border border-accord-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg }) {
  return (
    <div className="flex items-start gap-4 animate-fade-in group pl-2">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg mt-1"
        style={{ backgroundColor: msg.color }}
      >
        {msg.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5 px-1">
          <span className="text-sm font-bold tracking-wide" style={{ color: msg.color }}>{msg.seller}</span>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 bg-accord-bg px-2 py-0.5 rounded-full">Round {msg.round}</span>
          <span className="text-xs text-gray-400 ml-auto font-mono bg-accord-bg/50 px-2 py-1 rounded-md border border-accord-border/50">
            <span className="text-white font-semibold">{msg.price}</span> ALGO <span className="mx-1">•</span> <span className="text-white font-semibold">{msg.days}</span>d
          </span>
        </div>
        <div className="bg-accord-card/60 backdrop-blur-sm border border-accord-border rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-gray-200 shadow-sm leading-relaxed group-hover:border-accord-border/80 transition-colors">
          {msg.message}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isNegotiating, onDone }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const bottomRef = useRef(null);
  const animating = useRef(false);

  const animate = useCallback(() => {
    if (animating.current || !messages.length) return;
    animating.current = true;

    let i = 0;
    const showNext = () => {
      if (i >= messages.length) {
        animating.current = false;
        if (onDone) onDone();
        return;
      }
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        i++;
        setVisibleCount(i);
        setTimeout(showNext, 400);
      }, 800);
    };
    showNext();
  }, [messages, onDone]);

  useEffect(() => {
    if (messages.length > 0 && visibleCount === 0) {
      animate();
    }
  }, [messages, visibleCount, animate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount, showTyping]);

  const visible = messages.slice(0, visibleCount);
  const currentRound = visible.length > 0 ? visible[visible.length - 1].round : 0;

  return (
    <div className="animate-fade-in bg-accord-bg/30 rounded-2xl border border-accord-border/50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-accord-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">AI Negotiation Stream</h2>
          {isNegotiating && visibleCount === 0 && (
            <div className="flex items-center gap-2 text-xs text-accord-accent font-medium">
              <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-accord-accent animate-spin" />
              Loading optimal offers...
            </div>
          )}
        </div>
        {visible.length > 0 && (
          <div className="text-[11px] uppercase tracking-wider font-semibold text-accord-accent bg-accord-accent/10 px-3 py-1.5 rounded-lg border border-accord-accent/20">
            Round {currentRound} of 2
          </div>
        )}
      </div>

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
        {visible.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {showTyping && visibleCount < messages.length && (
          <TypingIndicator seller={messages[visibleCount]} />
        )}

        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}
