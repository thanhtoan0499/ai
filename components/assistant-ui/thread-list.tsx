import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useThreadContext } from "@/app/MyRuntimeProvider";
import { ChatThread, useChatStore } from "@/app/chatStore";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="aui-root * aui-thread-list-root flex flex-col items-stretch gap-1.5 border-border outline-ring/50">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  const { setSelectedThreadId, threads } = useChatStore();
  const { addNewThread } = useThreadContext();
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        className="aui-thread-list-new flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
        variant="ghost"
        onClick={() => {
          if (threads?.some((ele) => !ele?.messages?.length)) return;
          const newThreadName = `Thread ${threads.length + 1}`;
          addNewThread(newThreadName);
          const newThread = threads.find((t) => t.name === newThreadName);
          if (newThread) {
            setSelectedThreadId(newThread.id);
          }
        }}
      >
        <PlusIcon />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  const { threads } = useChatStore();
  return threads?.map((ele) => {
    const CustomThreadListItem: FC = () => <ThreadListItem thread={ele} />;

    return (
      <ThreadListPrimitive.Items
        key={ele.id}
        components={{ ThreadListItem: CustomThreadListItem }}
      />
    );
  });
  // return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC<{ thread: ChatThread }> = ({ thread }) => {
  const { setSelectedThreadId } = useChatStore();
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item flex items-center gap-2 rounded-lg transition-all hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-active:bg-muted">
      <ThreadListItemPrimitive.Trigger
        onClick={() => setSelectedThreadId(thread?.id)}
        className="aui-thread-list-item-trigger flex-grow cursor-pointer px-3 py-2 text-start"
      >
        <span className="aui-thread-list-item-title text-sm">
          <ThreadListItemPrimitive.Title
            fallback={thread?.name || "New Chat"}
          />
        </span>
        {/*<ThreadListItemTitle />*/}
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="aui-thread-list-item-archive mr-3 ml-auto size-4 p-0 text-foreground hover:text-primary"
        variant="ghost"
        tooltip="Archive thread"
      >
        <ArchiveIcon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
