# Prelaunch checklist — items needing Daren's confirmation

Everything else is built, tested, and live. These need the owner:

1. **Confirm the published offers** (home `#risk` + FAQ): free 7-day pilot,
   month-to-month / cancel anytime, 30-day guarantee tied to captured call
   value. They are live now because they were on the approved previous site.
   If any is not an offer you will honour, say so and the copy changes.

2. **Higgsfield hero media** (optional but planned): either run the prompts in
   `docs/higgsfield-prompts.md` on higgsfield.ai now (1,200 website-only trial
   credits), or after the trial converts tell Claude to generate via API.
   The code-native hero scene stands on its own until then.

3. **Higgsfield trial decision — tonight:** the Plus trial auto-converts
   around 11:17 PM MT July 23. Keep it (1,000 credits/mo, unlocks API
   generation) or say "cancel auto-renewal" before then.

4. **Analytics provider:** choose GA4 or Plausible when you want measurement;
   wiring instructions are in README. The event layer is inert until then.

5. **Legal review (eventually):** privacy.html and terms.html are accurate,
   plain-language starting points written from what the site actually does.
   Worth a lawyer's pass before serious scale, not before launch.

6. **og:image:** no social-share image is set yet (waiting on hero media).
   After the Higgsfield still exists: save as `assets/og-card.jpg` and ask
   Claude to add the `og:image` tags across pages.
