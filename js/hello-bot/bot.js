// 인사 봇 — 가장 간단한 루담톡 봇
// 켜기: npm install → .env 에 LUDAM_TOKEN 넣기 → npm start
const { Client, Embed } = require("ludamtalk");

const bot = new Client({ token: process.env.LUDAM_TOKEN });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// 답하기 전에 "쓰는 중"을 잠깐 보여 주면 더 자연스러워요
async function answer(ctx, content, ms = 600) {
  await ctx.typing().catch(() => {});
  await pause(ms);
  return ctx.reply(content);
}

bot.on("ready", (me) => console.log(`[켜짐] ${me.name} 온라인`));
bot.on("error", (e) => console.log("[오류]", e.message));

bot.command("안녕", "봇이 인사해요", (ctx) => answer(ctx, `안녕하세요, **${ctx.user.name}**님. 반가워요.`));

bot.command("주사위", "1~6 주사위", (ctx) => {
  const n = 1 + Math.floor(Math.random() * 6);
  return answer(ctx, `주사위를 굴렸더니 **${n}** 이(가) 나왔어요.`, 900);
});

// /골라 짜장 짬뽕 볶음밥 → 하나 골라 줘요
bot.command("골라", "여러 개 중 하나를 골라요", (ctx) => {
  if (ctx.argv.length < 2) return ctx.reply("`/골라 짜장 짬뽕` 처럼 두 개 이상 적어 주세요.");
  const pick = ctx.argv[Math.floor(Math.random() * ctx.argv.length)];
  return answer(ctx, `저는 **${pick}** 이(가) 좋겠어요.`, 1000);
});

bot.command("시간", "지금 한국 시각", (ctx) =>
  answer(ctx, `지금은 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 이에요.`));

bot.command("소개", "봇 소개 카드", (ctx) =>
  answer(ctx, new Embed()
    .title("인사 봇")
    .color(0x3b82f6)
    .description("명령어: `/안녕` `/주사위` `/골라` `/시간` `/소개`")
    .field("만든 도구", "ludamtalk (npm)", true)
    .footer("ludamtalk.com/developers")));

bot.login();
