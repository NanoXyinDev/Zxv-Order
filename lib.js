const { sql } = require("@vercel/postgres");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

async function initDb() {
  await sql`CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS vps_stock (
    id SERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    username TEXT NOT NULL,
    ssh_port INTEGER NOT NULL DEFAULT 22,
    password_cipher TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function secret32(name) {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is not configured`);
  return crypto.createHash("sha256").update(raw).digest();
}
function enc(s) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", secret32("VPS_CRYPT_KEY"), iv);
  const out = Buffer.concat([c.update(String(s), "utf8"), c.final()]);
  return `${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${out.toString("base64url")}`;
}
function dec(s) {
  const [iv, tag, data] = String(s).split(".");
  const d = crypto.createDecipheriv("aes-256-gcm", secret32("VPS_CRYPT_KEY"), Buffer.from(iv,"base64url"));
  d.setAuthTag(Buffer.from(tag,"base64url"));
  return Buffer.concat([d.update(Buffer.from(data,"base64url")), d.final()]).toString("utf8");
}
function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie||"").split(";").filter(Boolean).map(x=>{
    const i=x.indexOf("="); return [x.slice(0,i).trim(), decodeURIComponent(x.slice(i+1).trim())];
  }));
}
function setCookie(res,name,value,maxAge) {
  const secure = process.env.COOKIE_SECURE !== "false" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`);
}
async function createSession(adminId) {
  const id = crypto.randomBytes(32).toString("hex");
  await sql`INSERT INTO sessions(id,admin_id,expires_at) VALUES(${id},${adminId},NOW()+INTERVAL '12 hours')`;
  return id;
}
async function requireSession(req,res) {
  const sid = parseCookies(req).zxv_session;
  if (!sid) return null;
  const {rows}=await sql`SELECT a.id,a.username FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.id=${sid} AND s.expires_at>NOW() LIMIT 1`;
  if (!rows[0]) return null;
  return rows[0];
}
async function logout(req,res) {
  const sid=parseCookies(req).zxv_session;
  if(sid) await sql`DELETE FROM sessions WHERE id=${sid}`;
  setCookie(res,"zxv_session","",0);
}
async function ensureAdmin() {
  const u=process.env.ADMIN_USERNAME, h=process.env.ADMIN_PASSWORD_HASH;
  if(!u||!h) return;
  const {rows}=await sql`SELECT id FROM admins WHERE username=${u} LIMIT 1`;
  if(!rows[0]) await sql`INSERT INTO admins(username,password_hash) VALUES(${u},${h})`;
}
module.exports={sql,initDb,enc,dec,bcrypt,createSession,requireSession,logout,ensureAdmin,setCookie};
