#!/usr/bin/env python3
"""
BumDesMart Server Monitoring Bot
Arsitektur: Monitor → Classifier → Rate Limiter → Alert + AI → Audit Log
"""

import os
import json
import subprocess
import threading
import time
import requests
from datetime import datetime, timedelta
from pathlib import Path

# ─── Config ───────────────────────────────────────────────────────────────────

BOT_TOKEN  = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID    = int(os.environ["TELEGRAM_CHAT_ID"])
GEMINI_KEY = os.environ["GEMINI_API_KEY"]
GROQ_KEY   = os.environ["GROQ_API_KEY"]

ALLOWED_USERS = {
    6483972454: "Dzaki",
    8129182235: "Fajar",
    # Tambahkan Oki setelah dapat ID-nya
}

API         = f"https://api.telegram.org/bot{BOT_TOKEN}"
AUDIT_FILE  = Path("/home/bumdes/BUMDESMart/server/audit_log.jsonl")
CONTEXT_FILE = Path("/home/bumdes/BUMDESMart/server/server_context.md")

# ─── State ────────────────────────────────────────────────────────────────────

_alerted_down  = set()          # container yang sedang down
_cooldowns     = {}             # {alert_key: datetime} rate limiting
_mute_until    = None           # datetime atau None

COOLDOWN_RULES = {
    "container_down":  0,       # CRITICAL: no cooldown
    "container_up":    0,
    "disk_warning":    3600,    # 1 jam
    "laravel_error":   1800,    # 30 menit
}

# ─── Severity Classifier ──────────────────────────────────────────────────────

SEVERITY_CRITICAL = "🔴 CRITICAL"
SEVERITY_WARNING  = "🟡 WARNING"
SEVERITY_INFO     = "🔵 INFO"

def classify(alert_type: str) -> str:
    if alert_type in ("container_down", "container_up"):
        return SEVERITY_CRITICAL
    if alert_type in ("disk_warning",):
        return SEVERITY_WARNING
    return SEVERITY_INFO

# ─── Rate Limiter ─────────────────────────────────────────────────────────────

def is_cooldown(key: str) -> bool:
    cooldown_sec = COOLDOWN_RULES.get(key, 600)
    if cooldown_sec == 0:
        return False
    last = _cooldowns.get(key)
    if last and datetime.now() - last < timedelta(seconds=cooldown_sec):
        return True
    return False

def set_cooldown(key: str):
    _cooldowns[key] = datetime.now()

# ─── Audit Log ────────────────────────────────────────────────────────────────

def audit(event_type: str, detail: str, ai_analysis: str = ""):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "type":      event_type,
        "detail":    detail,
        "ai":        ai_analysis,
    }
    try:
        with open(AUDIT_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"[audit error] {e}")

# ─── Telegram helpers ─────────────────────────────────────────────────────────

def send(text: str, parse_mode="HTML"):
    try:
        requests.post(f"{API}/sendMessage", json={
            "chat_id": CHAT_ID,
            "text":    text,
            "parse_mode": parse_mode,
        }, timeout=10)
    except Exception as e:
        print(f"[send error] {e}")

def reply(chat_id: int, message_id: int, text: str):
    try:
        requests.post(f"{API}/sendMessage", json={
            "chat_id":           chat_id,
            "reply_to_message_id": message_id,
            "text":              text,
            "parse_mode":        "HTML",
        }, timeout=10)
    except Exception as e:
        print(f"[reply error] {e}")

# ─── Shell helper ─────────────────────────────────────────────────────────────

def sh(cmd: str, timeout=30) -> str:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return (result.stdout + result.stderr).strip()
    except subprocess.TimeoutExpired:
        return "⏱ Timeout"
    except Exception as e:
        return f"Error: {e}"

# ─── Info collectors ──────────────────────────────────────────────────────────

def get_container_status() -> str:
    out = sh("docker ps --format '{{.Names}}\t{{.Status}}' | grep bumdesmart")
    important = ["bumdesmart_be", "bumdesmart_fe", "bumdesmart_db",
                 "bumdesmart_redis", "bumdesmart_caddy", "bumdesmart_cloudflared", "bumdesmart_queue"]
    status_map = {}
    for line in out.splitlines():
        parts = line.split("\t", 1)
        if len(parts) == 2:
            status_map[parts[0].strip()] = parts[1].strip()

    lines = []
    for name in important:
        short = name.replace("bumdesmart_", "")
        if name in status_map:
            s = status_map[name]
            icon = "✅" if s.startswith("Up") else "🔴"
            lines.append(f"{icon} <b>{short}</b>: {s}")
        else:
            lines.append(f"🔴 <b>{short}</b>: not found")
    return "\n".join(lines)

