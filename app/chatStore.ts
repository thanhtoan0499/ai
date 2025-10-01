"use client";
import { create, StateCreator } from "zustand";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { createJSONStorage, persist } from "zustand/middleware";

interface ChatState {
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  threads: ChatThread[];
  setThreads: (threads: ChatThread[]) => void;
  setSelectedThreadId: (id: string) => void;
  selectedThreadId: string;
}

export type ChatThread = {
  id: string;
  name: string;
  messages: ThreadMessageLike[];
};

export const useChatStore = create<ChatState>(
  persist(
    (set) => ({
      isRunning: false,
      setIsRunning: (val: boolean) => set({ isRunning: val }),
      threads: [
        {
          id: "thread-1",
          name: "Thread 1",
          messages: [],
        },
      ],
      setThreads: (threads: ChatThread[]) => set({ threads }),
      setSelectedThreadId: (id: string) => set({ selectedThreadId: id }),
      selectedThreadId: "thread-1",
    }),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
    },
  ) as unknown as StateCreator<ChatState>,
);
