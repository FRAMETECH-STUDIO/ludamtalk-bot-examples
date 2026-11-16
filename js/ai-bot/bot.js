// AI 봇 — /질문 으로 물어보면 AI가 대답해요. 쓰는 동안 채팅방에 "AI로 답을 쓰는 중"이 보여요
// 고를 수 있는 AI: Claude(Anthropic) · GPT(OpenAI) · Gemini(Google) — .env 의 AI_PROVIDER 로 골라요
// 켜기: npm install → .env 에 LUDAM_TOKEN · AI_PROVIDER · AI_API_KEY 넣기 → npm start
// AI 열쇠는 각 회사 콘솔에서 받아요. 쓴 만큼 요금이 나올 수 있어요
const { Client } = require("ludamtalk");

const bot = new Client({ token: process.env.LUDAM_TOKEN });
const PROVIDER = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
const KEY = process.env.AI_API_KEY || "";
// 모델 이름은 각 회사 문서에서 최신 것으로 바꿔 쓰세요
const MODEL = process.env.AI_MODEL || { anthropic: "claude-haiku-5-5", openai: "gpt-4o-mini", gemini: "gemini-2.5-flash" }[PROVIDER];
const SYSTEM = "너는 루담톡 온라인채팅방의 친절한 도우미야. 한국어로 짧고 쉽게(5문장 안으로) 대답해. 모르는 건 모른다고 해. 개인정보는 묻지 마.";

// 방마다 최근 대화 10개만 기억해요 (프로그램을 끄면 지워져요)
const memory = new Map();
const remember = (room, role, text) => {
  const list = memory.get(room) || [];
  list.push({ role, text: String(text).slice(0, 1500) });
  memory.set(room, list.slice(-10));
};

async function ask(room, question) {
  remember(room, "user", question);
  const hist = memory.get(room);
  const signal = AbortSignal.timeout(30000);
  let r, out;
  if (PROVIDER === "openai") {
    r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: "system", content: SYSTEM }, ...hist.map((m) => ({ role: m.role, content: m.text }))] }),
    });
    const j = await r.json();
    out = j.choices?.[0]?.message?.content;
  } else if (PROVIDER === "gemini") {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-goog-api-key": KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: hist.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })) }),
    });
    const j = await r.json();
    out = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("");
  } else {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: SYSTEM, messages: hist.map((m) => ({ role: m.role, content: m.text })) }),
    });
    const j = await r.json();
    out = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  }
  if (!r.ok || !out) throw new Error(`AI 대답 실패 (${r.status})`);
  remember(room, "assistant", out);
  return out.slice(0, 1800);
}

bot.on("ready", (me) => console.log(`[켜짐] ${me.name} 온라인 · ${PROVIDER} / ${MODEL}`));
bot.on("error", (e) => console.log("[오류]", e.message));

bot.command("질문", "AI에게 물어봐요", async (ctx) => {
  if (!ctx.args) return ctx.reply("`/질문 오늘 저녁 메뉴 추천해 줘` 처럼 물어봐 주세요.");
  if (!KEY) return ctx.reply("봇에 AI 열쇠가 아직 없어요. 봇을 만든 사람에게 알려 주세요.");
  // "AI로 답을 쓰는 중" 표시 (10초마다 다시 켜요)
  await ctx.typing(true).catch(() => {});
  const keep = setInterval(() => ctx.typing(true).catch(() => {}), 8000);
  try {
    const text = await ask(ctx.room.id, ctx.args);
    await ctx.reply({ text, ai: true }); // ai: true → 메시지에 "AI" 표시
  } catch (e) {
    console.log("[AI 오류]", e.message);
    await ctx.reply("지금은 AI가 대답하지 못했어요. 잠시 뒤 다시 물어봐 주세요.");
  } finally {
    clearInterval(keep);
  }
});

bot.command("잊어", "이 방의 AI 대화 기억을 지워요", async (ctx) => {
  memory.delete(ctx.room.id);
  await ctx.reply("이 방에서 나눈 AI 대화를 잊었어요.");
});

bot.login();
