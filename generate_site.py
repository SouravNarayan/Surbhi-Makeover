#!/usr/bin/env python3
"""
generate_site.py
-----------------
Builds the static salon website from templates/index.html.j2 + config.json
into docs/ (the folder GitHub Pages will serve from).

Usage:
    pip install jinja2
    python generate_site.py

Re-run this any time you edit config.json (prices, address, phone, etc.)
to regenerate docs/index.html.
"""

import json
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent.resolve()
TEMPLATES_DIR = ROOT / "templates"
STATIC_DIR = ROOT / "static"
CONFIG_PATH = ROOT / "config.json"
OUTPUT_DIR = ROOT / "docs"  # GitHub Pages source: /docs on main branch


def load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def build_site() -> None:
    config = load_config()

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html", "j2"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template("index.html.j2")
    html = template.render(**config)

    # Fresh output directory
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    (OUTPUT_DIR / "index.html").write_text(html, encoding="utf-8")

    # Copy static assets (css/js/images) alongside the generated HTML
    shutil.copytree(STATIC_DIR, OUTPUT_DIR / "static")

    # .nojekyll tells GitHub Pages not to run Jekyll processing on the folder
    (OUTPUT_DIR / ".nojekyll").write_text("", encoding="utf-8")

    print(f"Site generated at: {OUTPUT_DIR}")
    print("Next steps:")
    print("  1. Add real photos to static/images/ (gallery-1.jpg, gallery-2.jpg, gallery-3.jpg)")
    print("     and re-run this script, OR drop them straight into docs/static/images/.")
    print("  2. Commit and push the repo, then enable GitHub Pages")
    print('     (Settings > Pages > Source: "Deploy from a branch" > /docs folder).')
    print("  3. See SETUP_GUIDE.md for the Google Apps Script + Instagram embed steps.")


if __name__ == "__main__":
    build_site()
