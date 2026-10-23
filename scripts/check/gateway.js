// A stand-in for Supabase's gateway (its own image is blocked in the cloud
// container): routes /rest, /auth and /storage to the local containers.
const http = require("http");
const { execSync } = require("child_process");
const routes = [
  ["/rest-admin/v1", "supabase_rest_", 3001, "/"],
  ["/rest/v1", "supabase_rest_", 3000, "/"],
  ["/auth/v1", "supabase_auth_", 9999, "/"],
  ["/storage/v1", "supabase_storage_", 5000, "/"],
];
const ips = {};
// The containers are named after the folder the copy lives in (supabase_rest_<folder>), so find them by their prefix.
function ip(prefix) {
  if (!ips[prefix]) {
    try {
      const name = execSync(`docker ps --filter name=${prefix} --format '{{.Names}}'`).toString().trim().split("\n")[0];
      ips[prefix] = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${name}`).toString().trim();
    } catch { return null; }
  }
  return ips[prefix];
}
http.createServer((req, res) => {
  const r = routes.find(([p]) => req.url.startsWith(p));
  if (!r) { res.writeHead(404); return res.end(); }
  const host = ip(r[1]);
  if (!host) { res.writeHead(503); return res.end(); }
  const path = r[3] + req.url.slice(r[0].length).replace(/^\//, "");
  const h = { ...req.headers };
  const p = http.request({ host, port: r[2], path, method: req.method, headers: h }, (pr) => {
    res.writeHead(pr.statusCode, pr.headers); pr.pipe(res);
  });
  p.on("error", () => { delete ips[r[1]]; res.writeHead(502); res.end(); });
  req.pipe(p);
}).listen(54321, () => console.log("proxy on 54321"));
