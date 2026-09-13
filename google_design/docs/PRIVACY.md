# Privacy and Capture Safety

## Data that is never collected

- Gmail sender, subject, snippet, body, attachment filename, or account address
- Calendar event title, attendee, location, calendar owner name
- Drive filename, folder name, document thumbnail, or sharing identity
- Meet participant, meeting code, meeting title, or account identity
- Finance personalized watchlist, portfolio, account name, or private prompt history

## Capture sequence

1. Authenticate in the user's visible browser.
2. Navigate to the requested product route.
3. Run `scripts/redact-google-ui.js`.
4. Visually inspect the screenshot before retaining it.
5. Save screenshots only under `references-private/`.
6. Run `scripts/collect-google-ui.js` to write text-free raw JSON.
7. Validate with `npm run validate`.

## Raw schema safety

Each raw file declares:

```json
{
  "privacy": {
    "textContentCollected": false,
    "personalContentExcluded": true
  }
}
```

The collector records numeric layout metrics, computed styles, component geometry, interaction state counts, and allowlisted public asset hosts. It does not record DOM text or ARIA labels.

## Temporary browser state

The browser state may contain plaintext cookies and must stay under `.gstack/`, which is ignored. Delete saved states after authenticated capture work is complete.

## User-supplied product references

User-provided Meet screenshots are stored unchanged under the ignored private reference area. Their SHA-256 values, original dimensions, and evidence IDs are recorded in the private manifest. The public viewer never embeds the image files; a separate ignored private viewer renders them locally for reference-only inspection.

Observed platform image downloads are restricted to official allowlisted hosts (`*.gstatic.com` and the Calendar product host), public image extensions, a 12 MiB per-file limit, and redirect host revalidation. Files stay under the ignored private area and are classified reference-only.
