"use client";

import React, { useEffect } from "react";
import { ChatThread, useChatStore } from "@/app/chatStore";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  ExternalStoreThreadData,
  ExternalStoreThreadListAdapter,
  ThreadMessageLike,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { DevToolsModal } from "@assistant-ui/react-devtools";
import { last } from "lodash";

export function MyRuntimeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    isRunning,
    setIsRunning,
    threads,
    setThreads,
    selectedThreadId,
    addNewThread,
    setSelectedThreadId,
  } = useChatStore();
  const selectedThread = threads.find((t) => t.id === selectedThreadId);
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

    const baseMessages = [...(selectedThread?.messages ?? []), userMsg];
    setThreadMessages(baseMessages);
    setIsRunning(true);

    const assistantId = `assistant-${Date.now()}`;
    let assistantMsg: ThreadMessageLike = {
      role: "assistant",
      content: "",
      id: assistantId,
      createdAt: new Date(),
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: baseMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat API error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      setThreadMessages([...baseMessages, assistantMsg]);

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        buffer += chunk;

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf("\n");

          const trimmed = line.trim();
          if (!trimmed) continue;

          const colonIdx = trimmed.indexOf(":");
          if (colonIdx === -1) {
            continue; // malformed line
          }
          const type = trimmed.slice(0, colonIdx);
          const payloadStr = trimmed.slice(colonIdx + 1);

          let payload = null;
          try {
            payload = JSON.parse(payloadStr);
          } catch (e) {
            console.log(e);
            continue;
          }

          switch (type) {
            case "0": {
              // text delta (may contain special chart sentinel)
              const delta = typeof payload === "string" ? payload : "";
              if (!delta) break;

              const CHART_SENTINEL = "[[CHART]]:";
              if (delta.startsWith(CHART_SENTINEL)) {
                const jsonStr = delta.slice(CHART_SENTINEL.length);
                try {
                  const chartConfig = JSON.parse(jsonStr);
                  assistantMsg = {
                    ...assistantMsg,
                    // do not append sentinel to visible content
                    metadata: {
                      ...assistantMsg.metadata,
                      custom: {
                        ...assistantMsg.metadata?.custom,
                        chart: chartConfig,
                      },
                    },
                  } as ThreadMessageLike;
                  setThreadMessages([...baseMessages, assistantMsg]);
                } catch (e) {
                  console.log(e);
                }
              } else {
                assistantMsg = {
                  ...assistantMsg,
                  content: `${assistantMsg.content}${delta}`,
                };
                setThreadMessages([...baseMessages, assistantMsg]);
              }
              break;
            }
            case "f": {
              break;
            }
            case "e": {
              break;
            }
            case "d": {
              break;
            }
            default: {
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat request error:", err);
      assistantMsg = {
        role: "assistant",
        content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        id: assistantId,
        createdAt: new Date(),
      };
      setThreadMessages([...baseMessages, assistantMsg]);
    } finally {
      setIsRunning(false);
    }
  };

  const threadListAdapter: ExternalStoreThreadListAdapter = {
    // threadId: selectedThreadId ?? threads[0]?.id ?? undefined,
    threads: (
      threads.filter(
        (t) => t.status === "regular",
      ) as ExternalStoreThreadData<"regular">[]
    ).map((t) => ({
      id: t.id,
      title: t.title,
      status: "regular",
    })),
    archivedThreads: threads.filter(
      (t) => t.status === "archived",
    ) as ExternalStoreThreadData<"archived">[],
    onArchive: (threadId) => {
      if (threads?.find((ele) => ele.id === threadId)?.messages?.length === 0)
        return;
      const updatedThreads = threads.map((t) =>
        t.id === threadId ? { ...t, status: "archived" } : t,
      );
      setThreads(updatedThreads as ChatThread[]);
      setSelectedThreadId(
        threads?.find((ele) => ele.status !== "archived")?.id ?? "",
      );
      if (!updatedThreads?.some((ele) => ele.status !== "archived")) {
        const newThreadName = `Thread ${threads.length + 1}`;
        addNewThread(newThreadName);
      }
    },
    onSwitchToNewThread: () => {
      if (
        last(threads)?.messages?.length === 0 &&
        last(threads)?.status !== "archived"
      )
        return;
      const newThreadName = `Thread ${threads.length + 1}`;
      addNewThread(newThreadName);
    },
    onSwitchToThread: (threadId: string) => {
      setSelectedThreadId(threadId);
    },
    /*onRename: (threadId, newTitle) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.threadId === threadId ? { ...t, title: newTitle } : t,
        ),
      );
    },

    onDelete: (threadId) => {
      setThreads((prev) => prev.filter((t) => t.threadId !== threadId));
      setThreads((prev) => {
        const next = new Map(prev);
        next.delete(threadId);
        return next;
      });
      if (selectedThreadId === threadId) {
        setSelectedThreadId("default");
      }
    },*/
  };

  const runtime = useExternalStoreRuntime({
    messages: selectedThread?.messages ?? [],
    setMessages: (msgs: readonly ThreadMessageLike[]) => {
      setThreadMessages([...(msgs ?? [])]);
    },
    isRunning,
    onNew,
    convertMessage: (message): ThreadMessageLike => {
      return {
        role: message.role,
        content: message?.content,
        id: message.id,
        createdAt: message.createdAt,
        attachments: message.attachments,
        metadata: message.metadata,
      } as ThreadMessageLike;
    },
    adapters: {
      threadList: threadListAdapter,
    },
  });

  useEffect(() => {
    const data = localStorage.getItem("chat-store");
    if (threads.length > 0 || data) return;
    const newThreadName = `Thread ${threads.length + 1}`;
    addNewThread(newThreadName);
  }, []);

  console.log("Selected thread ID:", selectedThreadId);
  console.log("Threads", threads);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <DevToolsModal />
      {children}
    </AssistantRuntimeProvider>
  );
}
