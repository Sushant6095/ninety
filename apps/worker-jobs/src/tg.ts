// Minimal Telegram Bot API surface EarlyWhistle needs. An interface (injectable) + a thin fetch impl — no
// heavy dependency. The scheduler is the only caller; a 429 surfaces as TgApiError.retryAfter (seconds).

export interface SendOpts {
  parse_mode?: "MarkdownV2";
  reply_markup?: unknown;
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
}

export interface TelegramClient {
  sendMessage(chatId: string, text: string, opts?: SendOpts): Promise<{ message_id: number }>;
  editMessageText(chatId: string, messageId: number, text: string, opts?: SendOpts): Promise<void>;
  pinChatMessage(chatId: string, messageId: number): Promise<void>;
  unpinChatMessage(chatId: string, messageId: number): Promise<void>;
  sendPhoto(chatId: string, photo: Buffer, opts?: SendOpts & { caption?: string }): Promise<{ message_id: number }>;
}

export class TgApiError extends Error {
  constructor(
    readonly status: number,
    readonly description: string,
    readonly retryAfter?: number,
  ) {
    super(`telegram ${status}: ${description}`);
    this.name = "TgApiError";
  }
}

/** Real client. JSON for text methods; sendPhoto uses multipart. Throws TgApiError (retryAfter on 429). */
export class FetchTelegram implements TelegramClient {
  constructor(
    private readonly token: string,
    private readonly base = "https://api.telegram.org",
  ) {}

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.base}/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string; parameters?: { retry_after?: number } };
    if (!json.ok) throw new TgApiError(res.status, json.description ?? "error", json.parameters?.retry_after);
    return json.result as T;
  }

  sendMessage(chatId: string, text: string, opts: SendOpts = {}) {
    return this.call<{ message_id: number }>("sendMessage", { chat_id: chatId, text, ...opts });
  }
  async editMessageText(chatId: string, messageId: number, text: string, opts: SendOpts = {}) {
    await this.call("editMessageText", { chat_id: chatId, message_id: messageId, text, ...opts });
  }
  async pinChatMessage(chatId: string, messageId: number) {
    await this.call("pinChatMessage", { chat_id: chatId, message_id: messageId, disable_notification: true });
  }
  async unpinChatMessage(chatId: string, messageId: number) {
    await this.call("unpinChatMessage", { chat_id: chatId, message_id: messageId });
  }
  async sendPhoto(chatId: string, photo: Buffer, opts: SendOpts & { caption?: string } = {}) {
    const form = new FormData();
    form.set("chat_id", chatId);
    form.set("photo", new Blob([new Uint8Array(photo)]), "moment.png");
    if (opts.caption) form.set("caption", opts.caption);
    if (opts.reply_to_message_id) form.set("reply_to_message_id", String(opts.reply_to_message_id));
    const res = await fetch(`${this.base}/bot${this.token}/sendPhoto`, { method: "POST", body: form });
    const json = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string; parameters?: { retry_after?: number } };
    if (!json.ok) throw new TgApiError(res.status, json.description ?? "error", json.parameters?.retry_after);
    return json.result!;
  }
}
