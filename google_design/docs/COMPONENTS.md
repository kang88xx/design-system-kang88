# Components

The canonical machine-readable catalog is `data/curated/components.json`.

| Category | Component | Core anatomy | Required states |
| --- | --- | --- | --- |
| Navigation | Top app bar | menu/product, search, utilities, account | default, search-active, scrolled |
| Navigation | Navigation drawer | primary action, sections, selected item | expanded, collapsed, selected, hover |
| Navigation | Navigation rail | icon, label, selected container | default, selected, hover |
| Navigation | Tabs | label, optional count, indicator | default, hover, selected, disabled |
| Navigation | Utility side panel | icon rail, panel, divider, add | collapsed, expanded, selected |
| Input | Search bar | leading icon, placeholder/query, filter/voice | default, hover, focus, query, disabled |
| Input | Filter chip | optional icon, label, menu | default, hover, selected, disabled |
| Actions | Filled button | icon, label, container | default, hover, pressed, focus, disabled |
| Actions | Filled tonal button | icon, label, tonal container | default, hover, pressed, focus, disabled |
| Actions | Outlined button | icon, label, outline | default, hover, pressed, focus, disabled |
| Actions | Icon button | symbol, target, tooltip | default, hover, pressed, focus, disabled, selected |
| Actions | FAB / extended FAB | icon, optional label, elevation | default, hover, pressed, focus |
| Content | Dense list row | selection, state, primary/secondary text, metadata, actions | read, unread, hover, selected |
| Content | Data card | title, value, delta, sparkline | default, positive, negative, selected |
| Content | Calendar grid | header, time gutter, slot, event, indicator | empty, today, current-time, event, drag |
| Feedback | Inline banner | icon, title, supporting text, action, dismiss | info, warning, success, dismissed |
| Feedback | Snackbar | message, action, dismiss | enter, rest, hover, exit |
| Feedback | Dialog | media/icon, headline, content, actions, scrim | enter, rest, focus-trap, exit |
| Feedback | Empty state | illustration/icon, headline, support, action | empty, loading, resolved |

## Behavior rules

- Selected navigation uses a tonal container and stronger icon/label color.
- Dense rows reveal contextual actions on hover without moving primary text.
- Search controls remain visually prominent but do not outshine the page's primary action.
- Icon buttons always have an accessible label or tooltip and a 40–48px hit area.
- Finance positive/negative cards pair color with sign and arrow direction.
- Dialogs move focus inside, trap it, and restore focus on exit.
