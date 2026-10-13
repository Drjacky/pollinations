import { useChat } from "@ai-sdk/react";
import {
    PolliProvider,
    type PolliUIMessage,
    useAudio,
    useAuth,
    useImage,
    usePolliChatTransport,
    useText,
} from "@pollinations/sdk/react";
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const blobUrl = (d: { buffer: ArrayBuffer; contentType: string } | null) =>
    d ? URL.createObjectURL(new Blob([d.buffer], { type: d.contentType })) : null;

function Status({ isLoading, error }: { isLoading: boolean; error: Error | null }) {
    return (
        <span>
            {isLoading ? " loading…" : ""}
            {error && <span className="err"> {error.message}</span>}
        </span>
    );
}

function ImageCard() {
    const { data, isLoading, error, run, rerun, cancel } = useImage();
    const src = useMemo(() => blobUrl(data), [data]);
    return (
        <section id="image">
            <h2>useImage</h2>
            <button
                onClick={() =>
                    run("a watercolor bee on a sunflower", {
                        model: "sana",
                        width: 512,
                        height: 512,
                        seed: 7,
                    })
                }
            >
                Generate
            </button>
            <button onClick={rerun}>Re-run</button>
            <button onClick={cancel} disabled={!isLoading}>Cancel</button>
            <Status isLoading={isLoading} error={error} />
            {src && <div><img src={src} width={256} alt="generated" /></div>}
        </section>
    );
}

function TextCard() {
    const { data, isLoading, error, run, cancel } = useText();
    return (
        <section id="text">
            <h2>useText</h2>
            <button
                onClick={() =>
                    run("Write one short haiku about honey bees.", { model: "nova-fast" })
                }
            >
                Generate
            </button>
            <button id="text-cancel" onClick={cancel} disabled={!isLoading}>Cancel</button>
            <Status isLoading={isLoading} error={error} />
            {data && <pre>{data}</pre>}
        </section>
    );
}

function AudioCard() {
    const { data, isLoading, error, run } = useAudio();
    const src = useMemo(() => blobUrl(data), [data]);
    return (
        <section id="audio">
            <h2>useAudio</h2>
            <button
                onClick={() =>
                    run("Hello from Pollinations hooks!", { model: "tts-1", voice: "nova" })
                }
            >
                Speak
            </button>
            <Status isLoading={isLoading} error={error} />
            {src && (
                <div>
                    <audio src={src} controls />{" "}
                    <small>{data?.contentType}, {data?.buffer.byteLength} bytes</small>
                </div>
            )}
        </section>
    );
}

function ChatCard() {
    const transport = usePolliChatTransport({
        model: "nova-fast",
        body: { instructions: "Reply in at most two short sentences." },
    });
    const { messages, sendMessage, status, stop, error } = useChat<PolliUIMessage>({
        transport,
    });
    const [input, setInput] = useState("What do bees make?");
    return (
        <section id="chat">
            <h2>useChat + usePolliChatTransport (/v1/responses)</h2>
            {messages.map((m) => (
                <div className="msg" key={m.id} data-role={m.role}>
                    <b>{m.role}:</b>{" "}
                    {m.parts.map((p, i) =>
                        p.type === "text" ? (
                            <span key={i}>{p.text}</span>
                        ) : p.type === "dynamic-tool" ? (
                            <pre key={i}>{p.toolName}: {p.state}</pre>
                        ) : null,
                    )}
                    {m.metadata?.usage && (
                        <small data-testid="usage">
                            {" "}— usage: {m.metadata.usage.input_tokens} in /{" "}
                            {m.metadata.usage.output_tokens} out tokens
                        </small>
                    )}
                </div>
            ))}
            {error && <p className="err">{error.message}</p>}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage({ text: input });
                    setInput("");
                }}
            >
                <input value={input} onChange={(e) => setInput(e.target.value)} size={50} />
                {status === "streaming" || status === "submitted" ? (
                    <button type="button" onClick={stop}>Stop</button>
                ) : (
                    <button>Send</button>
                )}
                <span data-testid="chat-status"> {status}</span>
            </form>
        </section>
    );
}

function App() {
    const { isLoggedIn, login, logout } = useAuth();
    if (!isLoggedIn) return <button onClick={() => login()}>Log in with Pollinations</button>;
    return (
        <>
            <p>
                Signed in with the provider's key. <button onClick={logout}>Log out</button>
            </p>
            <ImageCard />
            <TextCard />
            <AudioCard />
            <ChatCard />
        </>
    );
}

const root = document.getElementById("root");
if (root)
    createRoot(root).render(
        <PolliProvider appKey="pk_demo">
            <h1>@pollinations/sdk/react</h1>
            <App />
        </PolliProvider>,
    );
