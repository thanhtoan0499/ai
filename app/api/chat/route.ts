import { NextResponse } from "next/server";

// Ensure this route is always dynamic so the stream isn't cached by Next.js
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // assistant-stream DataStream wire format requires lines like:
  // `${type}:${JSON.stringify(value)}\n`
  // where `type` is one of DataStreamStreamChunkType values
  // Minimal flow: StartStep ('f') -> TextDelta ('0')* -> FinishStep ('e') -> FinishMessage ('d')

  const messageId = "msg_00c28144627d502f0068dcca3df9a8819d93f0c38b3a730b44";
  const deltas = ["Olá", "!", " Como", " posso", " ajudar", " você", " hoje", "?"];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (type: string, value: any) => {
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
