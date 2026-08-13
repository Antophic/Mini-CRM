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
  const [
    app,
    css,
    main,
    apiClient,
    authApi,
    clientsApi,
    useAuthHook,
    useClientsHook,
    useDashboardHook,
    clientFormUtils,
    packageJson,
    schema,
  ] = await Promise.all([
    readFile(new URL("../src/MiniCrmApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/api/client.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/api/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/api/clients.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useAuth.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useClients.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useDashboard.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/utils/clientForm.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../backend/prisma/schema.prisma", import.meta.url), "utf8"),
  ]);
  const appSurface = [
    app,
    useAuthHook,
    useClientsHook,
    useDashboardHook,
    clientFormUtils,
  ].join("\n");

  assert.match(apiClient, /credentials:\s*"include"/);
  assert.match(authApi, /\/auth\/login/);
  assert.match(authApi, /\/auth\/register/);
  assert.match(clientsApi, /\/clients/);
  assert.match(useAuthHook, /getCurrentUser/);
  assert.match(useClientsHook, /listClients/);
  assert.match(useDashboardHook, /getDashboard/);
  assert.doesNotMatch(appSurface, /localStorage/);
  assert.match(app, /handleSaveClient/);
  assert.match(app, /confirmDeleteClient/);
  assert.match(clientFormUtils, /statusOptions/);
  assert.match(app, /addNote/);
  assert.match(main, /<MiniCrmApp \/>/);
  assert.match(css, /\.summary-strip/);
  assert.match(css, /\.client-row/);
  assert.match(schema, /model User/);
  assert.match(schema, /model Client/);
  assert.match(schema, /model ClientNote/);
  assert.match(schema, /model ActivityLog/);
  assert.match(schema, /model PipelineStage/);
  assert.match(packageJson, /dev:api/);
  assert.doesNotMatch(packageJson, /@supabase\/supabase-js/);
  assert.doesNotMatch(packageJson, /site-creator-vinext-starter/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
