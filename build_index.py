#!/usr/bin/env python3
"""
build_index.py — Generate docs.json for a static site (HTML-only).

Usage (from your site root):
  python3 build_index.py
  python3 build_index.py --root . --out docs.json --max-excerpt 350 --no-recursive \
                         --exclude results.html --exclude index.html
"""

import os
import re
import json
import argparse
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError as e:
    raise SystemExit("This script requires beautifulsoup4. Install with: pip install beautifulsoup4 lxml") from e


# ------------------------ tunables ------------------------

# Repeated site chrome to strip from excerpts
NOISE_PATTERNS = [
    r"\bEpicentre\b", r"\bArticulations\b", r"\bFragments\b", r"\bThe Study\b",
    r"Noble\s*Homer'?s\s*Blog",
    r"©\s*20\d{2}\s*Minidu\s*Chandrawansa",
    r"Loading\.\.\.",
]
NOISE_RE = re.compile("|".join(NOISE_PATTERNS), re.IGNORECASE)

# Likely main-content containers (first hit wins)
MAIN_SELECTORS = [
    ".blog-content", ".entry-content", "article", "main", ".post", "#content"
]

# Elements that are never part of article content
STRIP_SELECTORS = ["script", "style", "nav", "header", "footer", "aside", "noscript"]


# ------------------------ helpers ------------------------

def clean_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()

def strip_noise(s: str) -> str:
    return NOISE_RE.sub(" ", s)

def rel_url(path: Path, root: Path) -> str:
    # Site-relative like "./foo/bar.html" (works for your flat folder too)
    return "./" + str(path.relative_to(root)).replace(os.sep, "/")

def load_html(path: Path) -> BeautifulSoup:
    html = path.read_text(encoding="utf-8", errors="ignore")
    # lxml if installed; fall back to html.parser
    parser = "lxml" if _has_lxml() else "html.parser"
    return BeautifulSoup(html, parser)

def _has_lxml() -> bool:
    try:
        import lxml  # noqa
        return True
    except Exception:
        return False

def find_title(soup: BeautifulSoup, fallback: str) -> str:
    if soup.title and soup.title.string and soup.title.string.strip():
        return soup.title.string.strip()
    h1 = soup.find("h1")
    if h1:
        t = h1.get_text(" ", strip=True)
        if t:
            return t
    return fallback

def find_meta(soup: BeautifulSoup):
    date, tags = "", []
    m_date = soup.find("meta", attrs={"name": "date"})
    if m_date and m_date.get("content"):
        date = m_date["content"].strip()
    m_kw = soup.find("meta", attrs={"name": "keywords"})
    if m_kw and m_kw.get("content"):
        tags = [t.strip() for t in m_kw["content"].split(",") if t.strip()]
    return date, tags

def pick_content_root(soup: BeautifulSoup):
    for sel in MAIN_SELECTORS:
        node = soup.select_one(sel)
        if node:
            return node
    return soup.body or soup

def strip_layout_nodes(root):
    for sel in STRIP_SELECTORS:
        for node in root.select(sel):
            node.decompose()

def full_text_from(root) -> str:
    return clean_ws(root.get_text(" ", strip=True))

def excerpt_from(root, max_chars: int = 350) -> str:
    # Prioritize real paragraphs
    paras = [clean_ws(p.get_text(" ", strip=True)) for p in root.find_all("p")]
    paras = [p for p in paras if p and len(p) >= 40 and not NOISE_RE.search(p)]

    if paras:
        chosen = paras[0]
        if len(chosen) < 120 and len(paras) > 1:
            chosen = max(paras[:5], key=len)  # pick a substantial early paragraph
    else:
        chosen = full_text_from(root)

    chosen = strip_noise(chosen)
    if len(chosen) <= max_chars:
        return chosen

    # Trim at a sentence boundary near max_chars
    cut = chosen.rfind(".", 0, max_chars)
    if cut == -1:
        cut = chosen.rfind(" ", 0, max_chars)
    if cut == -1:
        cut = max_chars
    return chosen[:cut].rstrip(" .,;:") + "…"


# ------------------------ core builder ------------------------

def build_for_file(path: Path, site_root: Path, max_excerpt: int):
    soup = load_html(path)
    title = find_title(soup, path.name)
    date, tags = find_meta(soup)

    root = pick_content_root(soup)
    strip_layout_nodes(root)

    content_text = full_text_from(root)
    excerpt = excerpt_from(root, max_chars=max_excerpt)

    return {
        "id": path.name,
        "title": title,
        "url": rel_url(path, site_root),
        "tags": tags,
        "date": date,
        "excerpt": excerpt,
        "content": content_text
    }


def iter_html_files(root: Path, recursive: bool, excludes: list[str]):
    excl = [e.lower() for e in excludes]
    if recursive:
        for p in root.rglob("*"):
            if p.suffix.lower() in (".html", ".htm") and p.name.lower() not in excl:
                yield p
    else:
        for p in root.iterdir():
            if p.is_file() and p.suffix.lower() in (".html", ".htm") and p.name.lower() not in excl:
                yield p


# ------------------------ CLI ------------------------

def parse_args():
    ap = argparse.ArgumentParser(description="Build a JSON search index (docs.json) from HTML files.")
    ap.add_argument("--root", default=".", help="Root folder to scan (default: current directory)")
    ap.add_argument("--out", default="docs.json", help="Output JSON path (default: docs.json in root)")
    ap.add_argument("--max-excerpt", type=int, default=350, help="Max characters in excerpt (default: 350)")
    ap.add_argument("--no-recursive", action="store_true", help="Do not scan subfolders")
    ap.add_argument("--exclude", action="append", default=[], help="Exclude specific filenames (e.g., --exclude results.html)")
    return ap.parse_args()


def main():
    args = parse_args()
    site_root = Path(args.root).resolve()
    out_path = (site_root / args.out).resolve()

    recursive = not args.no_recursive
    files = list(iter_html_files(site_root, recursive=recursive, excludes=args.exclude))

    docs = []
    for p in sorted(files, key=lambda x: str(x).lower()):
        try:
            doc = build_for_file(p, site_root, max_excerpt=args.max_excerpt)
            docs.append(doc)
        except Exception as e:
            print(f"[warn] Skipped {p}: {e}")

    out_path.write_text(json.dumps(docs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(docs)} documents → {out_path}")


if __name__ == "__main__":
    main()