def get_resources() -> str:
    ram        = sh("free -m | awk '/Mem:/ {printf \"%.0f%%\", $3/$2*100}'")
    ram_detail = sh("free -m | awk '/Mem:/ {printf \"%dMB / %dMB\", $3, $2}'")
    cpu        = sh("top -bn1 | grep 'Cpu(s)' | awk '{print 100-$8\"%\"}'")
    disk       = sh("df -h / | awk 'NR==2 {print $5\" (\"$3\"/\"$2\")\"}'")
    return (
        f"🧠 <b>RAM</b>: {ram} ({ram_detail})\n"
        f"⚡ <b>CPU</b>: {cpu}\n"
        f"💾 <b>Disk</b>: {disk}"
    )

def get_laravel_errors(n=20) -> str:
    out = sh(f"docker exec bumdesmart_be grep -a 'production.ERROR' storage/logs/laravel.log 2>/dev/null | tail -{n}")
    if not out or "No such" in out:
        return "Tidak ada error terbaru."
    errors = [l for l in out.splitlines() if "production.ERROR" in l]
    return "\n".join(errors[-n:]) if errors else "Tidak ada error terbaru."

def load_server_context() -> str:
    if CONTEXT_FILE.exists():
        return CONTEXT_FILE.read_text(encoding="utf-8")
    return """Server: BumDesMart — e-commerce desa
Stack: Laravel 11 (backend), Next.js 14 (frontend), MariaDB, Redis, Caddy, Cloudflare Tunnel
Deployment: Docker Compose di VPS Ubuntu
Containers: bumdesmart_be, bumdesmart_fe, bumdesmart_db, bumdesmart_redis, bumdesmart_caddy, bumdesmart_cloudflared, bumdesmart_queue
Queue: Laravel Queue Worker untuk konversi gambar ke WebP
Storage: Docker named volume backend_storage"""

# ─── AI helpers ───────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Kamu adalah DevOps engineer senior yang monitoring server BumDesMart 24/7.
Jawab dalam Bahasa Indonesia, singkat dan actionable.
Kalau ada error log: jelaskan penyebab, tingkat bahaya (rendah/sedang/tinggi), dan perintah konkret untuk fix.
Jangan bertele-tele."""

def ask_groq(prompt: str) -> str:
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                "max_tokens": 800,
                "temperature": 0.2,
            },
            timeout=30,
        )
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[Groq error] {e}"

def ask_gemini(prompt: str, use_search=False) -> str:
    try:
        body = {
            "contents": [{"parts": [{"text": SYSTEM_PROMPT + "\n\n" + prompt}]}],
        }
        if use_search:
            body["tools"] = [{"google_search": {}}]
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_KEY}",
            json=body,
            timeout=30,
        )
        data = resp.json()
        # Debug: log raw response jika tidak ada candidates
        if "candidates" not in data:
            print(f"[Gemini raw] {json.dumps(data)[:500]}")
            return f"[Gemini error] {data.get('error', {}).get('message', str(data))}"
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"[Gemini error] {e}"

def ask_ai(prompt: str, use_search=False) -> str:
    """Groq dulu (cepat), fallback Gemini."""
    if use_search:
        return ask_gemini(prompt, use_search=True)
    result = ask_groq(prompt)
    if result.startswith("[Groq error]"):
        result = ask_gemini(prompt)
    return result

# ─── Alert + AI pipeline ──────────────────────────────────────────────────────

def alert_with_ai(alert_type: str, title: str, detail: str):
    """Kirim alert ke Telegram, lalu analisis AI secara paralel."""
    global _mute_until

    severity = classify(alert_type)

    # Rate limiting
    if is_cooldown(alert_type):
        audit(alert_type, detail, "skipped (cooldown)")
        return
    set_cooldown(alert_type)

    # Mute check (kecuali CRITICAL)
    if _mute_until and datetime.now() < _mute_until and severity != SEVERITY_CRITICAL:
        audit(alert_type, detail, "skipped (muted)")
        return

    # Kirim alert dulu
    send(f"{severity}\n<b>{title}</b>\n{detail}\n\n⏳ AI sedang menganalisis...")

    # AI analisis di thread terpisah agar tidak blocking
    def analyze():
        ctx = load_server_context()
        prompt = f"""Konteks server:
{ctx}

