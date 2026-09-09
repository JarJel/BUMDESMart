#!/usr/bin/env python3
"""
BumDesMart Server Monitoring Bot
Kirim alert otomatis + terima perintah dari grup Telegram
"""

import os
import subprocess
import threading
import time
import requests
import json
from datetime import datetime

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8652817496:AAHBiseLAwpK2tRbXmJSD2SI1kMFOxq7CTc")
CHAT_ID   = int(os.environ.get("TELEGRAM_CHAT_ID", "-5551301296"))

# Hanya user ini yang boleh kirim perintah
ALLOWED_USERS = {
    6483972454: "Dzaki",
    8129182235: "Fajar",
    # Tambahkan Oki setelah dapat ID-nya
}

API = f"https://api.telegram.org/bot{BOT_TOKEN}"

# ─── Telegram helpers ─────────────────────────────────────────────────────────

def send(text: str, parse_mode="HTML"):
    try:
        requests.post(f"{API}/sendMessage", json={
            "chat_id": CHAT_ID,
            "text": text,
            "parse_mode": parse_mode,
        }, timeout=10)
    except Exception as e:
        print(f"[send error] {e}")

def reply(chat_id: int, message_id: int, text: str):
    try:
        requests.post(f"{API}/sendMessage", json={
            "chat_id": chat_id,
            "reply_to_message_id": message_id,
            "text": text,
            "parse_mode": "HTML",
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
    lines = []
    important = ["bumdesmart_be", "bumdesmart_fe", "bumdesmart_db",
                 "bumdesmart_redis", "bumdesmart_caddy", "bumdesmart_cloudflared", "bumdesmart_queue"]
    status_map = {}
    for line in out.splitlines():
        parts = line.split("\t", 1)
        if len(parts) == 2:
            status_map[parts[0].strip()] = parts[1].strip()

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
    # RAM
    ram = sh("free -m | awk '/Mem:/ {printf \"%.0f%%\", $3/$2*100}'")
    ram_detail = sh("free -m | awk '/Mem:/ {printf \"%dMB / %dMB\", $3, $2}'")
    # CPU
    cpu = sh("top -bn1 | grep 'Cpu(s)' | awk '{print 100-$8\"%\"}'")
    # Disk
    disk = sh("df -h / | awk 'NR==2 {print $5\" (\"$3\"/\"$2\")\"}'")
    return (
        f"🧠 <b>RAM</b>: {ram} ({ram_detail})\n"
        f"⚡ <b>CPU</b>: {cpu}\n"
        f"💾 <b>Disk</b>: {disk}"
    )

def get_laravel_errors(n=10) -> str:
    out = sh(f"docker exec bumdesmart_be grep -a 'production.ERROR' storage/logs/laravel.log 2>/dev/null | tail -{n}")
    if not out or "No such" in out:
        return "✅ Tidak ada error terbaru"
    lines = out.splitlines()
    # Ambil baris pertama tiap error (bukan stacktrace)
    errors = [l for l in lines if "production.ERROR" in l][-n:]
    return "\n".join(errors[-5:]) if errors else "✅ Tidak ada error terbaru"

# ─── Command handlers ─────────────────────────────────────────────────────────

def cmd_status(chat_id, msg_id):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    containers = get_container_status()
    resources  = get_resources()
    reply(chat_id, msg_id,
        f"📊 <b>Server Status</b> — {now}\n\n"
        f"<b>Containers:</b>\n{containers}\n\n"
        f"<b>Resources:</b>\n{resources}"
    )

def cmd_logs(chat_id, msg_id, args):
    service = args[0] if args else "be"
    n       = args[1] if len(args) > 1 else "30"
    name_map = {
        "be": "bumdesmart_be", "backend": "bumdesmart_be",
        "fe": "bumdesmart_fe", "frontend": "bumdesmart_fe",
        "db": "bumdesmart_db",
        "cf": "bumdesmart_cloudflared", "cloudflared": "bumdesmart_cloudflared",
        "caddy": "bumdesmart_caddy",
        "queue": "bumdesmart_queue",
    }
    container = name_map.get(service, f"bumdesmart_{service}")
    out = sh(f"docker logs {container} --tail {n} 2>&1")
    text = out[-3500:] if len(out) > 3500 else out
    reply(chat_id, msg_id, f"📋 <b>Logs {container} (tail {n}):</b>\n<pre>{text}</pre>")

def cmd_errors(chat_id, msg_id, args):
    n = int(args[0]) if args else 10
    out = get_laravel_errors(n)
    reply(chat_id, msg_id, f"⚠️ <b>Laravel Errors (last {n}):</b>\n<pre>{out[-3000:]}</pre>")

def cmd_restart(chat_id, msg_id, args):
    if not args:
        reply(chat_id, msg_id, "⚠️ Contoh: /restart cloudflared")
        return
    service = args[0]
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

def cmd_disk(chat_id, msg_id):
    out = sh("df -h")
    reply(chat_id, msg_id, f"💾 <b>Disk Usage:</b>\n<pre>{out}</pre>")

def cmd_help(chat_id, msg_id):
    reply(chat_id, msg_id,
        "🤖 <b>ServerBumdesNukita Bot</b>\n\n"
        "<b>Perintah yang tersedia:</b>\n"
        "/status — Status semua container + resource\n"
        "/logs [service] [n] — Log container (default: be, 30 baris)\n"
        "  Service: be, fe, db, cf, caddy, queue\n"
        "/errors [n] — Laravel error log terbaru\n"
        "/restart [service] — Restart container\n"
        "/disk — Penggunaan disk\n"
        "/help — Bantuan\n\n"
        "<b>Contoh:</b>\n"
        "/logs be 50\n"
        "/restart cloudflared\n"
        "/errors 20"
    )

# ─── Alert monitoring (background thread) ────────────────────────────────────

_alerted_down = set()

def monitor_loop():
    """Cek container tiap 2 menit, alert kalau ada yang down."""
    time.sleep(30)  # tunggu bot siap dulu
    important = ["bumdesmart_be", "bumdesmart_fe", "bumdesmart_db",
                 "bumdesmart_cloudflared", "bumdesmart_caddy"]
    while True:
        try:
            out = sh("docker ps --format '{{.Names}}'")
            running = set(out.splitlines())
            for name in important:
                short = name.replace("bumdesmart_", "")
                if name not in running and name not in _alerted_down:
                    send(f"🚨 <b>ALERT</b>: Container <b>{short}</b> DOWN!\nWaktu: {datetime.now().strftime('%H:%M:%S')}")
                    _alerted_down.add(name)
                elif name in running and name in _alerted_down:
                    send(f"✅ <b>RECOVERED</b>: Container <b>{short}</b> kembali UP\nWaktu: {datetime.now().strftime('%H:%M:%S')}")
                    _alerted_down.discard(name)

            # Alert disk > 85%
            disk_pct = sh("df / | awk 'NR==2 {print $5}' | tr -d '%'")
            if disk_pct.isdigit() and int(disk_pct) >= 85:
                send(f"⚠️ <b>DISK WARNING</b>: Penggunaan disk {disk_pct}%!\nSegera bersihkan storage.")

        except Exception as e:
            print(f"[monitor error] {e}")

        time.sleep(120)  # cek tiap 2 menit

def daily_report():
    """Kirim laporan harian tiap jam 07:00."""
    while True:
        now = datetime.now()
        if now.hour == 7 and now.minute == 0:
            containers = get_container_status()
            resources  = get_resources()
            send(
                f"🌅 <b>Laporan Harian BumDesMart</b>\n"
                f"📅 {now.strftime('%A, %d %B %Y')}\n\n"
                f"<b>Containers:</b>\n{containers}\n\n"
                f"<b>Resources:</b>\n{resources}"
            )
            time.sleep(60)  # hindari double send
        time.sleep(30)

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
        return  # abaikan user tidak dikenal

    parts   = text.split()
    command = parts[0].split("@")[0].lower()
    args    = parts[1:]

    print(f"[cmd] {ALLOWED_USERS[user_id]}: {text}")

    if command == "/status":
        cmd_status(chat_id, msg_id)
    elif command == "/logs":
        cmd_logs(chat_id, msg_id, args)
    elif command == "/errors":
        cmd_errors(chat_id, msg_id, args)
    elif command == "/restart":
        cmd_restart(chat_id, msg_id, args)
    elif command == "/disk":
        cmd_disk(chat_id, msg_id)
    elif command in ("/help", "/start"):
        cmd_help(chat_id, msg_id)

def poll():
    offset = None
    print("[bot] Polling started...")
    send("🟢 <b>ServerBumdesNukita Bot aktif!</b>\nKetik /help untuk melihat perintah yang tersedia.")
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
    threading.Thread(target=monitor_loop, daemon=True).start()
    threading.Thread(target=daily_report, daemon=True).start()
    poll()
