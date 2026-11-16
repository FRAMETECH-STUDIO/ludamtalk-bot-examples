# AI 봇 (파이썬) — /질문 으로 물어보면 AI가 대답해요. 쓰는 동안 "AI로 답을 쓰는 중"이 보여요
# 고를 수 있는 AI: anthropic(Claude) · openai(GPT) · gemini — AI_PROVIDER 환경 변수로 골라요
# 켜기: pip install ludamtalk → LUDAM_TOKEN · AI_PROVIDER · AI_API_KEY 환경 변수 → python ai_bot.py
# 추가 설치 없이 파이썬 기본 도구(urllib)로 AI를 불러요. AI는 쓴 만큼 요금이 나올 수 있어요
import asyncio
import json
import os
import re
import urllib.request

import ludamtalk as ludam

bot = ludam.Bot(token=os.environ.get("LUDAM_TOKEN", ""))
PROVIDER = os.environ.get("AI_PROVIDER", "anthropic").lower()
KEY = os.environ.get("AI_API_KEY", "")
# 모델 이름은 각 회사 문서에서 최신 것으로 바꿔 쓰세요
MODEL = os.environ.get("AI_MODEL") or {"anthropic": "claude-haiku-5-5", "openai": "gpt-4o-mini", "gemini": "gemini-2.5-flash"}.get(PROVIDER, "")
SYSTEM = "너는 루담톡 온라인채팅방의 친절한 도우미야. 한국어로 짧고 쉽게(5문장 안으로) 대답해. 모르는 건 모른다고 해. 개인정보는 묻지 마."
memory = {}  # 방 → 최근 대화 10개


def post(url, headers, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"content-type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def call_ai(hist):
    if PROVIDER == "openai":
        j = post("https://api.openai.com/v1/chat/completions", {"authorization": f"Bearer {KEY}"},
                 {"model": MODEL, "max_tokens": 700, "messages": [{"role": "system", "content": SYSTEM}] + [{"role": m["role"], "content": m["text"]} for m in hist]})
        return j["choices"][0]["message"]["content"]
    if PROVIDER == "gemini":
        if not re.fullmatch(r"[A-Za-z0-9._-]+", MODEL):
            raise ValueError("모델 이름을 확인해 주세요")
        j = post(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", {"x-goog-api-key": KEY},
                 {"systemInstruction": {"parts": [{"text": SYSTEM}]}, "contents": [{"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["text"]}]} for m in hist]})
        return "".join(p.get("text", "") for p in j["candidates"][0]["content"]["parts"])
    j = post("https://api.anthropic.com/v1/messages", {"x-api-key": KEY, "anthropic-version": "2023-06-01"},
             {"model": MODEL, "max_tokens": 700, "system": SYSTEM, "messages": [{"role": m["role"], "content": m["text"]} for m in hist]})
    return "".join(b.get("text", "") for b in j.get("content", []) if b.get("type") == "text")


@bot.event
async def on_ready(me):
    print(f"[켜짐] {me['name']} 온라인 · {PROVIDER} / {MODEL}")


@bot.command("질문", "AI에게 물어봐요")
async def question(ctx):
    if not ctx.args:
        await ctx.reply("`/질문 오늘 저녁 메뉴 추천해 줘` 처럼 물어봐 주세요.")
        return
    if not KEY:
        await ctx.reply("봇에 AI 열쇠가 아직 없어요. 봇을 만든 사람에게 알려 주세요.")
        return
    room = ctx.room.get("id")
    hist = (memory.get(room, []) + [{"role": "user", "text": ctx.args[:1500]}])[-10:]

    async def keep_typing():  # "AI로 답을 쓰는 중" 표시를 8초마다 다시 켜요
        while True:
            try:
                await ctx.typing(ai=True)
            except Exception:
                pass
            await asyncio.sleep(8)

    typing = asyncio.create_task(keep_typing())
    try:
        text = (await asyncio.to_thread(call_ai, hist)).strip()
        if not text:
            raise ValueError("빈 대답")
        memory[room] = (hist + [{"role": "assistant", "text": text[:1500]}])[-10:]
        await ctx.reply(text[:1800], ai=True)  # ai=True → 메시지에 "AI" 표시
    except Exception as e:
        print("[AI 오류]", e)
        await ctx.reply("지금은 AI가 대답하지 못했어요. 잠시 뒤 다시 물어봐 주세요.")
    finally:
        typing.cancel()


@bot.command("잊어", "이 방의 AI 대화 기억을 지워요")
async def forget(ctx):
    memory.pop(ctx.room.get("id"), None)
    await ctx.reply("이 방에서 나눈 AI 대화를 잊었어요.")


bot.run()
