#!/usr/bin/env python3
"""Build the GitHub Pages site: wrap each Artifact fragment in src/ into a full HTML document at the repo root.

The fragments in src/ are written for claude.ai Artifacts (no doctype/head/body; the platform adds them).
This script adds the same skeleton the Artifact publisher uses, and points the lobby's rings at the local pages.
Usage: python3 tools/build-pages.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""
TAIL = "\n</body>\n</html>\n"
LOCAL = {
    "RMhHepFrqTyxX8x2ktP6qd": "astrolabe.html",
    "DPvaA5sCBNhzb1ywzbm69p": "overprint.html",
    "4HbocH97u5Rp7Qvfyg8X2q": "frosted-pane.html",
    "UebYCbZqvZYCe6S1csGT4J": "glasshouse.html",
    "28hvjSG6sJjvfPZ1gYXZwT": "gingerbread-set.html",
}

for f in sorted(SRC.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    if f.name == "index.html":
        for aid, page in LOCAL.items():
            s = s.replace(f"https://claude.ai/artifact/{aid}", page)
        # same-tab navigation on the website
        s = s.replace("    a.target = '_blank';\n    a.rel = 'noopener';\n", "")
        s = s.replace(" Opens in a new tab.`", "`")
        s = s.replace("<p>Every page opens in a new tab.</p>", "<p>Use your browser's Back button to return here.</p>")
    (ROOT / f.name).write_text(HEAD + s + TAIL, encoding="utf-8")
    print("built", f.name)
