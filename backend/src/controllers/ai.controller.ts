import type { Request, Response } from "express";
import { aiChatSchema } from "../contracts/ai.contract";
import * as ai from "../services/ai.service";

export async function aiChatHandler(req: Request, res: Response): Promise<void> {
  const input = aiChatSchema.parse(req.body);
  // Lead creation is only allowed on the public chat endpoint (set by route).
  const allowLeadCreation = Boolean((req as Request & { allowAiLeadCreation?: boolean }).allowAiLeadCreation);
  const result = await ai.chat(input, { authenticated: !!req.auth, allowLeadCreation });
  // Simple `{ message }` requests get the lean response shape from the spec.
  if (input.message && !input.messages?.length) {
    res.json({ reply: result.reply });
    return;
  }
  res.json(result);
}
