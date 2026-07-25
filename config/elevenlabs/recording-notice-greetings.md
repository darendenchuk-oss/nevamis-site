# Recording / AI Disclosure Greetings (DRAFT for Daren's approval)

- Version: v1 DRAFT, 2026-07-25
- Purpose: Approved-wording options for the opening greeting that discloses (a) that the caller is speaking with an AI, and (b) that the call may be recorded, plus a clear path for a caller to DECLINE recording (voicemail or a human). These are for the client-facing plumbing receptionist (Job C) and can be adapted for the Nevamis demo (Job A) and support (Job B) lines.
- Status: DRAFT wording only. Nothing here is legal advice. Daren must choose the option(s) and have Canadian legal counsel confirm the wording and the consent approach before any line uses it. Each client also confirms the exact wording for their own business.

## Why this exists (plain background, not legal advice)

Two things are being disclosed at the top of the call: that it is an AI, and that the call may be recorded. Nevamis's own rule is that the assistant always identifies as an AI and never pretends to be human. Recording notice and consent are a legal question that depends on the client's jurisdiction (in Canada, one-party consent applies federally, but businesses recording customer calls commonly give notice and honour opt-outs). The safe, respectful default built into these options is: disclose clearly, keep it short, and give the caller an easy way to opt out of recording without losing the ability to get help. Each Nevamis client is responsible for confirming their own obligations; these drafts help them start from a safe place.

Design goals for every option below:
- AI disclosure is up front and unmistakable.
- Recording notice is plain, not buried.
- The greeting stays short; a caller in trouble should not sit through a paragraph.
- There is always a way to decline recording and still be helped (voicemail or human).

## Greeting options (choose one per line, then have counsel review)

### Option A — Short, warm, combined (recommended default for plumbing)
"Thanks for calling {{business_name}}. You're speaking with our AI receptionist, and this call may be recorded to help with your service. If you'd rather not be recorded, just say so and I'll take a message or connect you with someone. How can I help?"

### Option B — Recording as an explicit choice
"Hi, you've reached {{business_name}}. I'm the AI receptionist here, and I can book jobs and answer questions. Calls may be recorded for quality and scheduling. If you'd prefer I don't record, let me know and I'll switch you to voicemail or a person. What's going on today?"

### Option C — Minimal (for clients whose counsel prefers the lightest notice)
"Thanks for calling {{business_name}}. This is our AI receptionist, and the call may be recorded. Tell me if you'd rather not be recorded. How can I help?"

### Option D — Emergency-aware opening (for lines with heavy after-hours emergency traffic)
"Thanks for calling {{business_name}}. You're speaking with our AI receptionist and this call may be recorded. If this is an emergency like flooding or a burst pipe, tell me right away. And if you'd rather not be recorded, just say so and I'll take a message or connect you. How can I help?"

## Nevamis demo line (Job A) variant

For the Nevamis public demo line, the AI disclosure is already handled in the live prompt. If recording notice is added there, keep it equally short, for example:
"Thanks for calling Nevamis. You're speaking with our AI receptionist, and this call may be recorded. If you'd rather not be, just say so. What can I do for you?"

## Nevamis client support line (Job B) variant

"Thanks for calling Nevamis support. You're speaking with our AI support assistant, and this call may be recorded. If you'd prefer not to be recorded, let me know and I'll take a message or bring in a person. Before I can share account details I'll need to verify the account. How can I help?"

## The decline-recording path (behaviour, required in all options)

When a caller says they do not want to be recorded, the assistant must:
1. Not argue and not pressure. Acknowledge it warmly ("No problem at all.").
2. Offer the approved fallback for that client ({{decline_recording_path}}), which is one of:
   - Route to voicemail so they can leave details without the AI recording the conversation, or
   - Transfer to a human where a human is available and configured, or
   - Take a short message (name, number, need) and route it to the business, confirming what happens next.
3. Honour the choice for the rest of the call. Never quietly keep recording after a caller opted out.
4. If the platform cannot actually stop recording mid-call, the assistant must NOT claim it stopped; instead it offers voicemail or a human as the genuine opt-out, and this limitation is flagged to Daren to resolve in configuration.

## Open items for Daren / counsel (must be resolved before launch)

- Confirm whether Canadian one-party-consent is the basis, or whether explicit notice-and-opt-out is the standard Nevamis will hold every client to (recommended: notice-and-opt-out, as drafted).
- Confirm the technical reality of "stop recording mid-call" on the ElevenLabs + Twilio stack, so the decline path is truthful. If recording cannot be stopped mid-stream, standardize on voicemail/human as the opt-out and word the greeting accordingly.
- Confirm whether the demo (Job A) and support (Job B) lines are recorded, and add notice there if so.
- Decide whether the disclosure wording is fixed by Nevamis or adjustable per client, and lock the approved set.
