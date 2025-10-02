import { NextResponse } from "next/server";

// Ensure this route is always dynamic so the stream isn't cached by Next.js
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const messageId = "123123123";
  const deltas = [
    "Gets",
    " the",
    " element",
    " at",
    " index",
    " n",
    " of",
    " array.",
    " If",
    " n",
    " is",
    " negative,",
    " the",
    " nth",
    " element",
    " from",
    " the",
    " end",
    " is",
    " returned.",
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (type: string, value) => {
        const line = `${type}:${JSON.stringify(value)}\n`;
        controller.enqueue(encoder.encode(line));
      };

      // StartStep ('f')
      send("f", { messageId });

      // TextDelta ('0') chunks
      for (const delta of deltas) {
        send("0", delta);
        await new Promise((r) => setTimeout(r, 100));
      }

      // FinishStep ('e')
      send("e", {
        finishReason: "stop",
        usage: { promptTokens: 0, completionTokens: deltas.join("").length },
        isContinued: false,
      });

      // FinishMessage ('d')
      send("d", {
        finishReason: "stop",
        usage: { promptTokens: 0, completionTokens: deltas.join("").length },
      });

      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
