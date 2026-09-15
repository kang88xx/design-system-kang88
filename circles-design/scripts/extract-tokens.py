#!/usr/bin/env python3
"""Build tokens.json / tokens.css for the three circles system from captured live evidence.

Inputs: references/live-source.html, references/live-desktop.json, live-tablet.json, live-mobile.json.
Original Framer token ids and hex values are preserved; readable names are normalized extraction (marked as such)."""
import json, re, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parents[1]
REF = ROOT / 'references'
src = (REF / 'live-source.html').read_text(encoding='utf-8')
desk = json.loads((REF / 'live-desktop.json').read_text())
tab = json.loads((REF / 'live-tablet.json').read_text())
mob = json.loads((REF / 'live-mobile.json').read_text())

# Framer color tokens (id -> value) exactly as declared in the published CSS
framer = {}
for tid, val in re.findall(r'(--token-[a-f0-9-]+):\s*([^;}"]+)', src):
    framer.setdefault(tid, val.strip())

NAMES = {  # normalized names + observed role (interpretation)
    '--token-0450188b-3ecc-4a39-9edd-7102407eda8f': ('ink', 'Headings, body text, dark surfaces (sidebar CTA, footer, dark cards)'),
    '--token-be18f120-c2cd-41d8-8ade-84c674958b3c': ('ink-70', 'Mobile navigation scrim'),
    '--token-1c55fc30-4320-4f32-8f75-56c602e30f91': ('taupe', 'Secondary text, letter body, placeholder, input focus border'),
    '--token-d10d7d5c-1c4f-4f9d-802c-1a10cef2fa55': ('stone', 'Dashed borders, footer muted text, footer placeholder'),
    '--token-24930864-085b-4c5c-af6f-277c40aa379f': ('cream', 'Page background, contact nav card, sidebar bottom card, dark-surface text'),
    '--token-c4544943-9092-4c7e-9493-6af223e856e1': ('vanilla', 'Muted surfaces: chips, testimonial cards, ticker, stat cards, dark button text'),
    '--token-2f572e33-78c1-4b19-bc82-6ad0c1be7f4f': ('butter', 'Accent surface: nav cards, primary yellow buttons, featured label'),
    '--token-5a2343b2-0b00-4609-afac-848df22f1a83': ('sand', 'Blockquote background'),
    '--token-a7f33d28-d966-4dbd-b5d5-6af910b70d60': ('peach', 'Contact envelope illustration background'),
    '--token-a9e7605e-42b7-40f1-8350-a918b77c9dd3': ('flame', 'Brand orange: sidebar, highlighted words, eyebrow text, stars, tag pill'),
    '--token-ec2e7588-845a-476b-8a6d-d0a6fee7bd17': ('sky', 'Declared token; not observed on rendered desktop surfaces'),
    '--token-e2b67d50-477c-49ba-bb4f-88e5e41f6eca': ('lime', 'Declared token; not observed on rendered desktop surfaces'),
    '--token-6c9b9e36-e9be-4eeb-af62-8e866aa96281': ('white', 'Cards (about, contact form, stat card), nav number badge'),
    '--token-8170220a-bffe-454a-a96d-383dd13e1f61': ('white-10', 'Footer email input background'),
    '--token-5aa2b161-4cfe-483c-983e-a23364520822': ('black', 'Declared token; Framer badge only'),
    '--token-d3ba510f-2e62-4f56-bb1c-c6b2aea5870c': ('transparent', 'Transparent fill token'),
}
def expand(h):
    h = h.strip()
    if re.fullmatch(r'#[0-9a-fA-F]{3}', h): return '#' + ''.join(c * 2 for c in h[1:]).upper()
    if re.fullmatch(r'#[0-9a-fA-F]{4}', h):
        r, g, b, a = h[1:]; return f'#{r}{r}{g}{g}{b}{b}{a}{a}'.upper()
    return h.upper() if h.startswith('#') else h
colors = {}
for tid, (name, role) in NAMES.items():
    if tid in framer:
        colors[name] = {'value': expand(framer[tid]), 'sourceVariable': tid, 'evidence': 'live-css', 'role': role}
# computed-only colors that are not tokens
colors['status-green'] = {'value': '#67B935', 'evidence': 'live-computed', 'role': 'Availability dot (rgb(103,185,53)); not a Framer token'}
colors['input-icon'] = {'value': '#999999', 'evidence': 'live-css', 'role': '--framer-input-icon-color'}

