import { fileURLToPath } from "node:url";

const sdk = fileURLToPath(
    new URL("../repo/packages/sdk/src/react/index.ts", import.meta.url),
);

export default {
    esbuild: { jsx: "automatic" },
    resolve: {
        alias: { "@pollinations/sdk/react": sdk },
        dedupe: ["react", "react-dom", "eventsource-parser"],
    },
    server: { port: 5199, strictPort: true, fs: { allow: [".."] } },
};
