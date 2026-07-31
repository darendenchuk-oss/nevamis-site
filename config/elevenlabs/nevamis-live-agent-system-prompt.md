# Nevamis Live Agent System Prompt — moved

**This file no longer contains the prompt. Do not paste anything from here.**

The only snapshot of record for the live demo agent is:

    nevamis-engine/docs/agent-prompts/demo.md

Verify it against the running agent with:

    node scripts/check-agent-sync.mjs        # in nevamis-engine

## Why this file was emptied

It used to hold a full copy of the prompt under the instruction "Paste or
PATCH the entire fenced block below as the agent's system prompt." That copy
was captured 2026-07-23 and was never updated again, while the live agent kept
being fixed. By 2026-07-30 it was 13,102 characters against the live agent's
15,488 — roughly 2,400 characters behind.

Following its own instruction would therefore have silently reverted the live
demo line to a week-old prompt, including:

- the fix that stopped the agent writing prices 100x wrong in a text
  ("two forty-nine a month" reads as $2.49/mo when sent as SMS)
- the mandatory AI self-identification rules added after the SMS review
- the retired instant-answer claim that CLM-02 removed on 2026-07-26, which
  came back with it

Two files claiming to be the agent's source of truth is the whole problem. One
of them is checked against the running agent by a guard; this one was checked
by nobody, and was the one that told you to paste it.

Prompt history is in git. `git log --follow` this path to read any earlier
version without risking a paste into production.
