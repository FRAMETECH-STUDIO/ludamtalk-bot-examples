# 보안 봇 (파이썬) — 나쁜 말 지우기 · 도배 막기 · 멘션 폭탄 막기 · 새 계정 알림 · 방 잠그기
# 필요한 권한: 개발자 사이트에서 "모든 메시지" + "관리" 켜기 (운영자 심사를 다시 받아요)
# 켜기: pip install ludamtalk → LUDAM_TOKEN (+ BAD_WORDS) 환경 변수 → python security_bot.py
import os
import re
import time
import unicodedata

import ludamtalk as ludam

bot = ludam.Bot(token=os.environ.get("LUDAM_TOKEN", ""))

BAD_WORDS = [w.strip() for w in os.environ.get("BAD_WORDS", "나쁜말1,나쁜말2").split(",") if w.strip()]
FLOOD_COUNT, FLOOD_SECONDS, FLOOD_TIMEOUT_MIN, MENTION_LIMIT = 5, 8, 10, 5


def norm(s):
    """띄어쓰기·기호를 빼고 비교해요 (나 쁜 말, 나.쁜.말 도 잡아요)"""
    s = unicodedata.normalize("NFKC", str(s or "")).lower()
    return "".join(ch for ch in s if not ch.isspace() and not unicodedata.category(ch).startswith(("P", "S")))


BAD = [norm(w) for w in BAD_WORDS]
recent = {}  # (방, 사람) → 최근 보낸 시각들


def is_flood(room, user):
    now = time.time()
    key = (room, user)
    lst = [t for t in recent.get(key, []) if now - t < FLOOD_SECONDS] + [now]
    recent[key] = lst
    if len(recent) > 5000:
        recent.clear()
    return len(lst) >= FLOOD_COUNT


@bot.event
async def on_ready(me):
    print(f"[켜짐] {me['name']} 온라인 · 나쁜 말 {len(BAD)}개 감시 중")


@bot.event
async def on_message(ctx):
    text = norm(ctx.text)
    name = ctx.user.get("name", "")
    try:
        if any(w and w in text for w in BAD):
            await ctx.delete()
            await ctx.send(f"{name}님, 이 방에서 쓰면 안 되는 말이 있어서 메시지를 지웠어요.")
        elif (ctx.message.get("mentions") or 0) > MENTION_LIMIT:
            await ctx.delete()
            await ctx.send(f"{name}님, 한 번에 너무 많은 사람을 불러서 메시지를 지웠어요.")
        elif is_flood(ctx.room.get("id"), ctx.user.get("id")):
            await ctx.timeout(FLOOD_TIMEOUT_MIN, "도배")
            recent.pop((ctx.room.get("id"), ctx.user.get("id")), None)
            await ctx.send(f"{name}님이 짧은 시간에 너무 많이 보내서 {FLOOD_TIMEOUT_MIN}분 동안 말을 막았어요.")
    except ludam.LudamError as e:  # 방장·부방장 메시지는 지울 수 없어요
        print("[처리 못 함]", e)


@bot.event
async def on_member_join(ctx):
    if ctx.user.get("newAccount"):
        await ctx.send(f"새로 들어온 {ctx.user.get('name', '')}님은 가입한 지 얼마 안 된 계정이에요. 조심해 주세요.")


async def is_manager(ctx):
    data = await bot.members(ctx.room.get("id"))
    me = next((m for m in data.get("members", []) if m.get("id") == ctx.user.get("id")), None)
    return bool(me) and me.get("role") in ("owner", "sub")


@bot.command("잠그기", "방을 잠가요 (방장·부방장만)")
async def lock(ctx):
    if not await is_manager(ctx):
        await ctx.reply("방장·부방장만 쓸 수 있어요.")
        return
    await bot.lock(ctx.room.get("id"), ctx.args or "보안 봇이 잠갔어요")
    await ctx.reply("방을 잠갔어요. 이제 방장·부방장만 말할 수 있어요. `/풀기`로 풀어요.")


@bot.command("풀기", "방 잠금을 풀어요 (방장·부방장만)")
async def unlock(ctx):
    if not await is_manager(ctx):
        await ctx.reply("방장·부방장만 쓸 수 있어요.")
        return
    await bot.unlock(ctx.room.get("id"))
    await ctx.reply("방 잠금을 풀었어요.")


bot.run()
