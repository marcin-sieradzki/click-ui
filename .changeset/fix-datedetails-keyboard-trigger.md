---
'@clickhouse/click-ui': patch
---

`DateDetails` now works from the keyboard. The relative time is a real button: Tab reaches it, Enter or Space opens the details, Escape closes them and returns focus to it. Screen readers announce it as a button that opens a dialog. Before, it could only be opened with a mouse.

Visual: unchanged at rest and on hover. While the relative time has focus it shows the link's underline, and a focus ring when the focus came from the keyboard.
