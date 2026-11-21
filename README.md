# LudamTalk example bots

**English** · [한국어](README.ko.md)

Official, ready-to-run example bots for [LudamTalk](https://ludamtalk.com/en) open chat rooms. Copy one and make it your own.

| Example | What it does | Permissions | JavaScript | Python |
| --- | --- | --- | --- | --- |
| Greeting bot | `/안녕` (hello), `/주사위` (dice), `/골라` (pick), `/시간` (time), `/소개` (about) | None | [js/hello-bot](js/hello-bot) | [python/hello_bot.py](python/hello_bot.py) |
| Moderation bot | Deletes banned words (even with spaces or symbols), times out spammers, removes mention bombs, flags new accounts, `/잠그기` (lock) and `/풀기` (unlock) for room managers | All messages + Manage | [js/security-bot](js/security-bot) | [python/security_bot.py](python/security_bot.py) |
| AI bot | Answers `/질문` (ask) with Claude, GPT or Gemini — shows "AI is typing" and an AI label | None | [js/ai-bot](js/ai-bot) | [python/ai_bot.py](python/ai_bot.py) |
| Dashboard | "Sign in with Ludam" (OAuth + PKCE) to list rooms you own — plain Node.js, no packages | None | [js/dashboard](js/dashboard) | — |

**Quick start (JavaScript, Node.js 20.6+)**

```bash
cd js/hello-bot
npm install
cp .env.example .env   # put your bot token (ldb_…) after LUDAM_TOKEN=
npm start
```

**Quick start (Python 3.9+)**

```bash
pip install ludamtalk
LUDAM_TOKEN=ldb_… python python/hello_bot.py
```

Get a bot token at https://web.ludamtalk.com/dev. After your bot is approved, open its invite link (`ludamtalk.com/b/…`) and add it to an open chat room you own. Command names and replies in these examples are in Korean — feel free to change them.

Keep your bot token, AI keys and client secret private, and never commit `.env`. "All messages" permission lets a bot read everything in a room: only use it when you need it, and never store or forward those messages.

Found a security issue? Email help@ludamtalk.com instead of opening a public issue. License: MIT © FRAMETECH STUDIO.