def heading(data, text):
    for s in data['samples']:
        if s['text'].startswith(text): return s
    return None
def t(data, text, fallback=None):
    s = heading(data, text)
    return {'size': s['size'], 'lineHeight': s['lineHeight'], 'weight': s['weight']} if s else fallback
typography = {
    'fonts': {
        'display': {'family': 'Bricolage Grotesque', 'weightsLoaded': [400, 500, 600, 700], 'weightsDeclared': [400, 500, 600, 700, 800], 'source': 'Google Fonts (fonts.gstatic.com)', 'evidence': 'live-fontfaces'},
        'body': {'family': 'Be Vietnam Pro', 'weightsLoaded': [400, 500, 600], 'weightsDeclared': [400, 500, 600, 700, 900, 'italic 400/600/700/900'], 'source': 'Fontshare via framerusercontent third-party-assets', 'evidence': 'live-fontfaces'},
        'mono': {'family': 'Anonymous Pro', 'weightsDeclared': [400], 'source': 'Google Fonts', 'evidence': 'live-css', 'note': 'Declared as code font; footer email input placeholder uses it. Not used for body text.'},
        'declaredUnused': ['Inter (Framer runtime default; no rendered text)', 'Geist 700 (Framer badge only)'],
    },
    'textTransform': {'value': 'lowercase', 'evidence': 'live-css', 'note': '--framer-text-transform: lowercase on nearly all text styles. Stat numbers and nav numbers use none.'},
    'letterSpacing': {'value': '0em', 'evidence': 'live-css'},
    'roles': {
        'hero': {'family': 'Bricolage Grotesque', 'weight': 700, 'desktop': t(desk, 'b'), 'tablet': t(tab, 'b'), 'mobile': t(mob, 'b'), 'lineHeightRatio': '0.8em', 'evidence': 'live-computed'},
        'sectionTitle': {'family': 'Bricolage Grotesque', 'weight': 700, 'desktop': t(desk, 'Other'), 'tablet': t(tab, 'Other'), 'mobile': t(mob, 'Other'), 'lineHeightRatio': '1.1em', 'evidence': 'live-computed'},
        'statement': {'family': 'Bricolage Grotesque', 'weight': 700, 'desktop': t(desk, 'We don'), 'tablet': t(tab, 'We don'), 'mobile': t(mob, 'We don'), 'lineHeightRatio': '1.1em', 'evidence': 'live-computed'},
        'cardTitle': {'family': 'Bricolage Grotesque', 'weight': 500, 'desktop': t(desk, 'Ready to grow'), 'tablet': t(tab, 'Our Journey'), 'mobile': t(mob, 'Our Journey'), 'lineHeightRatio': '1.1em', 'evidence': 'live-computed'},
        'itemTitle': {'family': 'Bricolage Grotesque', 'weight': 500, 'desktop': t(desk, 'Michael rey'), 'tablet': t(tab, 'Michael rey'), 'mobile': t(mob, 'Michael rey'), 'lineHeightRatio': '1.2em', 'evidence': 'live-computed'},
        'eyebrow': {'family': 'Bricolage Grotesque', 'weight': 400, 'color': '{flame}', 'desktop': t(desk, 'A Note from'), 'tablet': t(tab, 'A Note from'), 'mobile': t(mob, 'A Note from'), 'evidence': 'live-computed'},
        'listTitle': {'family': 'Bricolage Grotesque', 'weight': 600, 'desktop': t(desk, 'The Bold Coach'), 'tablet': t(tab, 'Brand impact'), 'mobile': t(mob, 'Brand impact'), 'evidence': 'live-computed'},
        'statNumber': {'family': 'Bricolage Grotesque', 'weight': 500, 'desktop': t(desk, '100+'), 'evidence': 'live-computed', 'textTransform': 'none'},
        'statNumberLarge': {'family': 'Bricolage Grotesque', 'weight': 700, 'desktop': t(desk, '5+'), 'evidence': 'live-computed', 'textTransform': 'none'},
        'navLabel': {'family': 'Be Vietnam Pro', 'weight': 600, 'desktop': t(desk, 'Projects'), 'evidence': 'live-computed'},
        'body': {'family': 'Be Vietnam Pro', 'weight': 400, 'desktop': {'size': '16px', 'lineHeight': '19.2px', 'weight': '400'}, 'lineHeightRatio': '1.2em', 'evidence': 'live-computed'},
        'bodyMedium': {'family': 'Be Vietnam Pro', 'weight': 500, 'desktop': t(desk, 'Dear friends'), 'evidence': 'live-computed'},
        'small': {'family': 'Be Vietnam Pro', 'weight': 400, 'desktop': {'size': '14px', 'lineHeight': '16.8px', 'weight': '400'}, 'mobile': {'size': '13px', 'lineHeight': '15.6px', 'weight': '400'}, 'evidence': 'live-computed'},
        'smallStrong': {'family': 'Be Vietnam Pro', 'weight': 600, 'desktop': t(desk, 'Discover'), 'evidence': 'live-computed'},
        'micro': {'family': 'Be Vietnam Pro', 'weight': 600, 'desktop': t(desk, '01'), 'evidence': 'live-computed', 'note': 'Nav number badge'},
        'button': {'family': 'Be Vietnam Pro', 'weight': 400, 'desktop': t(desk, 'Book a 30-Min Call'), 'evidence': 'live-computed'},
    },
}
def secs(data):
    return {s['id']: {'y': s['y'], 'h': s['h'], 'w': s['w'], 'x': s['x'], 'padding': s['pad']} for s in data['sections'] if s['id']}
