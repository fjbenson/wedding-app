// A stand-in for Supabase's gateway (its own image is blocked in the cloud
// container): routes /rest, /auth and /storage to the local containers.
const http = require("http");
const { execSync } = require("child_process");
const routes = [
  ["/rest-admin/v1", "supabase_rest_local", 3001, "/"],
  ["/rest/v1", "supabase_rest_local", 3000, "/"],
  ["/auth/v1", "supabase_auth_local", 9999, "/"],
  ["/storage/v1", "supabase_storage_local", 5000, "/"],
];
const ips = {};
function ip(name) {
  if (!ips[name]) {
    try { ips[name] = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${name}`).toString().trim(); } catch { return null; }
  }
  return ips[name];
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
