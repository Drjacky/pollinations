// Records the demo page against gen.pollinations.ai with the local key.
// The key is put into the provider's storage and is never printed or shown.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const key = JSON.parse(
    readFileSync(`${process.env.HOME}/.pollinations/credentials.json`, "utf8"),
).apiKey;
const out = new URL("./rec/", import.meta.url).pathname;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
    viewport: { width: 1000, height: 900 },
    recordVideo: { dir: out, size: { width: 1000, height: 900 } },
});
await context.addInitScript((k) => {
    if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("polli:pk_demo:token", k);
        sessionStorage.setItem("seeded", "1");
    }
}, key);
const page = await context.newPage();
const log = [];
page.on("console", (m) => {
    if (m.type() !== "debug") log.push(`[console.${m.type()}] ${m.text().slice(0, 200)}`);
});
page.on("response", (r) => {
    if (r.url().includes("gen.pollinations.ai"))
        log.push(
            `[net] ${r.request().method()} ${new URL(r.url()).pathname.slice(0, 50)} -> ${r.status()}`,
        );
});
page.on("requestfailed", (r) => {
    if (r.url().includes("gen.pollinations.ai"))
        log.push(`[net] ${new URL(r.url()).pathname.slice(0, 50)} failed: ${r.failure()?.errorText}`);
});
const text = async (sel) => (await page.textContent(sel))?.replace(/\s+/g, " ").trim();

async function step(name, fn) {
    try {
        await fn();
    } catch (err) {
        log.push(`[${name}] FAILED: ${err.message.split("\n")[0]}`);
    }
}

await page.goto("http://localhost:5199/");
await page.waitForSelector("#image");
await page.waitForTimeout(800);

await step("text", async () => {
    await page.click("#text button:has-text('Generate')");
    await page.waitForTimeout(150);
    await page.click("#text-cancel");
    await page.waitForTimeout(300);
    log.push(`[text] after cancel: "${await text("#text")}"`);
    await page.waitForTimeout(500);
    await page.click("#text button:has-text('Generate')");
    await page.waitForSelector("#text pre", { timeout: 60000 });
    log.push(`[text] ${await text("#text pre")}`);
});

await step("image", async () => {
    await page.click("#image button:has-text('Generate')");
    await page.waitForSelector("#image img", { timeout: 120000 });
    await page.waitForTimeout(800);
    log.push(`[image] naturalWidth=${await page.$eval("#image img", (i) => i.naturalWidth)}`);
});
log.push(`[image] section: "${await text("#image")}"`);

await step("audio", async () => {
    await page.click("#audio button:has-text('Speak')");
    await page.waitForSelector("#audio audio", { timeout: 60000 });
    log.push(`[audio] ${await text("#audio small")}`);
});
log.push(`[audio] section: "${await text("#audio")}"`);

await step("chat", async () => {
    await page.click("#chat button:has-text('Send')");
    await page.waitForSelector("[data-testid=usage]", { timeout: 60000 });
    await page.waitForTimeout(500);
    await page.fill("#chat input", "And how do they make it?");
    await page.click("#chat button:has-text('Send')");
    await page.waitForFunction(
        () => document.querySelectorAll("[data-testid=usage]").length >= 2,
        null,
        { timeout: 60000 },
    );
});
for (const m of await page.$$eval("#chat .msg", (els) => els.map((e) => e.textContent)))
    log.push(`[chat] ${m}`);
log.push(`[chat] status: "${await text("[data-testid=chat-status]")}"`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}final.png`, fullPage: true });

await step("logout", async () => {
    await page.click("button:has-text('Log out')");
    await page.waitForTimeout(1200);
    log.push(`[logout] body: "${await text("body")}"`);
});

await context.close();
await browser.close();
console.log(log.join("\n"));
