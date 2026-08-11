import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Mini CRM login shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Mini CRM<\/title>/i);
  assert.match(html, /Mini CRM/);
  assert.match(html, /Sales Workspace/);
  assert.match(html, /demo@minicrm\.test/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /Your site is taking shape/i);
});

test("keeps the CRM implementation wired to the app surface", async () => {
  const [client, css, page, layout, packageJson, files] = await Promise.all([
    readFile(new URL("../app/MiniCrmApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../app/", import.meta.url)),
  ]);

  assert.ok(files.includes("MiniCrmApp.tsx"));
  assert.match(client, /localStorage/);
  assert.match(client, /handleSaveClient/);
  assert.match(client, /deleteClient/);
  assert.match(client, /statusOptions/);
  assert.match(client, /addNote/);
  assert.match(page, /<MiniCrmApp \/>/);
  assert.match(layout, /lang="id"/);
  assert.match(css, /\.summary-strip/);
  assert.match(css, /\.client-row/);
  assert.doesNotMatch(packageJson, /site-creator-vinext-starter/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(
    client,
    /SkeletonPreview|react-loading-skeleton|codex-preview/i,
  );

  await assert.rejects(access(new URL("SkeletonPreview.tsx", previewRoot)));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
