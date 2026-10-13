# @pollinations/sdk/react demo (PR for #17244)

A small React page that uses `useImage`, `useText`, `useAudio` and `useChat` with
`usePolliChatTransport` against `gen.pollinations.ai`, with the key from `<PolliProvider>`.

- `media/demo.gif` and `media/demo.mp4`: recording of the page (headless Chrome, real API calls)
- `media/final.png`: final state
- `src/main.tsx`: the page; `vite.config.js` aliases `@pollinations/sdk/react` to the PR's source
- `record.mjs`: the Playwright script that drove and recorded it

Run it: check out the PR next to this folder as `../repo`, then `npm i react react-dom ai @ai-sdk/react zod vite eventsource-parser playwright` and `npx vite`.
