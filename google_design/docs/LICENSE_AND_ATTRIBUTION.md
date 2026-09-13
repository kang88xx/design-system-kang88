# License and Attribution

## Classification

| Source | Classification | Distribution rule |
| --- | --- | --- |
| Material Web | Apache-2.0 | preserve LICENSE/NOTICE and mark changes |
| Material Color Utilities | Apache-2.0 | preserve LICENSE/NOTICE and mark changes |
| Material Symbols | Apache-2.0 | preserve license; do not confuse symbols with Google product logos |
| Noto Emoji font | OFL-1.1 | preserve copyright/license; do not sell font alone |
| Noto Emoji SVG/resources | Apache-2.0 per source | verify file-level license, especially flags |
| Roboto | OFL-1.1 | preserve copyright/license |
| Google Sans / Google Sans Flex | official Google Fonts bundle | preserve the exact bundled license |
| Material documentation imagery | reference-only | do not bundle without asset-specific permission |
| Google product UI/screenshots | reference-only | local design evidence only |
| Google product logos/icons | brand-restricted | do not redistribute as an open icon set |

## Google brand boundary

Google's Brand Resource Center restricts imitation and unapproved use of its visual identity and product icons. This catalog does not grant permission to present a derived product as an official Google product.

The viewer uses Material Symbols and Noto Emoji as their own open-source libraries. It does not include downloaded Gmail, Calendar, Drive, Meet, or Finance product logos as reusable assets.

## Before redistribution

1. Include the official license files for every vendored upstream.
2. Verify the license shipped with any Google Fonts download.
3. Remove `references-private/` and browser state files.
4. Re-run `npm run validate`.
5. Confirm that no Google product logo, screenshot, user content, or restricted illustration entered `assets/` or `viewer/`.
