# Reusable design-system release

User outcome: Final review and usable real-project design system, extending the existing reference catalog.

## Observed gap
The root tokens are raw extraction variables; catalog CSS targets global HTML elements; reconstructed demo JS mounts against fixed catalog IDs. No package exports, stable component API, lifecycle cleanup, type declarations or isolated consuming-project example exists. The large archive mixes references and runnable design code.

## Delivery contract
- Framework-neutral package in design-system/, native ES modules + scoped .fds CSS, no new dependencies.
- Root raw source tokens remain evidence; semantic --fds-* roles for actual UI with explicit accessible adjustments, light/dark opt-in and system-font default.
- Button/form/card/status/layout, accessible tabs/accordion/dialog/disclosure primitives with lifecycle cleanup, no application business logic.
- Typed exports, supported states/events, installation/React/Vue integration instructions, self-contained starter, copyable examples.
- Separate small project kit ZIP and npm-installable local tarball, retaining full archive.
- Independent runtime tests; theme/contrast/form/responsive/no-style-leak browser checks; npm pack contents and install/import in a separate temporary project; SHA/inventory checks and existing-catalog regression.

## Stop condition
Kit can be copied or locally installed in another project without original fonts/media/reference tree, tests pass on supported browser surface, final archives and guide match tested code, limitations and asset provenance stated concretely.