Alert: {title}
Detail: {detail}

Analisis singkat: penyebab, tingkat bahaya, dan langkah fix."""
        analysis = ask_ai(prompt)
        send(f"🤖 <b>Analisis AI:</b>\n{analysis}")
        audit(alert_type, detail, analysis)

    threading.Thread(target=analyze, daemon=True).start()

# ─── Monitor loop ─────────────────────────────────────────────────────────────

def monitor_loop():
    time.sleep(30)
    important = ["bumdesmart_be", "bumdesmart_fe", "bumdesmart_db",
                 "bumdesmart_cloudflared", "bumdesmart_caddy"]
    while True:
        try:
            out     = sh("docker ps --format '{{.Names}}'")
            running = set(out.splitlines())

            for name in important:
                short = name.replace("bumdesmart_", "")
                if name not in running and name not in _alerted_down:
                    alert_with_ai(
                        "container_down",
                        f"Container {short} DOWN!",
                        f"Waktu: {datetime.now().strftime('%H:%M:%S')}\nContainer {name} tidak ditemukan di docker ps."
                    )
                    _alerted_down.add(name)
                elif name in running and name in _alerted_down:
                    send(f"✅ <b>RECOVERED</b>: Container <b>{short}</b> kembali UP\n{datetime.now().strftime('%H:%M:%S')}")
                    audit("container_up", f"{name} recovered")
                    _alerted_down.discard(name)

            # Disk warning
            disk_pct = sh("df / | awk 'NR==2 {print $5}' | tr -d '%'")
            if disk_pct.isdigit() and int(disk_pct) >= 85:
                alert_with_ai(
                    "disk_warning",
                    f"Disk usage {disk_pct}%!",
                    sh("df -h /")
                )

        except Exception as e:
            print(f"[monitor error] {e}")

        time.sleep(120)

def daily_report():
    while True:
        now = datetime.now()
        if now.hour == 7 and now.minute == 0:
            errors     = get_laravel_errors(5)
            containers = get_container_status()
            resources  = get_resources()

            # Hitung error kemarin dari audit log
            error_count = 0
            try:
                yesterday = (now - timedelta(days=1)).date().isoformat()
                for line in AUDIT_FILE.read_text().splitlines():
                    entry = json.loads(line)
                    if entry["timestamp"].startswith(yesterday):
                        error_count += 1
            except Exception:
                pass

            send(
                f"🌅 <b>Laporan Harian BumDesMart</b>\n"
                f"📅 {now.strftime('%A, %d %B %Y')}\n\n"
                f"<b>Containers:</b>\n{containers}\n\n"
                f"<b>Resources:</b>\n{resources}\n\n"
                f"📊 Alert kemarin: {error_count} kejadian\n\n"
                f"⚠️ <b>Error terbaru:</b>\n<pre>{errors[-500:]}</pre>"
            )
            time.sleep(60)
        time.sleep(30)

# ─── Command handlers ─────────────────────────────────────────────────────────

def cmd_status(chat_id, msg_id):
    mute_info = ""
    if _mute_until and datetime.now() < _mute_until:
        mute_info = f"\n🔕 <b>Muted sampai:</b> {_mute_until.strftime('%H:%M:%S')}"
    now        = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    containers = get_container_status()
    resources  = get_resources()
    reply(chat_id, msg_id,
        f"📊 <b>Server Status</b> — {now}{mute_info}\n\n"
        f"<b>Containers:</b>\n{containers}\n\n"
        f"<b>Resources:</b>\n{resources}"
    )

def cmd_logs(chat_id, msg_id, args):
    service  = args[0] if args else "be"
    n        = args[1] if len(args) > 1 else "30"
    name_map = {
        "be": "bumdesmart_be", "backend": "bumdesmart_be",
        "fe": "bumdesmart_fe", "frontend": "bumdesmart_fe",
        "db": "bumdesmart_db",
        "cf": "bumdesmart_cloudflared", "cloudflared": "bumdesmart_cloudflared",
        "caddy": "bumdesmart_caddy",
        "queue": "bumdesmart_queue",
    }
    container = name_map.get(service, f"bumdesmart_{service}")
    out  = sh(f"docker logs {container} --tail {n} 2>&1")
    text = out[-3500:] if len(out) > 3500 else out
    reply(chat_id, msg_id, f"📋 <b>Logs {container} (tail {n}):</b>\n<pre>{text}</pre>")

def cmd_errors(chat_id, msg_id, args):
    n   = int(args[0]) if args else 10
    out = get_laravel_errors(n)
    reply(chat_id, msg_id, f"⚠️ <b>Laravel Errors (last {n}):</b>\n<pre>{out[-3000:]}</pre>")

def cmd_analyze(chat_id, msg_id, args):
    """Analisis manual: ambil error log + status, minta AI diagnosa."""
    reply(chat_id, msg_id, "🤖 Menganalisis server... (10-20 detik)")

    errors     = get_laravel_errors(20)
    containers = get_container_status()
    resources  = get_resources()
    ctx        = load_server_context()

    use_search = "--search" in args or "-s" in args

    prompt = f"""Konteks server:
{ctx}