layout = {
    'breakpoints': {'desktop': '(min-width: 1200px)', 'tablet': '(min-width: 810px) and (max-width: 1199.98px)', 'mobile': '(max-width: 809.98px)', 'evidence': 'live-css (__framer__breakpoints)'},
    'desktop': {'viewport': 1440, 'sidebar': {'width': 400, 'padding': 20, 'panel': 360, 'position': 'sticky top 0, full viewport height'}, 'content': {'x': 420, 'width': 980, 'rightMargin': 40}, 'sections': secs(desk), 'evidence': 'live-computed'},
    'tablet': {'viewport': 900, 'content': {'width': 580}, 'sections': secs(tab), 'evidence': 'live-computed'},
    'mobile': {'viewport': 390, 'content': {'width': 370, 'gutter': 10}, 'topbar': {'height': 72, 'padding': 20}, 'sections': secs(mob), 'evidence': 'live-computed'},
    'grids': {
        'services': {'columns': 3, 'cardWidth': 313, 'gap': 20, 'cardHeight': 300, 'evidence': 'live-computed'},
        'blog': {'columns': 3, 'cardWidth': 313, 'gap': 20, 'cardHeight': 318, 'evidence': 'live-computed'},
        'stats': {'columns': 3, 'cardWidth': 197, 'gap': 20, 'cardHeight': 176, 'evidence': 'live-computed'},
        'projectRow': {'height': 70, 'padding': '14px 0', 'divider': '1px dashed stone', 'evidence': 'live-computed'},
        'awardRow': {'height': 50, 'divider': '1px dashed stone', 'evidence': 'live-computed'},
        'aboutCard': {'width': 860, 'height': 718, 'evidence': 'live-computed'},
        'contactCard': {'width': 740, 'padding': 60, 'evidence': 'live-computed'},
        'footer': {'width': 980, 'padding': '60px 60px 30px', 'evidence': 'live-computed'},
    },
}
radius = {'2': {'value': '2px', 'use': 'Chips, labels', 'evidence': 'live-computed'}, '6': {'value': '6px', 'use': 'Cards, buttons, nav cards, sidebar, footer, images', 'evidence': 'live-computed'}, '100': {'value': '100px', 'use': 'Small pills (+You tag)', 'evidence': 'live-computed'}, 'round': {'value': '50% / 10000px', 'use': 'Circle images, number badge, status dot', 'evidence': 'live-computed'}}
border = {'dashed': {'value': '1px dashed #B7B0A5', 'sourceVariable': '--token-d10d7d5c-1c4f-4f9d-802c-1a10cef2fa55', 'count': 140, 'evidence': 'live-css', 'note': '84 full boxes, 27 bottom-only dividers, 3 top-only; one dark variant 1px dashed #1C1B18'}, 'inputUnderline': {'value': '0 0 1px 0 dashed #B7B0A5', 'focus': '0 0 1px 0 dashed #675E50', 'evidence': 'live-css'}, 'footerInput': {'value': '1px solid #675E50', 'radius': '6px', 'background': 'rgba(255,255,255,0.1)', 'evidence': 'live-css'}}
shadow = {'none': {'value': 'none', 'evidence': 'live-computed', 'note': 'No shadows on site components; only the Framer badge uses rgba(5,8,12,.1) 0 2px 4px.'}}
motion = {
    'colorTransition': {'duration': '300ms', 'easing': 'cubic-bezier(0.44, 0, 0.56, 1)', 'properties': ['color'], 'evidence': 'live-css', 'targets': 'Text links, blog title hover -> flame'},
    'surfaceTransition': {'duration': '450ms', 'easing': 'cubic-bezier(0.44, 0, 0.56, 1)', 'properties': ['background', 'box-shadow'], 'evidence': 'live-css'},
    'inputFocus': {'duration': '450ms', 'easing': 'cubic-bezier(0.44, 0, 0.56, 1)', 'properties': ['all'], 'evidence': 'live-css', 'change': 'underline stone -> taupe'},
    'appear': {'trigger': 'initial load (hero Content Left)', 'initial': {'opacity': 0.001, 'y': 30}, 'animate': {'opacity': 1, 'y': 0}, 'transition': {'type': 'spring', 'stiffness': 80, 'damping': 30, 'mass': 1, 'delay': 0.05}, 'observedSettle': '~1.2s to 95%', 'evidence': 'live-bundle (__framer__appearAnimationsContent) + frame samples'},
    'buttonHoverReveal': {'trigger': 'hover', 'change': 'child "Hover BG" circle scales 0 -> 8 (400px) from the pointer-side origin; label color vanilla -> ink', 'evidence': 'live-computed (transform matrix 0 -> matrix(8,0,0,8))', 'note': 'Duration not exposed as CSS transition; Framer variant animation. Reconstruction uses 450ms cubic-bezier(.44,0,.56,1).'},
    'projectRowHover': {'trigger': 'hover', 'change': 'Thumbnail wrap width 1px -> 90px (90x42 image), title column 464 -> 365px, meta text taupe -> ink', 'evidence': 'live-computed (probe)'},
    'projectStackHover': {'trigger': 'hover on "view all projects" CTA', 'change': 'Side cards rotate(-12deg)/rotate(12deg) 129x168 -> rotate(0) 100x150', 'evidence': 'live-computed'},
    'blogTitleHover': {'trigger': 'hover', 'change': 'title color ink -> flame', 'duration': '300ms', 'evidence': 'live-css + computed'},
    'clientTicker': {'trigger': 'continuous', 'change': 'Horizontal marquee of 14 client logos, gap 60px, track 2376px, height 38px', 'speed': '40px/s (pointer away); 4px/s while hovered (x0.1)', 'cursor': 'ew-resize (draggable)', 'evidence': 'live-computed (probe, transform sampling)', 'note': 'Framer Ticker component (JS driven). Loop of one track ≈ 59s at 40px/s.'},
    'stickyTitle': {'trigger': 'scroll', 'change': '"hear from our satisfied clients" title is position: sticky (500px wide) while testimonial cards scroll over it', 'evidence': 'live-computed'},
    'navCardActive': {'trigger': 'scroll: linked section in view (scroll-spy), not hover', 'change': 'Sidebar card grows from 42px to 150px (projects, about), 181px (services) or 169px (contact) revealing a hidden Bottom block; background stays butter; data-highlight=true', 'evidence': 'live-computed (probe at 6 scroll positions)', 'note': 'Earlier hover-only reading was wrong: pointer hover does not expand the card.'},
    'navCardImageFan': {'trigger': 'hover on projects nav card (desktop)', 'change': '4 thumbnails (48-55px, radius 15%) re-fan: outer pair rotate ±30° -> 0°, inner pair 0° -> ±30°, translateX ±30 -> 0', 'duration': '~650ms (sampled), Framer spring', 'evidence': 'live-computed (probe, 14 samples)'},
    'featuredProjectHover': {'trigger': 'hover', 'change': 'Image scale 1 -> 1.05 inside clipped 980x628 card; caption text taupe -> ink', 'evidence': 'live-computed (probe)'},
    'progressiveBlur': {'trigger': 'static', 'change': 'Bottom 220px of the featured image: 8 stacked absolutely-positioned layers with backdrop-filter blur 0.78/1.56/3.13/6.25/12.5/25/50/100px, each masked by a stepped linear-gradient band (12.5% steps) so blur increases toward the caption', 'evidence': 'live-computed', 'note': 'Framer progressive-blur pattern; reconstruct with 8 mask bands or a single mask + blur.'},
    'statusPulse': {'trigger': 'continuous', 'change': 'Availability dot: 24px and 30px green rings animate opacity .5 -> 0', 'duration': '2050ms linear() spring curve, infinite', 'evidence': 'live-animations (Web Animations API)'},
    'footerLinkHover': {'trigger': 'hover', 'change': 'Footer text links cream -> flame; social icons opacity 1 -> .7', 'duration': '300ms cubic-bezier(.44,0,.56,1)', 'evidence': 'live-computed (probe)'},
    'mobileMenu': {'trigger': 'tap menu button (≤809px)', 'change': 'ink-70 overlay fades 0 -> 1 in ~450ms; 32px cream button’s two 20x2 taupe lines rotate ±45° into an X; nav panel (370x324, padding 10, radius 6) shows 2-column phone cards 172x28', 'evidence': 'live-computed (probe)'},
}
components = {
    'buttonPrimary': {'background': '{ink}', 'color': '{vanilla}', 'padding': '16px 48px', 'height': 51, 'radius': '6px', 'font': 'Be Vietnam Pro 400 16px lowercase', 'hover': 'reveal circle (butter) + text ink', 'evidence': 'live-computed'},
    'buttonAccent': {'background': '{butter}', 'color': '{ink}', 'padding': '16px 48px', 'radius': '6px', 'evidence': 'live-computed'},
    'buttonSmall': {'background': '{butter}', 'color': '{ink}', 'padding': '15px 30px', 'height': 49, 'evidence': 'live-computed'},
    'buttonSubmit': {'background': '{ink}', 'color': '{vanilla}', 'padding': '24px 74px', 'height': 67, 'evidence': 'live-computed'},
    'navCardExpanded': {'projects': 'Bottom 288x88: left column “showcase of innovation” 16/400 + “est.15 - 2025” 14/400 taupe; right 119px: 4-image fan (48-55px, radius 15%) + “8+ design assets” 14/400', 'about': 'Left white box 92x80 radius 6 padding 16 18 12: “since” 18/600 flame + “2015” 26/500 Bricolage; right list of 3 rows with 12px flower check icon, 14/400', 'services': 'White box 288x54 radius 6 padding 10 with 14/400 statement; “path to success:” 14/400 taupe; row discover › design › deliver 14/600 with 12px icons and 6x12 chevrons', 'contact': 'Row: flame pill 74x25 (logo mark 50x13) + “+” + ink pill “you” 49x25; “let’s talk” 14/600; description 14/400 taupe', 'heights': {'projects': 150, 'about': 150, 'services': 181, 'contact': 169}, 'evidence': 'live-computed (probe)'},
    'navCardPhone': {'size': '172x28', 'padding': '4px 12px', 'radius': '2px', 'label': 'Be Vietnam Pro 600 16px', 'badge': '20px white circle', 'layout': '2 columns inside 370x324 panel (padding 10, radius 6)', 'evidence': 'live-computed'},
    'menuButton': {'size': '32x32', 'background': '{cream}', 'radius': '6px', 'lines': '2 x 20x2 {taupe} radius 6 -> 16px X (rotate ±45°)', 'evidence': 'live-computed'},
    'statusDot': {'dot': '24px {status-green}', 'ring': '30px ring pulsing opacity .5->0 / 2050ms', 'evidence': 'live-animations'},
    'navCard': {'width': 320, 'height': 42, 'background': '{butter}', 'radius': '6px', 'padding': '8px 16px', 'label': 'Be Vietnam Pro 600 18px', 'badge': '26px white circle, 10px/600 digits', 'evidence': 'live-computed'},
    'navContactCard': {'width': 320, 'height': 169, 'background': '{cream}', 'evidence': 'live-computed'},
    'sidebar': {'width': 400, 'panel': '360x960', 'background': '{flame}', 'radius': '6px', 'padding': '20px', 'bottomCard': '{cream} 320x59 padding 20', 'evidence': 'live-computed'},
    'chip': {'background': '{vanilla}', 'radius': '2px', 'padding': '2px 6px', 'font': '14px', 'evidence': 'live-computed'},
    'chipAccent': {'background': '{butter}', 'radius': '2px', 'padding': '2px 6px', 'evidence': 'live-computed'},
    'pill': {'background': '{flame} / {ink}', 'radius': '100px', 'padding': '4px 12px', 'height': 25, 'evidence': 'live-computed'},
    'card': {'border': '1px dashed {stone}', 'radius': '6px', 'padding': '20px', 'backgrounds': ['{cream}', '{vanilla}', '{white}'], 'evidence': 'live-computed'},
    'darkCard': {'background': '{ink}', 'radius': '6px', 'padding': '20px', 'size': '313x300', 'evidence': 'live-computed'},
    'blockquote': {'background': '{sand}', 'border': '1px dashed {stone}', 'radius': '6px', 'padding': '20px', 'evidence': 'live-computed'},
    'formField': {'background': 'transparent', 'border': '0 0 1px 0 dashed {stone}', 'focusBorder': '{taupe}', 'font': 'Be Vietnam Pro 16px', 'placeholder': '{taupe}', 'evidence': 'live-css'},
    'footerInput': {'background': 'rgba(255,255,255,.1)', 'border': '1px solid {taupe}', 'radius': '6px', 'color': '{white}', 'placeholder': '{stone}', 'font': 'Anonymous Pro (code font)', 'evidence': 'live-css'},
    'ticker': {'background': '{vanilla}', 'radius': '6px', 'padding': '10px 0', 'height': 38, 'logoHeight': 18, 'evidence': 'live-computed'},
    'statCard': {'size': '197x176', 'padding': 20, 'backgrounds': ['{white}', '{vanilla}'], 'number': '34px/500', 'evidence': 'live-computed'},
    'progressiveBlur': {'layers': 8, 'blur': '0.78px … 100px (x2 per layer)', 'mask': 'linear-gradient bands of 12.5%', 'area': '1100x220 at the bottom of the featured image', 'evidence': 'live-computed'},
    'heroCircleImage': {'size': 90, 'radius': '50%', 'evidence': 'live-computed', 'note': 'Replaces the letter o in bold / growth; "since 2015" is a 90px white circle with dashed border and 6px padding; "moves" uses three overlapping 78px ink circles.'},
}
tokens = {
    'meta': {'name': 'three circles · extracted design system', 'date': '2026-09-14', 'live': 'https://three-circles-wbs.framer.website/', 'template': 'Webestica "three circles" One-Page Creative Studio Framer template', 'note': 'Color hex values and Framer token ids are original. Names, roles and other token labels are normalized extraction. Values in {braces} reference color names in this file.', 'version': 1},
    'color': colors, 'typography': typography, 'layout': layout, 'radius': radius, 'border': border, 'shadow': shadow, 'motion': motion, 'components': components,
    'recommended': {'focusRing': {'value': '2px solid #1C1B18, offset 3px', 'evidence': 'recommended'}, 'touchTarget': {'value': '44px', 'evidence': 'recommended'}, 'reducedMotion': {'value': 'Stop ticker and status pulse, skip appear offset, disable hover reveal/scale/fan; show final state.', 'evidence': 'recommended'}, 'contrast': {'value': 'taupe #675E50 on cream #FFFDEA = 5.6:1 (AA); stone #B7B0A5 text on cream fails AA and is used only for footer meta/placeholder.', 'evidence': 'computed'}},
}
(ROOT / 'tokens.json').write_text(json.dumps(tokens, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
css = ['/* Extracted from three-circles-wbs.framer.website, 2026-09-14. Framer token ids preserved as declared; readable aliases are normalized extraction. */', ':root {']
for name, spec in colors.items():
    if 'sourceVariable' in spec: css.append(f"  {spec['sourceVariable']}: {spec['value']};")
css.append('}')
css.append('/* Normalized aliases (names are not original source tokens). */')
css.append(':root {')
for name, spec in colors.items():
    css.append(f"  --tc-{name}: {spec['value']};")
css += ['  --tc-font-display: "Bricolage Grotesque", "Be Vietnam Pro", Arial, sans-serif;', '  --tc-font-body: "Be Vietnam Pro", Arial, sans-serif;', '  --tc-font-mono: "Anonymous Pro", ui-monospace, monospace;', '  --tc-text-transform: lowercase;', '  --tc-sidebar-width: 400px;', '  --tc-content-width: 980px;', '  --tc-gutter: 20px;', '  --tc-radius-chip: 2px;', '  --tc-radius: 6px;', '  --tc-radius-pill: 100px;', '  --tc-border-dashed: 1px dashed #B7B0A5;', '  --tc-duration-color: 300ms;', '  --tc-duration-surface: 450ms;', '  --tc-ease: cubic-bezier(.44, 0, .56, 1);', '  --tc-appear-spring: stiffness 80 / damping 30 / mass 1 / delay 50ms;', '}']
(ROOT / 'tokens.css').write_text('\n'.join(css) + '\n', encoding='utf-8')
print('tokens', len(colors), 'colors;', len(typography['roles']), 'type roles;', len(motion), 'motion;', len(components), 'components')
