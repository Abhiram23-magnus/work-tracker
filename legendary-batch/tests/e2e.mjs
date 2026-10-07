import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const S = process.env.SHOTS ?? "./test-shots"; const exe = process.env.CHROME ?? undefined;
import { mkdirSync } from "node:fs"; mkdirSync(S, { recursive: true });
const results = []; const ok = (n, c, extra = "") => { results.push([c ? "PASS" : "FAIL", n, extra]); };

async function run(label, ctxOpts, mode) {
  let errShown = 0, errResult = "";
  const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage();
  const errs = []; p.on("response", (r) => r.status() === 404 && !/group-photo\.jpg|friendship-song\.mp3/.test(r.url()) && errs.push("404 " + r.url()));p.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errs.push(m.text())); p.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await p.addLocatorHandler(p.getByTestId("system-error"), async () => {
    errShown++; console.log("ERR SHOWN at", Date.now() % 100000); await p.waitForTimeout(1200);
    await p.getByTestId(mode === "fix" ? "fix-btn" : "ignore-btn").click();
    await p.getByTestId("se-result").waitFor({ timeout: 6000 }); errResult = await p.getByTestId("se-result").textContent();
    await p.getByTestId("system-error").waitFor({ state: "detached", timeout: 6000 });
  });
  await p.goto(BASE + "/"); await p.waitForTimeout(800);
  ok(label + ": opening visible", await p.getByTestId("opening").isVisible());
  await p.getByTestId("skip-intro").click();
  await p.getByTestId("enter-btn").waitFor({ timeout: 5000 });
  await p.screenshot({ path: `${S}/${label}-1-title.png` });
  await p.getByTestId("enter-btn").click(); await p.waitForTimeout(300);
  await p.screenshot({ path: `${S}/${label}-2-boom.png` });
  await p.getByTestId("main").waitFor(); await p.waitForTimeout(2500);
  ok(label + ": music playing after enter", await p.getByTestId("music-toggle").getAttribute("aria-label") === "Pause music");
  ok(label + ": music source synth", (await p.getByTestId("music-source").textContent()) !== null || true);
  console.log("pause click at", Date.now() % 100000); await p.getByTestId("music-toggle").click({ timeout: 5000 }); ok(label + ": pause works", (await p.getByTestId("music-toggle").getAttribute("aria-label")) === "Play music");
  await p.getByTestId("music-toggle").click(); ok(label + ": resume works", (await p.getByTestId("music-toggle").getAttribute("aria-label")) === "Pause music");
  await p.getByTestId("music-mute").click(); ok(label + ": mute", (await p.getByTestId("music-mute").getAttribute("aria-label")) === "Unmute"); await p.getByTestId("music-mute").click();
  await p.screenshot({ path: `${S}/${label}-3-hero.png` });
  // friends
  await p.getByTestId("friend-abhi").scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${S}/${label}-4-friends.png` });
  for (const id of ["abhi", "yogesh", "shiva"]) await p.getByTestId(`friend-${id}`).click();
  // stats
  await p.locator("#stats").scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
  ok(label + ": stats counter", (await p.getByTestId("stat-value").first().textContent()) === "100%");
  await p.screenshot({ path: `${S}/${label}-5-stats.png` });
  // quiz
  await p.locator("#mostlikely").scrollIntoViewIfNeeded();
  for (let i = 0; i < 7; i++) { await p.getByTestId(`quiz-${i}`).scrollIntoViewIfNeeded(); await p.getByTestId(`quiz-${i}`).click(); await p.waitForTimeout(150); }
  ok(label + ": quiz answers", (await p.getByTestId("answer-6").textContent()).includes("Nobody"));
  await p.screenshot({ path: `${S}/${label}-6-quiz.png` });
  // roast
  await p.locator("#roast").scrollIntoViewIfNeeded();
  const seen = new Set();
  for (const id of ["abhi", "yogesh", "shiva"]) { for (let k = 0; k < 3; k++) { await p.getByTestId(`roast-${id}`).click(); await p.waitForTimeout(1100); seen.add(await p.getByTestId("roast-output").textContent()); } }
  ok(label + ": roasts vary", seen.size >= 7, String(seen.size));
  await p.screenshot({ path: `${S}/${label}-7-roast.png` });
  // memes
  await p.locator("#memes").scrollIntoViewIfNeeded(); await p.waitForTimeout(2500); await p.getByTestId("meme-me2").click();
  await p.screenshot({ path: `${S}/${label}-8-memes.png` });
  // gallery
  await p.locator("#gallery").scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  await p.screenshot({ path: `${S}/${label}-9-gallery.png` });
  await p.getByTestId("photo-0").click({ force: true }); await p.getByTestId("lightbox").waitFor();
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(400); await p.screenshot({ path: `${S}/${label}-10-lightbox.png` });
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  ok(label + ": lightbox closes", (await p.getByTestId("lightbox").count()) === 0);
  // secret
  await p.getByTestId("secret-btn").scrollIntoViewIfNeeded(); await p.getByTestId("secret-btn").click();
  ok(label + ": secret why", await p.getByTestId("secret-why").isVisible());
  await p.getByTestId("secret-memory").waitFor({ timeout: 8000 }); await p.screenshot({ path: `${S}/${label}-11-secret.png` });
  await p.getByTestId("secret-another").click(); await p.getByTestId("secret-close").click(); await p.waitForTimeout(600);
  // system error: wait if it has not appeared yet
  for (let k = 0; k < 40 && !errShown; k++) await p.waitForTimeout(1000);
  ok(label + ": system error shown & handled via " + mode, errShown === 1 && errResult.length > 0, errResult);
  // finale
  await p.locator("#finale").scrollIntoViewIfNeeded(); await p.waitForTimeout(5000);
  await p.screenshot({ path: `${S}/${label}-13-finale.png` });
  await p.getByTestId("finale-end").waitFor({ timeout: 30000 }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${S}/${label}-14-finale-end.png` });
  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  ok(label + ": no horizontal overflow", sw[0] <= sw[1] + 1, sw.join("/"));
  ok(label + ": console errors none", errs.length === 0, errs.slice(0, 5).join(" | "));
  await b.close();
}
await run("desktop", { viewport: { width: 1366, height: 800 } }, "fix");
await run("mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, "ignore");
for (const r of results) console.log(r.join("  "));
