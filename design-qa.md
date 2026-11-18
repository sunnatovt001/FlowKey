# FlowKey background and support chat QA

Result: local checks passed; live Meta request intentionally omitted at user's request.

The auth background is an original glossy purple/orange cartoon illustration matching
FlowKey's logo. No opacity, dark tint or blur layer was added. Existing auth card,
language flags and transitions remain in place.

Visual evidence inspected: output/support-chat/desktop-empty.png (1440×1000),
output/support-chat/desktop-reply.png and output/support-chat/mobile-reply.png (390×844).
Generated source: /workspace/generated_images/exec-83d0ad51-7784-4026-8766-7245602bdfce.png.

Support launcher is 56×56 on auth and other pages. Panel uses a short opacity/scale
transition, with reduced-motion support. Empty state has only the bot graphic;
it disappears after the first message. Removed intro, suggested questions and footer.
Composer has one rounded border, a borderless expanding textarea and circular send.

Browser checks: desktop/mobile sizing, no horizontal overflow, mocked message/reply,
empty graphic removal, Escape dismissal and focus return passed. API responses were
mocked; these checks do not establish real Meta service availability.

Meta adapter follows the official meta-llama/llama-api-python schemas: native
completion_message response, max_completion_tokens, bounded owner-scoped read tools.
Tests cover native text/object output, tool continuation, redaction and safe failures.
Typecheck passed; 52 tests passed, 14 integration tests skipped; lint has 13 existing
warnings and no errors. GPT sign-in request remains prepared and unsubmitted.
