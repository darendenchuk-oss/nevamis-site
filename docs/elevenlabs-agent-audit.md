# ElevenLabs Agent Audit: Nevamis Demo Receptionist

**Audit date:** 2026-07-23 (current state, before the planned upgrade)
**Agent:** Nevamis Demo Receptionist (`agent_9101ky43tys1fswstde818j7j8wt`)
**Auditor scope:** configuration, prompt, tools, privacy posture, and behaviour gaps versus the published website. This document describes the agent as it exists today. It does not claim any upgrade has been applied; production changes require passing tests and owner approval.

---

## 1. Agent purpose

This agent is the **Nevamis sales and product demonstration agent** on the public demo line. It is not a fictional client receptionist and not a white-label demo persona. Callers dial the public demo number, experience the product live, and the agent's job is to explain Nevamis, qualify the caller, and book a 15-minute intro call with Daren. Every second of the call is itself the product demo.

## 2. First message and AI disclosure

- **First message:** "Thank you for calling, this is Nevamis AI. How can I help you?"
- **AI disclosure:** present. The prompt's IDENTITY section is non-negotiable: the agent identifies as an AI naturally in its greeting, plainly confirms it is Nevamis's AI receptionist if asked, and never claims to be human.

## 3. Prompt inventory

- **Length:** 8,512 characters.
- **Sections, in order:**
  1. Role intro (untitled opening paragraph)
  2. IDENTITY
  3. HOW YOU SPEAK
  4. TONE
  5. WHAT NEVAMIS DOES
  6. HOW IT WORKS
  7. WHY IT IS WORTH IT
  8. PRICING
  9. TAILOR TO WHOEVER IS CALLING
  10. HANDLING OBJECTIONS
  11. ON EVERY CALL
  12. BOOKING A CALL
  13. BOOKING A 15-MINUTE VIDEO CALL WITH DAREN
  14. ENDING THE CALL
  15. NEVER

Minor structural note: sections 12 and 13 are overlapping booking instructions (an older and a newer version coexist). They do not contradict each other on tool order, but the duplication is untidy and should be consolidated in any rewrite.

## 4. Model and generation settings

| Setting | Value | Assessment |
|---|---|---|
| LLM | gemini-2.5-flash | Appropriate for real-time voice |
| Temperature | 0.0 | Deterministic, correct for a scripted sales agent |
| Thinking budget | 0 | Intentional, keeps response latency low |

## 5. Voice and TTS settings

| Setting | Value |
|---|---|
| TTS model | eleven_flash_v2 |
| Stability | 0.4 |
| Similarity boost | 0.8 |

These are reasonable for a natural, low-latency phone voice.

## 6. Turn, timeout, and volume settings

| Setting | Value | Assessment |
|---|---|---|
| Turn timeout | 7 s | Reasonable |
| Turn eagerness | normal | Reasonable |
| Silence end call | 20 s | Reasonable, prompt also instructs a re-prompt then hang-up |
| Max call duration | 600 s (10 min) | Reasonable for a demo line |
| Daily call cap | 300 calls | Sane cost ceiling for the public number |

## 7. Guardrails

Platform guardrails are active on the agent. The prompt adds its own behavioural guardrails in the NEVER section: no invented pricing, no invented savings figures, no invented client names or capabilities, no guaranteed results, never hold a caller who wants out.

## 8. Privacy posture

- Call recording: **on**.
- Retention: **unlimited** (no automatic deletion configured).
- PII redaction: **not enabled**.

**Flag for owner decision:** unlimited retention of recorded calls that contain caller names, emails, and phone numbers is a policy choice, not a default that should stand unexamined. Daren should decide a retention window (and whether redaction is warranted) as part of a privacy policy pass. This audit flags it; it does not change it.

## 9. Tools

**Built-in tools:**
- `end_call`: hangs up when the call is genuinely done or the caller goes silent past the re-prompt.
- `transfer_to_number`: conference transfer to the approved on-call number. That number is configured inside the agent and is deliberately not written into this public document.

**Custom tools (names and purposes only; no endpoints or credentials appear in this repo):**
- `notify_owner`: webhook that texts the owner a call summary or callback request via SMS.
- `book_meeting`: books the 15-minute intro video call through the Cal.com API; requires name, email, and a chosen day and time.
- `check_booking`: looks up an existing booking by email **before** booking, preventing duplicate meetings. The prompt enforces the check_booking-first order.

## 10. Phone number and knowledge base

- **Phone number:** the agent is assigned to the public demo line, (587) 413-0035.
- **Knowledge base:** **empty** (0 documents). The agent's entire knowledge is the 8,512-character prompt.

## 11. Test history

An earlier behavioural test suite of 22 scenarios passed 22/22 during development (identity disclosure, booking flow, duplicate-booking prevention, transfer, hang-up discipline, and objection handling). Those tests predate the published pricing page, so they do not cover pricing or pilot accuracy.

---

## 12. Root-cause analysis: "the agent may not give full explanations"

**Primary cause: the prompt itself.**
- The PRICING section explicitly instructs deflection: be transparent about the "shape, not a made-up number," and if pushed, say Daren sets the price after scoping. The prompt contains **no dollar figures at all**. The agent is behaving exactly as written; it cannot state plans it was never given.
- There is **no pilot section**. The free 7-day live pilot does not appear anywhere in the prompt, so the agent cannot describe it, even though the website advertises it.
- There is no layered-answer standard (short answer first, then offer depth), so explanations can come out thin or clipped rather than complete.

**Secondary cause: the empty knowledge base.** With 0 documents, the agent has no fallback source for plan details, minute definitions, or pilot terms beyond the prompt text.

**Not the cause: model or turn settings.** gemini-2.5-flash at temperature 0.0 with a 7-second turn timeout and normal eagerness is a sound configuration for this use case. Nothing in the model, voice, or timing settings suppresses explanation depth. Changing them would not fix the reported behaviour.

## 13. Key discrepancies versus the website

The website (nevamis.ca) now publishes exact plans and a free pilot. The live agent contradicts a caller who has read the site:

| Topic | Website says | Agent currently says |
|---|---|---|
| Pricing | Published plans: After Hours C$249/mo, Growth C$449/mo, Scale from C$849/mo, with setup fees, included connected AI minutes, and per-minute overage rates | Deflects all price questions to Daren; states no figures |
| Free pilot | 7-day live pilot on the caller's real line, zero dollars, no card, capped, ends on day eight unless the client chooses a plan | Never mentioned; the agent cannot describe it |
| Founding clients | Setup fee waived for the first five founding clients | Never mentioned |
| Minute definition | "Connected AI minute" defined, with 75/90/100 percent usage alerts and near-limit choices | Never mentioned |

Net effect: a caller who read the pricing page and asks the demo line to confirm it gets a deflection, which reads as evasive and undercuts trust in the product the call is supposed to demonstrate. This is the gap the planned upgrade closes.

## 14. Backup

A full JSON export of the agent's current configuration was taken before any upgrade work:

`C:\Users\daren\ai-assistant\elevenlabs\agent-backup-2026-07-23.json`

The backup lives on the private disk only and is not committed to this public repository.
