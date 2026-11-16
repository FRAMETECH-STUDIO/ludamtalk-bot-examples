// "루담으로 로그인" 대시보드 예제 — 설치할 것 없이 Node.js만으로 돌아가요
//  1) 개발자 사이트 → 내 봇 → "로그인 주소(redirect)"에 http://localhost:3000/callback 넣기
//  2) .env 에 CLIENT_ID(봇 번호) · CLIENT_SECRET(클라이언트 비밀값) 넣기 → npm start → http://localhost:3000
//  보안: state(가짜 요청 막기) + PKCE(코드 가로채기 막기)를 써요. 비밀값은 서버에만 두고 화면에 보내지 않아요
const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const REDIRECT = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;
const AUTH = "https://ludamtalk.com/oauth/authorize";
const API = "https://api.ludamtalk.com";

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sessions = new Map(); // 쿠키 → { state, verifier, token, exp }

function page(body) {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>봇 대시보드</title><style>body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#222}
a.btn{display:inline-block;background:#7c6cff;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700}
li{margin:6px 0}.muted{color:#888;font-size:14px}</style>${body}`;
}
function session(req, res) {
  const m = /(?:^|;\s*)sid=([A-Za-z0-9_-]{20,})/.exec(req.headers.cookie || "");
  if (m && sessions.has(m[1])) return sessions.get(m[1]);
  const id = b64url(crypto.randomBytes(24));
  const s = {};
  sessions.set(id, s);
  res.setHeader("set-cookie", `sid=${id}; HttpOnly; SameSite=Lax; Path=/`);
  return s;
}
const send = (res, code, html) => { res.writeHead(code, { "content-type": "text/html; charset=utf-8" }); res.end(html); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const s = session(req, res);
  try {
    if (url.pathname === "/") {
      if (!s.token || s.exp < Date.now()) return send(res, 200, page(`<h1>내 봇 대시보드</h1><p>루담톡 계정으로 로그인하면 내가 방장인 방을 볼 수 있어요.</p><a class="btn" href="/login">루담으로 로그인</a>`));
      const h = { authorization: `Bearer ${s.token}` };
      const [me, rooms] = await Promise.all([
        fetch(`${API}/oauth/me`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/oauth/rooms`, { headers: h }).then((r) => r.json()),
      ]);
      const list = (rooms.rooms || []).map((r) => `<li><b>${esc(r.title)}</b> · ${esc(r.n)}명 ${r.installed ? "· 봇 들어가 있음" : ""}</li>`).join("") || "<li>내가 방장인 온라인채팅방이 없어요</li>";
      return send(res, 200, page(`<h1>${esc(me.name)}님, 반가워요</h1><p class="muted">대시보드용 번호: ${esc(me.id)}</p><h2>내가 방장인 방</h2><ul>${list}</ul><p><a href="/logout">로그아웃</a></p>`));
    }
    if (url.pathname === "/login") {
      s.state = b64url(crypto.randomBytes(16));
      s.verifier = b64url(crypto.randomBytes(48));
      const challenge = b64url(crypto.createHash("sha256").update(s.verifier).digest());
      const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT, response_type: "code", scope: "identify rooms", state: s.state, code_challenge: challenge, code_challenge_method: "S256" });
      res.writeHead(302, { location: `${AUTH}?${q}` });
      return res.end();
    }
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code || !s.state || url.searchParams.get("state") !== s.state) return send(res, 400, page("<p>로그인 요청이 맞지 않아요. 처음부터 다시 해 주세요.</p><a href='/'>처음으로</a>"));
      const r = await fetch(`${API}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code_verifier: s.verifier }),
      });
      const j = await r.json();
      s.state = s.verifier = null; // 한 번만 써요
      if (!r.ok) return send(res, 400, page(`<p>로그인하지 못했어요: ${esc(j.error_description || j.error)}</p><a href='/'>처음으로</a>`));
      s.token = j.access_token;
      s.exp = Date.now() + (j.expires_in || 3600) * 1000;
      res.writeHead(302, { location: "/" });
      return res.end();
    }
    if (url.pathname === "/logout") {
      s.token = null;
      res.writeHead(302, { location: "/" });
      return res.end();
    }
    send(res, 404, page("<p>없는 페이지예요.</p>"));
  } catch (e) {
    console.log("[오류]", e.message);
    send(res, 500, page("<p>잠시 문제가 생겼어요. 다시 해 주세요.</p>"));
  }
}).listen(PORT, "127.0.0.1", () => {
  if (!CLIENT_ID || !CLIENT_SECRET) console.log("[알림] .env 에 CLIENT_ID 와 CLIENT_SECRET 을 넣어 주세요");
  console.log(`[켜짐] http://localhost:${PORT}`);
});
