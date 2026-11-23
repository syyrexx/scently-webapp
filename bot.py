"""Scently bot: opens the shop Mini App and forwards orders to the admin chat."""
import json
import logging
import os

from telegram import KeyboardButton, ReplyKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

BOT_TOKEN = os.environ["BOT_TOKEN"]
ADMIN_CHAT_ID = int(os.environ.get("ADMIN_CHAT_ID", "0"))
WEBAPP_URL = os.environ.get(
    "WEBAPP_URL", "https://syyrexx.github.io/scently-webapp/shop.html"
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    kb = ReplyKeyboardMarkup(
        [[KeyboardButton("🛍 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]],
        resize_keyboard=True,
    )
    await update.message.reply_text(
        "Добро пожаловать в Scently! Нажмите кнопку ниже, чтобы открыть магазин.",
        reply_markup=kb,
    )


async def my_id(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(f"Ваш chat ID: {update.effective_chat.id}")


def format_data(data: dict) -> str:
    lines = []
    for key, val in data.items():
        if isinstance(val, list):
            lines.append(f"{key}:")
            for item in val:
                if isinstance(item, dict):
                    lines.append("  • " + ", ".join(f"{k}: {v}" for k, v in item.items()))
                else:
                    lines.append(f"  • {item}")
        elif isinstance(val, dict):
            lines.append(f"{key}:")
            for k, v in val.items():
                lines.append(f"  {k}: {v}")
        else:
            lines.append(f"{key}: {val}")
    return "\n".join(lines)


async def web_app_data(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    raw = update.effective_message.web_app_data.data
    try:
        data = json.loads(raw)
        body = format_data(data) if isinstance(data, dict) else str(data)
        kind = data.get("type", "order") if isinstance(data, dict) else "order"
    except json.JSONDecodeError:
        body, kind = raw, "order"

    user = update.effective_user
    who = f"@{user.username}" if user.username else user.full_name
    title = "🛒 НОВЫЙ ЗАКАЗ" if kind == "order" else f"📩 Новая заявка ({kind})"
    text = f"{title}\nОт: {who} (id {user.id})\n\n{body}"

    if ADMIN_CHAT_ID:
        await ctx.bot.send_message(ADMIN_CHAT_ID, text[:4000])
    else:
        logging.warning("ADMIN_CHAT_ID not set. Order:\n%s", text)

    await update.effective_message.reply_text(
        "Спасибо! Заказ получен. Мы скоро свяжемся с вами и пришлём ссылку Kaspi для оплаты."
    )


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("id", my_id))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    logging.info("Bot running. Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    main()
