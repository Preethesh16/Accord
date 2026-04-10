import { useState, useEffect, useRef, useCallback } from "react";

function TypingIndicator({ seller }) {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: seller.color }}
      >
        {seller.avatar}
      </div>
      <div className="bg-accord-card border border-accord-border rounded-lg px-4 py-3">
        <div className="flex gap-1">
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full inline-block" />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg }) {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: msg.color }}
      >
        {msg.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium" style={{ color: msg.color }}>{msg.seller}</span>
          <span className="text-xs text-gray-500">Round {msg.round}</span>
          <span className="text-xs text-gray-500 ml-auto font-mono">{msg.price} ALGO / {msg.days}d</span>
        </div>
        <div className="bg-accord-card border border-accord-border rounded-lg px-4 py-3 text-sm text-gray-300">
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
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Negotiation</h2>
        {visible.length > 0 && (
          <span className="text-xs text-gray-500 bg-accord-card px-2 py-1 rounded border border-accord-border">
            Round {currentRound} of 2
          </span>
        )}
        {isNegotiating && visibleCount === 0 && (
          <span className="text-xs text-accord-accent">Loading offers...</span>
        )}
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {visible.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {showTyping && visibleCount < messages.length && (
          <TypingIndicator seller={messages[visibleCount]} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
