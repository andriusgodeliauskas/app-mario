#!/usr/bin/env python3
"""
Stamp a cache-busting version onto every local asset in index.html.

Why this exists: the game ships plain .js/.css with no build step and no content
hashing, so a browser that already cached them will keep using the old copy.
Fixing the Cache-Control headers only helps future loads — anyone holding a
previously-cached file never revalidates. Changing the URL is what forces them
to fetch again.

Run it before uploading (deploy.sh calls it automatically):

    python3 bump-cache-version.py            # stamp with the current timestamp
    python3 bump-cache-version.py --check    # print the current version, change nothing
"""

import re
import sys
import time
from pathlib import Path

INDEX = Path(__file__).with_name('index.html')

# Only local assets. CDN URLs (Phaser, Google Fonts) are left alone — they are
# already versioned and immutable.
ASSET = re.compile(r'((?:src|href)=")((?:js|css)/[^"?]+)(?:\?v=\d+)?(")')


def current_version(html):
    found = re.search(r'(?:js|css)/[^"?]+\?v=(\d+)', html)
    return found.group(1) if found else None


def main():
    if not INDEX.exists():
        sys.exit('index.html not found next to this script')

    html = INDEX.read_text(encoding='utf-8')

    if '--check' in sys.argv:
        print(current_version(html) or '(no version stamped)')
        return

    version = str(int(time.time()))
    stamped, count = ASSET.subn(lambda m: f'{m.group(1)}{m.group(2)}?v={version}{m.group(3)}', html)

    if count == 0:
        sys.exit('no local js/css assets found in index.html — refusing to write')

    INDEX.write_text(stamped, encoding='utf-8')
    print(f'stamped {count} assets with ?v={version}')


if __name__ == '__main__':
    main()
