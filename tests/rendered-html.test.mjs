import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("build emits a Vite static app", async () => {
  const [html, files] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readdir(new URL("../dist/assets/", import.meta.url)),
  ]);

  assert.match(html, /<title>Mini CRM - Sales Pipeline Management<\/title>/i);
  assert.match(html, /src="\/assets\//i);
  assert.ok(files.some((file) => file.endsWith(".js")));
  assert.ok(files.some((file) => file.endsWith(".css")));
});

test("keeps the database-backed CRM wired to the app surface", async () => {
  const [client, css, main, supabaseClient, packageJson, migration] =
    await Promise.all([
    readFile(new URL("../src/MiniCrmApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/supabaseClient.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(
      new URL("../supabase/migrations/001_create_crm_schema.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(supabaseClient, /createClient/);
  assert.match(client, /signInWithPassword/);
  assert.match(client, /from\("clients"\)/);
  assert.doesNotMatch(client, /localStorage/);
  assert.match(client, /handleSaveClient/);
  assert.match(client, /confirmDeleteClient/);
  assert.match(client, /statusOptions/);
  assert.match(client, /addNote/);
  assert.match(main, /<MiniCrmApp \/>/);
  assert.match(css, /\.summary-strip/);
  assert.match(css, /\.client-row/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /auth\.uid\(\) = user_id/i);
  assert.match(packageJson, /@supabase\/supabase-js/);
  assert.doesNotMatch(packageJson, /site-creator-vinext-starter/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
