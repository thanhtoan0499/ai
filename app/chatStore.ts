"use client";
import { create } from "zustand";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { createJSONStorage, persist } from "zustand/middleware";

export type ChatThread = {
  id: string;
  title: string;
  messages: ThreadMessageLike[];
  status: "regular" | "archived";
};

interface ChatState {
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  threads: ChatThread[];
  setThreads: (threads: ChatThread[]) => void;
  setSelectedThreadId: (id: string) => void;
  selectedThreadId: string;
  addNewThread: (name: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      setIsRunning: (val: boolean) => set({ isRunning: val }),
      threads: [],
      setThreads: (threads) => set({ threads }),
      selectedThreadId: "thread-1",
      setSelectedThreadId: (id) => set({ selectedThreadId: id }),
      addNewThread: (name) => {
        const newThread = {
          id: `thread-${Date.now()}`,
          title: name,
          messages: [],
          status: "regular",
        } as ChatThread;
        set({
          threads: [...get().threads, newThread],
          selectedThreadId: newThread.id,
        });
      },
    }),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
