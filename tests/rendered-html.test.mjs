import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("build emits a Vite static app", async () => {
  const [html, files] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readdir(new URL("../dist/assets/", import.meta.url)),
  ]);

  assert.match(html, /<title>Mini CRM<\/title>/i);
  assert.match(html, /src="\/assets\//i);
  assert.ok(files.some((file) => file.endsWith(".js")));
  assert.ok(files.some((file) => file.endsWith(".css")));
});

test("keeps the CRM implementation wired to the app surface", async () => {
  const [client, css, main, packageJson] = await Promise.all([
    readFile(new URL("../src/MiniCrmApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(client, /localStorage/);
  assert.match(client, /handleSaveClient/);
  assert.match(client, /deleteClient/);
  assert.match(client, /statusOptions/);
  assert.match(client, /addNote/);
  assert.match(main, /<MiniCrmApp \/>/);
  assert.match(css, /\.summary-strip/);
  assert.match(css, /\.client-row/);
  assert.doesNotMatch(packageJson, /site-creator-vinext-starter/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
