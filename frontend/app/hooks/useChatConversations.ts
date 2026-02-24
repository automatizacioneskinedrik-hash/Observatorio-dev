"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { defaultTitleFromFirstUserMessage, uid } from "../lib/chatTemp";
import type { ChatMessage } from "../types/chat";
import type { Conversation } from "../types/conversation";

type UseChatConversationsParams = {
  apiBase: string;
};

type UseChatConversationsResult = {
  conversations: Conversation[];
  activeConvId: string | null;
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  setInput: Dispatch<SetStateAction<string>>;
  setActiveConvId: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, title: string) => void;
  send: () => Promise<void>;
  onEditUserMessage: (messageId: string, newText: string) => void;
};

export function useChatConversations({
  apiBase,
}: UseChatConversationsParams): UseChatConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvIdState] = useState<string | null>(null);
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) ?? null,
    [conversations, activeConvId]
  );
  const messages = activeConv ? activeConv.messages : draftMessages;

  const setActiveConvId = (id: string) => {
    setActiveConvIdState(id);
  };

  const onNewConversation = () => {
    setActiveConvIdState(null);
    setDraftMessages([]);
    setInput("");
  };

  const onRenameConversation = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  };

  const replaceAssistantText = (convId: string, assistantMsgId: string, text: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          updatedAt: Date.now(),
          messages: c.messages.map((m) => (m.id === assistantMsgId ? { ...m, text } : m)),
        };
      })
    );
  };

  const sendText = async (textRaw: string) => {
    const text = textRaw.trim();
    if (!text || loading) return;

    const now = Date.now();
    const userMsg: ChatMessage = { id: uid("m"), role: "user", text, createdAt: now };
    const assistantMsgId = uid("m");
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      text: "",
      createdAt: now,
    };

    setInput("");
    setLoading(true);

    let convId = activeConvId;
    if (!convId) {
      const newConv: Conversation = {
        id: uid("conv"),
        title: defaultTitleFromFirstUserMessage(text),
        createdAt: now,
        updatedAt: now,
        messages: [userMsg, assistantMsg],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvIdState(newConv.id);
      setDraftMessages([]);
      convId = newConv.id;
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, updatedAt: now, messages: [...c.messages, userMsg, assistantMsg] }
            : c
        )
      );
    }

    if (!apiBase) {
      replaceAssistantText(convId, assistantMsgId, "Falta NEXT_PUBLIC_API_BASE_URL");
      setLoading(false);
      return;
    }

    try {
      const r = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await r.json();
      replaceAssistantText(convId, assistantMsgId, data.reply ?? "");
    } catch {
      replaceAssistantText(convId, assistantMsgId, "Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    await sendText(input);
  };

  const onEditUserMessage = (messageId: string, newText: string) => {
    const nextText = newText.trim();
    if (!nextText) return;

    if (!activeConvId) {
      setDraftMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: nextText } : m))
      );
      setInput(nextText);
      setTimeout(() => sendText(nextText), 0);
      return;
    }

    const conv = conversations.find((c) => c.id === activeConvId);
    if (!conv) return;

    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;

    const truncated = conv.messages
      .slice(0, idx + 1)
      .map((m) => (m.id === messageId ? { ...m, text: nextText } : m));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, messages: truncated, updatedAt: Date.now() } : c
      )
    );

    setInput(nextText);
    setTimeout(() => sendText(nextText), 0);
  };

  return {
    conversations,
    activeConvId,
    messages,
    input,
    loading,
    setInput,
    setActiveConvId,
    onNewConversation,
    onRenameConversation,
    send,
    onEditUserMessage,
  };
}
