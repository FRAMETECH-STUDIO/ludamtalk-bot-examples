# 루담톡 예제 봇 모음

[English](README.md) · **한국어**

루담톡(LudamTalk) 온라인채팅 봇을 바로 시작할 수 있는 **공식 예제**예요. 복사해서 고쳐 쓰면 돼요.

- 봇 만들기(열쇠 받기): https://web.ludamtalk.com/dev
- 설명서: https://ludamtalk.com/developers
- 공식 SDK: [FRAMETECH-STUDIO/ludamtalk-sdk](https://github.com/FRAMETECH-STUDIO/ludamtalk-sdk)

## 예제 목록

| 예제 | 하는 일 | 필요한 권한 | JavaScript | Python |
| --- | --- | --- | --- | --- |
| 인사 봇 | `/안녕` `/주사위` `/골라` `/시간` `/소개` | 없음 | [js/hello-bot](js/hello-bot) | [python/hello_bot.py](python/hello_bot.py) |
| 보안 봇 | 나쁜 말 지우기 · 도배하면 잠깐 말 막기 · 멘션 폭탄 지우기 · 새 계정 알림 · `/잠그기` `/풀기` | 모든 메시지 + 관리 | [js/security-bot](js/security-bot) | [python/security_bot.py](python/security_bot.py) |
| AI 봇 | `/질문` 에 Claude · GPT · Gemini 가 대답 ("AI로 답을 쓰는 중" 표시 + AI 표시) | 없음 | [js/ai-bot](js/ai-bot) | [python/ai_bot.py](python/ai_bot.py) |
| 대시보드 | "루담으로 로그인" (OAuth + PKCE) 으로 내가 방장인 방 보기 | 없음 | [js/dashboard](js/dashboard) | — |

## 시작하기 (JavaScript)

필요한 프로그램: **Node.js 20.6 이상**, 코드 편집기 **VS Code**

```bash
cd js/hello-bot
npm install
```

1. `.env.example` 파일을 복사해서 이름을 `.env` 로 바꿔요.
2. `.env` 의 `LUDAM_TOKEN=` 뒤에 개발자 사이트에서 받은 봇 열쇠(`ldb_…`)를 넣어요.
3. `npm start` 로 켜요. `[켜짐] … 온라인` 이 나오면 성공이에요.

## 시작하기 (Python)

필요한 프로그램: **Python 3.9 이상**

```bash
pip install ludamtalk
```

윈도우 PowerShell 에서 열쇠를 넣고 켜요.

```powershell
$env:LUDAM_TOKEN="ldb_…"; python python/hello_bot.py
```

## 봇을 채팅방에 넣기

1. 개발자 사이트에서 봇을 만들면 운영자가 확인한 뒤 **승인**돼요.
2. 봇의 **초대 링크**(`ludamtalk.com/b/…`)를 열고, 내가 방장인 온라인채팅방을 골라 추가해요.
3. 그 방에서 `/안녕` 을 보내 보세요.

## 지켜 주세요

- 봇 열쇠·AI 열쇠·클라이언트 비밀값은 **비밀번호처럼** 다뤄요. `.env` 는 깃허브에 올리지 마세요 (이 저장소의 `.gitignore` 가 막아 줘요).
- 보안 봇의 "모든 메시지" 권한은 방 사람들의 메시지를 받는 권한이에요. 꼭 필요할 때만 켜고, 받은 메시지를 저장하거나 다른 곳에 보내지 마세요.
- AI 봇은 AI 회사에 질문을 보내요. 쓴 만큼 요금이 나올 수 있어요.
- 봇 운영 규칙: https://ludamtalk.com/developers#rules

보안 문제를 찾으면 공개 이슈 대신 help@ludamtalk.com 으로 알려 주세요.

## 라이선스

MIT © FRAMETECH STUDIO — 마음껏 복사하고 고쳐서 내 봇으로 쓰세요.
