// 보안 봇 — 나쁜 말 지우기 · 도배 막기 · 멘션 폭탄 막기 · 새 계정 알림 · 방 잠그기
// 필요한 권한: 개발자 사이트에서 "모든 메시지" + "관리" 켜기 (운영자 심사를 다시 받아요)
// 켜기: npm install → .env 에 LUDAM_TOKEN 넣기 → npm start
const { Client } = require("ludamtalk");

const bot = new Client({ token: process.env.LUDAM_TOKEN });

// ── 설정 (방 분위기에 맞게 바꿔 쓰세요) ─────────────────────
const BAD_WORDS = (process.env.BAD_WORDS || "나쁜말1,나쁜말2").split(",").map((w) => w.trim()).filter(Boolean);
const FLOOD_COUNT = 5; // 이만큼 보내면
const FLOOD_SECONDS = 8; // 이 시간 안에
const FLOOD_TIMEOUT_MIN = 10; // 잠깐 말 못 하게 하는 시간(분)
const MENTION_LIMIT = 5; // 한 메시지에 멘션이 이만큼 넘으면 지워요

// 띄어쓰기·기호를 빼고 비교해요 (나 쁜 말, 나.쁜.말 도 잡아요)
const norm = (s) => String(s || "").normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
const BAD = BAD_WORDS.map(norm);

const recent = new Map(); // "방:사람" → 최근 보낸 시각들
function isFlood(room, user) {
  const key = `${room}:${user}`;
  const now = Date.now();
  const list = (recent.get(key) || []).filter((t) => now - t < FLOOD_SECONDS * 1000);
  list.push(now);
  recent.set(key, list);
  if (recent.size > 5000) recent.clear(); // 메모리 아끼기
  return list.length >= FLOOD_COUNT;
}

bot.on("ready", (me) => console.log(`[켜짐] ${me.name} 온라인 · 나쁜 말 ${BAD.length}개 감시 중`));
bot.on("error", (e) => console.log("[오류]", e.message));

// 모든 메시지 검사 ("모든 메시지" 권한이 있어야 와요)
bot.on("message", async (ctx) => {
  const text = norm(ctx.text);
  try {
    if (BAD.some((w) => w && text.includes(w))) {
      await ctx.delete();
      await ctx.send(`${ctx.user.name}님, 이 방에서 쓰면 안 되는 말이 있어서 메시지를 지웠어요.`);
      return;
    }
    if ((ctx.message.mentions || 0) > MENTION_LIMIT) {
      await ctx.delete();
      await ctx.send(`${ctx.user.name}님, 한 번에 너무 많은 사람을 불러서 메시지를 지웠어요.`);
      return;
    }
    if (isFlood(ctx.room.id, ctx.user.id)) {
      await ctx.timeout(FLOOD_TIMEOUT_MIN, "도배");
      recent.delete(`${ctx.room.id}:${ctx.user.id}`);
      await ctx.send(`${ctx.user.name}님이 짧은 시간에 너무 많이 보내서 ${FLOOD_TIMEOUT_MIN}분 동안 말을 막았어요.`);
    }
  } catch (e) {
    // 방장·부방장 메시지는 지울 수 없어요 (서버가 막아요)
    console.log("[처리 못 함]", e.message);
  }
});

// 새로 들어온 사람: 만든 지 7일 안 된 계정이면 알려 줘요
bot.on("memberJoin", async (ctx) => {
  try {
    if (ctx.user.newAccount) await ctx.send(`새로 들어온 ${ctx.user.name}님은 가입한 지 얼마 안 된 계정이에요. 조심해 주세요.`);
  } catch (e) {
    console.log("[처리 못 함]", e.message);
  }
});

// 방장·부방장만 쓸 수 있는 명령어
async function isManager(ctx) {
  const { members } = await bot.members(ctx.room.id);
  const me = members.find((m) => m.id === ctx.user.id);
  return !!me && (me.role === "owner" || me.role === "sub");
}

bot.command("잠그기", "방을 잠가요 (방장·부방장만)", async (ctx) => {
  if (!(await isManager(ctx))) return ctx.reply("방장·부방장만 쓸 수 있어요.");
  await bot.lock(ctx.room.id, ctx.args || "보안 봇이 잠갔어요");
  await ctx.reply("방을 잠갔어요. 이제 방장·부방장만 말할 수 있어요. `/풀기`로 풀어요.");
});

bot.command("풀기", "방 잠금을 풀어요 (방장·부방장만)", async (ctx) => {
  if (!(await isManager(ctx))) return ctx.reply("방장·부방장만 쓸 수 있어요.");
  await bot.unlock(ctx.room.id);
  await ctx.reply("방 잠금을 풀었어요.");
});

bot.login();
