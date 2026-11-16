# 인사 봇 (파이썬) — 가장 간단한 루담톡 봇
# 켜기: pip install ludamtalk → LUDAM_TOKEN 환경 변수 넣기 → python hello_bot.py
#   윈도우 PowerShell: $env:LUDAM_TOKEN="ldb_…"; python hello_bot.py
import asyncio
import os
import random
from datetime import datetime, timedelta, timezone

import ludamtalk as ludam

bot = ludam.Bot(token=os.environ.get("LUDAM_TOKEN", ""))


async def answer(ctx, text=None, *, embed=None, wait=0.6):
    """답하기 전에 "쓰는 중"을 잠깐 보여 줘요"""
    try:
        await ctx.typing()
    except Exception:
        pass
    await asyncio.sleep(wait)
    await ctx.reply(text, embed=embed)


@bot.event
async def on_ready(me):
    print(f"[켜짐] {me['name']} 온라인")


@bot.command("안녕", "봇이 인사해요")
async def hello(ctx):
    await answer(ctx, f"안녕하세요, **{ctx.user.get('name', '')}**님. 반가워요.")


@bot.command("주사위", "1~6 주사위")
async def dice(ctx):
    await answer(ctx, f"주사위를 굴렸더니 **{random.randint(1, 6)}** 이(가) 나왔어요.", wait=0.9)


@bot.command("골라", "여러 개 중 하나를 골라요")
async def pick(ctx):
    if len(ctx.argv) < 2:
        await ctx.reply("`/골라 짜장 짬뽕` 처럼 두 개 이상 적어 주세요.")
        return
    await answer(ctx, f"저는 **{random.choice(ctx.argv)}** 이(가) 좋겠어요.", wait=1.0)


@bot.command("시간", "지금 한국 시각")
async def now(ctx):
    kst = datetime.now(timezone(timedelta(hours=9)))
    await answer(ctx, f"지금은 {kst:%Y년 %m월 %d일 %H시 %M분} 이에요.")


@bot.command("소개", "봇 소개 카드")
async def about(ctx):
    e = ludam.Embed(title="인사 봇", color=0x3B82F6, description="명령어: `/안녕` `/주사위` `/골라` `/시간` `/소개`")
    e.add_field("만든 도구", "ludamtalk (PyPI)", inline=True)
    e.set_footer("ludamtalk.com/developers")
    await answer(ctx, embed=e)


bot.run()
