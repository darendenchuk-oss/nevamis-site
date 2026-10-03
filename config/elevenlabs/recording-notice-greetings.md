# Recording Notice Greetings (DRAFT for Daren's approval)

- Version: v2 DRAFT, 2026-10-03 (v1 was 2026-07-25)
- Purpose: Approved-wording options for the opening greeting that tells the caller the call may be recorded, plus a clear path for a caller to DECLINE recording. Today that path is a message or a callback: a client agent's one call control is end_call, so it cannot reach voicemail or a person. Whether that is enough, or an unrecorded path must be built, is open (owner item O23). These are for the client-facing plumbing receptionist (Job C) and can be adapted for the Nevamis demo (Job A) and support (Job B) lines.
- Status: DRAFT wording only. Nothing here is legal advice. Daren must choose the option(s) and have Canadian legal counsel confirm the wording and the consent approach before any line uses it. Each client also confirms the exact wording for their own business.

## What changed in v2, and why (2026-10-03, whole-site audit MACHINE-15)

Every v1 option opened by announcing "our AI receptionist", and one promised bookings a client agent cannot make. Both were wrong for a client's line. The disclosure policy is not to open a call with AI: the agent greets the caller in the business's name, and the moment a caller asks whether they are talking to a person or a machine it says plainly that it is an AI and never claims to be human (llms.txt, and the demo line's own prompt). And a client agent books nothing: it takes the job and the time the caller wants for the owner to confirm, and its one call control is end_call. Each option below now greets in the business's name, gives the recording notice, offers the decline path, and promises nothing the line cannot do. `scripts/check-consistency.js` guard 7q fails this file if a greeting announces an AI or promises a booking or a transfer again.

## Why this exists (plain background, not legal advice)

The greeting tells the caller one thing up front: that the call may be recorded. Recording notice and consent are a legal question that depends on the client's jurisdiction (in Canada, one-party consent applies federally, but businesses recording customer calls commonly give notice and honour opt-outs). The safe, respectful default built into these options is: give the notice clearly, keep it short, and give the caller an easy way to opt out of recording without losing the ability to get help. Each Nevamis client is responsible for confirming their own obligations; these drafts help them start from a safe place.

Being an AI is disclosed the honest way rather than up front: the agent never claims to be human, and it says plainly that it is an AI the moment anyone asks, directly or sideways ("is this a real person?", "am I talking to a bot?").

Design goals for every option below:
- The caller is greeted in the business's own name.
- Recording notice is plain, not buried.
- The greeting stays short; a caller in trouble should not sit through a paragraph.
- Nothing in it promises what the line cannot do: no booking, no confirmation text, no putting the caller through to someone.
- There is always a way to decline recording and still be helped. Today that is a message or a callback, never voicemail or a person, which a client agent cannot reach (see the decline-recording path below and owner item O23).

## Greeting options (choose one per line, then have counsel review)

### Option A — the approved client greeting (recommended default)
"Hi, you've reached {{business_name}}. This call may be recorded to help us handle your requests and improve services. How can we help you?"

This is the greeting every client agent is built with today (`approvedGreeting` in nevamis-engine's src/domain/canonical.ts). The decline-recording path below is how the agent answers a caller who objects.

### Option B — Recording as an explicit choice
"Hi, you've reached {{business_name}}. Calls may be recorded so we can look after your request properly. If you'd prefer not to be recorded, just say so and I'll take your details so someone can call you back. What's going on today?"

### Option C — Minimal (for clients whose counsel prefers the lightest notice)
"Thanks for calling {{business_name}}. This call may be recorded. Tell me if you'd rather it wasn't. How can I help?"

### Option D — Emergency-aware opening (for lines with heavy after-hours emergency traffic)
"Thanks for calling {{business_name}}. This call may be recorded. If this is an emergency like flooding or a burst pipe, tell me right away. And if you'd rather not be recorded, just say so and I'll take a message for a callback. How can I help?"

## Nevamis demo line (Job A)

The demo line's live greeting is the Nevamis line's own (`nevamisLineGreeting` in canonical.ts, chosen by the founder on 2026-10-02): "Hello, this is the Nevamis office. This call may be recorded to help us handle your requests and improve services. How can I help you?" It carries the recording notice and does not announce an AI. Change it only through the live-agent push flow, never from this file.

## Nevamis client support line (Job B) variant

"Thanks for calling Nevamis support. This call may be recorded. If you'd prefer not to be recorded, let me know and I'll take a message so someone can call you back. Before I can share account details I'll need to verify the account. How can I help?"

## The decline-recording path (behaviour, required in all options)

When a caller says they do not want to be recorded, the assistant must:
1. Not argue and not pressure. Acknowledge it warmly ("No problem at all.").
2. Offer the approved fallback for that client ({{decline_recording_path}}). Today a client agent can offer only the last of these three. Its one call control is end_call, so it has no way to reach voicemail or a person:
   - Voicemail, so they can leave details without the AI recording the conversation. NOT AVAILABLE today: it needs building before any client may choose it.
   - A human, where one is available and configured. NOT AVAILABLE today: putting a caller through to a person is not part of the service.
   - Take a short message (name, number, need) and route it to the business, confirming what happens next.
3. Honour the choice for the rest of the call. Never quietly keep recording after a caller opted out.
4. If the platform cannot actually stop recording mid-call, the assistant must NOT claim it stopped. It must offer an opt-out that is genuinely unrecorded. This draft named voicemail or a human for that, and a client agent has neither today (see step 2), so this is an open item for Daren and counsel to resolve before launch (owner item O23), not something the agent may promise.

## Open items for Daren / counsel (must be resolved before launch)

- Confirm whether Canadian one-party-consent is the basis, or whether explicit notice-and-opt-out is the standard Nevamis will hold every client to (recommended: notice-and-opt-out, as drafted).
- Confirm the technical reality of "stop recording mid-call" on the ElevenLabs + Twilio stack, so the decline path is truthful. If recording cannot be stopped mid-stream, there is no unrecorded opt-out today: a client agent can take a message or end the call, and cannot reach voicemail or a person. Owner item O23 decides whether a message and a callback is an acceptable decline path or an unrecorded path must be built first; word the greeting to match that decision.
- Confirm whether the support (Job B) line is recorded, and keep its notice if so. The demo line (Job A) is recorded and its greeting says so.
- Decide whether the greeting wording is fixed by Nevamis or adjustable per client, and lock the approved set.
