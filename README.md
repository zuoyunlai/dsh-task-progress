# dsh-task-progress

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) plugin that adds a
**task progress bar** to the chat window, right above the message composer.

![screenshot placeholder](icon.svg)

## What it does

While the LLM is working on a task, a slim progress strip appears between the
transcript and the input box:

- **Determinate mode** — when the agent publishes a todo plan, the bar fills
  with `done / total` and the label shows the item currently in flight plus a
  percentage.
- **Indeterminate mode** — when there is no plan (nothing defines a progress
  denominator), the bar sweeps and the label shows the elapsed time plus
  turn/step counters.

The bar disappears as soon as the session stops running.

## How it works

- Registers into the `conversation.input.dock` slot (the strip above the
  composer card) with order `1`, so it stacks with the shipped TodoPanel.
- Reads host-owned session state through the slot kit only:
  - `useSession(s => s.running)` — the reactive running flag
  - `useProjection('todos')` — the todo plan (determinate fill)
  - `useProjection('sessionStats')` — turn/step counters
- Styling uses theme tokens only (`--dsw-alias-brand-primary`,
  `--dsw-alias-bg-skeleton`, `--dsw-alias-label-primary/tertiary`) and the
  composer width variables, so it follows the active light/dark theme.
- No harness client package is imported; the client half is plain JS with
  `React.createElement`.

## Install

Local install (from a checkout):

```bash
# in your DSH profile
plugin_manager install_bundle <path-to>/dsh-task-progress
```

or with the DSH plugin manager targeting the local directory.

## Files

| File | Purpose |
| --- | --- |
| `index.js` | Host half (no-op; rendering is client-side) |
| `client.js` | Client half: slot registration + progress bar component |
| `package.json` | Bundle manifest (`dsh.client` platform metadata) |
| `cordis.patch.yml` | Cordis loader patch entry |
| `locale/en.json`, `locale/zh.json` | Dictionaries |
| `icon.svg` | Icon |

## License

MIT
