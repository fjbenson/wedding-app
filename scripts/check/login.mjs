// Signs the private copy's test login in and saves its cookies for the browser.
import { createServerClient } from "@supabase/ssr";
import fs from "fs";

const jar = [];
const sb = createServerClient(process.env.U, process.env.K, {
  cookies: { getAll: () => jar, setAll: (cs) => cs.forEach((c) => jar.push(c)) },
});
const { error } = await sb.auth.signInWithPassword({ email: "check@example.com", password: "check-pass-123" });
if (error) throw error;
fs.writeFileSync(process.env.OUT, JSON.stringify(jar.map((c) => ({ name: c.name, value: c.value, domain: "127.0.0.1", path: "/" }))));
