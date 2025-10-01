"use client";

import React, { createContext, useContext } from "react";
import { ChatThread, useChatStore } from "@/app/chatStore";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  ThreadMessageLike,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { DevToolsModal } from "@assistant-ui/react-devtools";

// Add context for thread actions
type ThreadContextType = {
  addNewThread: (name: string) => void;
};
const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function useThreadContext() {
  const ctx = useContext(ThreadContext);
  if (!ctx)
    throw new Error("useThreadContext must be used within MyRuntimeProvider");
  return ctx;
}

export function MyRuntimeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    isRunning,
    setIsRunning,
    threads,
    setThreads,
    selectedThreadId,
    setSelectedThreadId,
  } = useChatStore();

  const selectedThread = threads.find((t) => t.id === selectedThreadId)!;
  const setThreadMessages = (msgs: ThreadMessageLike[]) => {
    setThreads(
      threads.map((t) =>
        t.id === selectedThreadId ? { ...t, messages: msgs } : t,
      ),
    );
  };

  const onNew = async (message: AppendMessage) => {
    const userMsg: ThreadMessageLike = {
      role: "user",
      content: message.content,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
    };

    const nextMessages = [...selectedThread.messages, userMsg];
    setThreadMessages(nextMessages);
    setIsRunning(true);

    try {
      // fake API call
      const fakeFetch = () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              text: message?.content,
            });
          }, 1000);
        });

      const data = await fakeFetch();

      const assistantMsg: ThreadMessageLike = {
        role: "assistant",
        content: (data as any).text,
        id: `assistant-${Date.now()}`,
        createdAt: new Date(),
      };

      setThreadMessages([...nextMessages, assistantMsg]);
    } catch (err) {
      console.error("Chat request error:", err);
      const assistantMsg: ThreadMessageLike = {
        role: "assistant",
        content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        id: `assistant-${Date.now()}`,
        createdAt: new Date(),
      };
      setThreadMessages([...nextMessages, assistantMsg]);
    } finally {
      setIsRunning(false);
    }
  };

  const runtime = useExternalStoreRuntime({
    messages: selectedThread.messages,
    setMessages: (msgs: readonly ThreadMessageLike[]) =>
      setThreadMessages([...(msgs ?? [])]),
    isRunning,
    onNew,
    convertMessage: (message): ThreadMessageLike => {
      return {
        role: message.role,
        content: message?.content,
      };
    },
  });

  const addNewThread = (name: string) => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      name,
      messages: [],
    };
    setThreads([...threads, newThread]);
    setSelectedThreadId(newThread.id);
  };

  return (
    <ThreadContext.Provider
      value={{
        addNewThread,
      }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <DevToolsModal />
        {children}
      </AssistantRuntimeProvider>
    </ThreadContext.Provider>
  );
}
