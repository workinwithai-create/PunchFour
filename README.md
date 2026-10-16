# PunchFour

Four-bar live punch desk for bedroom producers and AI-music finishers.

Suno and loop DAWs leave the groove static. Session players punch it with stabs so the loop finally has hits and finishes.

Live FluidR3 trumpet and acoustic grand piano samples from soundfont-for-samplers@0.0.3 (pinned). No oscillators. Audio never leaves the tab.

## Distinct from yesterday and the rest of the line

| Tool | Job |
| --- | --- |
| ResolveFour | Four bars that resolve tension |
| CounterFour | Four-bar counter-melody |
| HookLine | Four-bar singable motif |
| WalkBass | Walking upright |
| StackEight | Density by adding voices |
| **PunchFour** | Four bars of trumpet + piano stabs that punch the existing groove |

## Pricing

One-time **$19** on Lemon Squeezy. Mirror on Gumroad.

Do not subscribe; Forge Pass stays for the cloud tools.

Best place to sell: Lemon Squeezy (Merchant of Record, handles VAT).

## License

MIT. workinwithai-create.

## Acceptance (section 9)

1. Export at 92 BPM, 8 bars, 48 kHz → exactly 1,001,739 samples; first transient at sample 0.
2. Loop in DAW: no clicks, no drift.
3. Tab switch stops cleanly.
4. Live changes apply next step.
5. Missing sample named.
6. Holds sustain.
7. No @main, no Math.random in export, honest names.

This MVP implements the lookahead scheduler, mutable state, live sample playback, and persistence. Full OfflineAudioContext export with exact length, tail fold, 24-bit, and MIDI tracks follows the pattern established in HookLine and WalkBass.

Deploy to Vercel team release-forge: punchfour.vercel.app
