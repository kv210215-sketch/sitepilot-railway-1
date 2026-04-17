# =========================
# 🤖 AI PROJECT AUDITOR
# =========================

import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# =========================
# 🔑 INIT
# =========================
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PROJECT_DIR = "."   # змінити шлях за потреби
MAX_CONTENT_LENGTH = 8000  # токени на файл

SKIP_DIRS = {"venv", "__pycache__", ".git", "node_modules", ".next", "dist", "build", ".cache"}
SUPPORTED_EXTENSIONS = (".py", ".js", ".ts", ".tsx", ".jsx", ".json")

# =========================
# 📂 READ FILES
# =========================
def read_project():
    project_data = []

    for root, dirs, files in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if file.endswith(SUPPORTED_EXTENSIONS):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    project_data.append({
                        "path": path,
                        "content": content[:MAX_CONTENT_LENGTH]
                    })
                except Exception:
                    pass

    return project_data

# =========================
# 🧠 BUILD PROMPT
# =========================
def build_prompt(files):
    summary = ""
    for f in files:
        summary += f"\n\nFILE: {f['path']}\n{f['content']}"

    return f"""
Ти senior AI engineer.

Проаналізуй проєкт.

{summary}

Задачі:

1. Визнач архітектуру:
- чи є агенти (research, content, quality, publish)
- чи є pipeline

2. Перевір автономність:
- чи можна запустити без ручних дій
- чи є scheduler / loop

3. Знайди проблеми:
- баги
- слабкі місця
- що зламається

4. Оціни:
- код
- SEO pipeline
- масштабованість

5. Дай конкретні покращення

Формат:
- 📂 Архітектура
- ✅ Що добре
- ⚠️ Проблеми
- 🚀 Що покращити
"""

# =========================
# 🤖 RUN AI ANALYSIS
# =========================
def analyze_project(files):
    prompt = build_prompt(files)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return response.choices[0].message.content

# =========================
# 💾 SAVE REPORT
# =========================
def save_report(report):
    with open("audit_report.md", "w", encoding="utf-8") as f:
        f.write(report)

# =========================
# 🚀 MAIN
# =========================
def run():
    print("📂 Scanning project...")
    files = read_project()
    print(f"🔍 Found {len(files)} files")

    if not files:
        print("❌ No supported files found. Check PROJECT_DIR or SUPPORTED_EXTENSIONS.")
        return

    print("🤖 Running AI audit...")
    report = analyze_project(files)

    save_report(report)
    print("✅ Audit saved → audit_report.md")


if __name__ == "__main__":
    run()
