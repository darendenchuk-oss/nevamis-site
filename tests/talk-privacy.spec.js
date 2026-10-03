/* ============================================================
   A BROWSER CALL STORES NO IDENTIFIER AND FETCHES NO FONTS (LEGAL-10, -11)

   nevamis.ca/privacy says our pages store two small things, that we set no
   identifier of our own, and that no page, the browser call included,
   requests fonts from a font provider. The ElevenLabs widget breaks all three
   unless talk.js and the /talk/ policy stop it: left alone it fingerprints the
   device with FingerprintJS, keeps the visitorId in localStorage, sends it to
   ElevenLabs as user_id (run against main before the fix, this test saw
   {"elevenlabs_convai_user_id": "<32 hex>"} stored and the same value sent),
   and its stylesheet carries an @import of Inter from Google Fonts. In
   0.18.2 that import sits after a rule in the same <style>, so the browser
   drops it and no request is made even when the policy allows the host; the
   font assertion below is the net for a widget version that moves it first.
   The policy itself is held by scripts/check-legal-truth.mjs.

   This drives the REAL pinned widget through a real call start, with nothing
   leaving the machine: the agent's widget config is answered here, every
   other outside request is aborted (and recorded), and the conversation
   websocket is answered by Playwright, so no session reaches ElevenLabs and
   no demo call is ever placed. What the widget sends in its first websocket
   message is exactly what ElevenLabs would receive.
   ============================================================ */
import { test, expect } from '@playwright/test';

/* A fake microphone, so the widget's getUserMedia succeeds with no prompt. */
test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

test('the widget gets one fixed label, stores no id, and loads no font provider', async ({ page }) => {
  const outside = [];
  const sent = [];
  await page.routeWebSocket(/.*/, (ws) => { ws.onMessage((m) => sent.push(String(m))); });
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    outside.push(url.href);
    if (/\/v1\/convai\/agents\/[^/]+\/widget$/.test(url.pathname)) {
      /* The smallest config the widget renders a call button from. */
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ widget_config: {
        variant: 'compact', placement: 'bottom-right', avatar: { type: 'orb', color_1: '#2FBF8F', color_2: '#9FF0CE' },
        language: 'en', supported_language_overrides: [], text_only: false, supports_text_only: false,
        mic_muting_enabled: true, transcript_enabled: false, text_input_enabled: false, default_expanded: true,
        always_expanded: false, feedback_mode: 'none', terms_html: null, terms_key: null, disable_banner: true,
        text_contents: {}, styles: {}, first_message: 'hi' } }) });
    }
    return route.abort();
  });

  await page.goto('/talk/');
  const before = await page.evaluate(() => Object.keys(localStorage).length);
  await page.click('#talkStart');
  await expect(page.locator('elevenlabs-convai')).toHaveAttribute('user-id', /^[\w.-]{3,64}$/);
  await page.locator('elevenlabs-convai button', { hasText: 'Start a call' }).click();
  await expect.poll(() => sent.length, { message: 'the widget never opened its conversation socket' }).toBeGreaterThan(0);

  const init = JSON.parse(sent.find((m) => m.includes('conversation_initiation_client_data')) || '{}');
  const label = await page.locator('elevenlabs-convai').getAttribute('user-id');
  expect(init.user_id, 'ElevenLabs must receive the fixed label, not a fingerprint').toBe(label);

  const stored = await page.evaluate(() => Object.keys(localStorage));
  expect(stored, 'the widget stored a device id').not.toContain('elevenlabs_convai_user_id');
  expect(stored.length, `new browser storage: ${stored.join(', ')}`).toBe(before);
  expect(outside.filter((u) => /fonts\.(?:googleapis|gstatic)\.com/.test(u)), 'a font provider was asked for a font').toEqual([]);

  /* And the label is the same for the next visitor: a constant, not a value
     made per browser. */
  await page.goto('/talk/');
  await page.click('#talkStart');
  await expect(page.locator('elevenlabs-convai')).toHaveAttribute('user-id', label);
});
