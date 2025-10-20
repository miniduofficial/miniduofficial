# build_index.py
import os, json, re
from bs4 import BeautifulSoup

# Directory with your HTML files (current dir)
ROOT = os.path.abspath(os.getcwd())

def extract_text(html):
    # remove script/style, then get visible text
    for tag in html(["script", "style", "noscript"]):
        tag.decompose()
    text = html.get_text(separator=" ", strip=True)
    # collapse excessive whitespace
    return re.sub(r"\s+", " ", text)

def guess_excerpt(text, n=400):
    return text[:n]

def find_title(soup, fallback_name):
    t = soup.title.string.strip() if soup.title and soup.title.string else ""
    if not t:
        h1 = soup.find("h1")
        t = h1.get_text(strip=True) if h1 else ""
    return t or fallback_name

def find_meta_tags(soup):
    # optional: <meta name="date" content="2025-08-01">, <meta name="keywords" content="tag1, tag2">
    date = ""
    m_date = soup.find("meta", attrs={"name": "date"})
    if m_date and m_date.get("content"):
        date = m_date["content"].strip()

    tags = []
    m_kw = soup.find("meta", attrs={"name": "keywords"})
    if m_kw and m_kw.get("content"):
        tags = [t.strip() for t in m_kw["content"].split(",") if t.strip()]
    return date, tags

docs = []
for fname in sorted(os.listdir(ROOT)):
    if not fname.lower().endswith((".html", ".htm")):
        continue
    path = os.path.join(ROOT, fname)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        raw = f.read()
    soup = BeautifulSoup(raw, "lxml")
    title = find_title(soup, fname)
    content = extract_text(soup)
    excerpt = guess_excerpt(content)
    date, tags = find_meta_tags(soup)

    # For a flat folder, the site URL is just the filename (adjust if you deploy under a subpath)
    url = f"./{fname}"

    docs.append({
        "id": fname,            # stable id (filename)
        "title": title,
        "url": url,
        "tags": tags,
        "date": date,
        "excerpt": excerpt,
        "content": content
    })

with open(os.path.join(ROOT, "docs.json"), "w", encoding="utf-8") as out:
    json.dump(docs, out, ensure_ascii=False, indent=2)

print(f"Wrote docs.json with {len(docs)} documents.")