Status container saat ini:
{containers}

Resource:
{resources}

Error Laravel terbaru:
{errors}

Berikan analisis menyeluruh: ada masalah serius? apa yang perlu diperhatikan? ada rekomendasi tindakan?"""

    analysis = ask_ai(prompt, use_search=use_search)
    reply(chat_id, msg_id, f"🤖 <b>Analisis AI:</b>\n{analysis}")
    audit("manual_analyze", "triggered by user", analysis)

def cmd_ask(chat_id, msg_id, args):
    """Tanya bebas ke AI tentang server."""
    if not args:
        reply(chat_id, msg_id, "⚠️ Contoh: /ask kenapa cloudflared sering restart?")
        return
    question   = " ".join(args)
    use_search = question.startswith("--search ")
    if use_search:
        question = question[9:]

    reply(chat_id, msg_id, "🤖 Mencari jawaban...")
    ctx    = load_server_context()
    prompt = f"Konteks server:\n{ctx}\n\nPertanyaan: {question}"
    answer = ask_ai(prompt, use_search=use_search)
    reply(chat_id, msg_id, f"🤖 <b>Jawaban AI:</b>\n{answer}")

def cmd_restart(chat_id, msg_id, args):
    if not args:
        reply(chat_id, msg_id, "⚠️ Contoh: /restart cloudflared")
        return
    service  = args[0]
    name_map = {
        "be": "bumdesmart_be", "backend": "bumdesmart_be",
        "fe": "bumdesmart_fe", "frontend": "bumdesmart_fe",
        "cf": "bumdesmart_cloudflared", "cloudflared": "bumdesmart_cloudflared",
        "caddy": "bumdesmart_caddy",
        "queue": "bumdesmart_queue",
    }
    container = name_map.get(service, f"bumdesmart_{service}")
    reply(chat_id, msg_id, f"🔄 Merestart <b>{container}</b>...")
    out = sh(f"docker restart {container}", timeout=60)
    reply(chat_id, msg_id, f"✅ Selesai:\n<pre>{out}</pre>")
    audit("restart", f"manual restart {container}")

def cmd_disk(chat_id, msg_id):
    out = sh("df -h")
    reply(chat_id, msg_id, f"💾 <b>Disk Usage:</b>\n<pre>{out}</pre>")

def cmd_mute(chat_id, msg_id, args):
    global _mute_until
    if not args:
        reply(chat_id, msg_id, "⚠️ Contoh: /mute 2h atau /mute 30m")
        return
    raw = args[0]
    try:
        if raw.endswith("h"):
            delta = timedelta(hours=int(raw[:-1]))
        elif raw.endswith("m"):
            delta = timedelta(minutes=int(raw[:-1]))
        else:
            reply(chat_id, msg_id, "Format: 2h atau 30m")
            return
        _mute_until = datetime.now() + delta
        reply(chat_id, msg_id, f"🔕 Alert di-mute sampai <b>{_mute_until.strftime('%H:%M:%S')}</b>\n(CRITICAL tetap dikirim)")
    except ValueError:
        reply(chat_id, msg_id, "Format tidak valid. Contoh: /mute 2h")

def cmd_unmute(chat_id, msg_id):
    global _mute_until
    _mute_until = None
    reply(chat_id, msg_id, "🔔 Alert aktif kembali.")

def cmd_audit(chat_id, msg_id, args):
    """Tampilkan audit log hari ini."""
    n = int(args[0]) if args else 10
    try:
        lines   = AUDIT_FILE.read_text().splitlines()
        today   = datetime.now().date().isoformat()
        entries = [json.loads(l) for l in lines if l.strip() and today in l][-n:]
        if not entries:
            reply(chat_id, msg_id, "📋 Tidak ada log hari ini.")
            return
        out = "\n".join(
            f"[{e['timestamp'][11:16]}] {e['type']}: {e['detail'][:60]}"
            for e in entries
        )
        reply(chat_id, msg_id, f"📋 <b>Audit Log hari ini (last {n}):</b>\n<pre>{out}</pre>")
    except Exception as e:
        reply(chat_id, msg_id, f"Error baca audit log: {e}")

def cmd_help(chat_id, msg_id):
    reply(chat_id, msg_id,
        "🤖 <b>ServerBumdesNukita Bot</b>\n\n"
        "<b>Monitoring:</b>\n"
        "/status — Status container + resource\n"
        "/logs [service] [n] — Log container\n"
        "/errors [n] — Laravel error log\n"
        "/disk — Penggunaan disk\n"
        "/audit [n] — Audit log hari ini\n\n"
        "<b>AI:</b>\n"
        "/analyze — Analisis menyeluruh server\n"
        "/analyze --search — + Google Search\n"
        "/ask [pertanyaan] — Tanya AI\n"
        "/ask --search [pertanyaan] — + Google\n\n"
        "<b>Kontrol:</b>\n"
        "/restart [service] — Restart container\n"
        "/mute [2h|30m] — Mute alert sementara\n"
        "/unmute — Aktifkan alert kembali\n\n"
        "<b>Service:</b> be, fe, db, cf, caddy, queue"
    )

# ─── Update polling ───────────────────────────────────────────────────────────

def handle_update(update):
    msg = update.get("message") or update.get("edited_message")
    if not msg:
        return
    user_id = msg.get("from", {}).get("id")
    chat_id = msg.get("chat", {}).get("id")
    msg_id  = msg.get("message_id")
    text    = msg.get("text", "").strip()

    if not text.startswith("/"):
        return
    if user_id not in ALLOWED_USERS:
        return

    parts   = text.split()
    command = parts[0].split("@")[0].lower()
    args    = parts[1:]

    print(f"[cmd] {ALLOWED_USERS[user_id]}: {text}")

    dispatch = {
        "/status":  lambda: cmd_status(chat_id, msg_id),
        "/logs":    lambda: cmd_logs(chat_id, msg_id, args),
        "/errors":  lambda: cmd_errors(chat_id, msg_id, args),
        "/analyze": lambda: cmd_analyze(chat_id, msg_id, args),
        "/ask":     lambda: cmd_ask(chat_id, msg_id, args),
        "/restart": lambda: cmd_restart(chat_id, msg_id, args),
        "/disk":    lambda: cmd_disk(chat_id, msg_id),
        "/mute":    lambda: cmd_mute(chat_id, msg_id, args),
        "/unmute":  lambda: cmd_unmute(chat_id, msg_id),
        "/audit":   lambda: cmd_audit(chat_id, msg_id, args),
        "/help":    lambda: cmd_help(chat_id, msg_id),
        "/start":   lambda: cmd_help(chat_id, msg_id),
    }

    handler = dispatch.get(command)
    if handler:
        threading.Thread(target=handler, daemon=True).start()

def poll():
    offset = None
    print("[bot] Polling started...")
    send("🟢 <b>ServerBumdesNukita Bot aktif!</b>\nArsitektur baru: Severity → Rate Limiter → AI Analysis\nKetik /help untuk melihat semua perintah.")
    while True:
        try:
            params = {"timeout": 30, "allowed_updates": ["message"]}
            if offset:
                params["offset"] = offset
            resp = requests.get(f"{API}/getUpdates", params=params, timeout=35)
            data = resp.json()
            if data.get("ok"):
                for update in data["result"]:
                    offset = update["update_id"] + 1
                    handle_update(update)
        except Exception as e:
            print(f"[poll error] {e}")
            time.sleep(5)

# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    threading.Thread(target=monitor_loop, daemon=True).start()
    threading.Thread(target=daily_report, daemon=True).start()
    poll()
