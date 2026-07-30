import type { Request, Response } from "express";
import { aiChatSchema } from "../contracts/ai.contract";
import * as ai from "../services/ai.service";

export async function aiChatHandler(req: Request, res: Response): Promise<void> {
  const input = aiChatSchema.parse(req.body);
  res.json(await ai.chat(input, { authenticated: !!req.auth }));
}
