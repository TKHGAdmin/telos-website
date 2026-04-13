const crypto = require('crypto');

const SESSION_SECRET = process.env.SESSION_SECRET;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
const COOKIE_NAME = 'telos_dash_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function createToken() {
  const expires = Date.now() + SESSION_DURATION;
  const payload = `${expires}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  if (signature !== expected) return false;
  const expires = parseInt(payload, 10);
  if (Date.now() > expires) return false;
  return true;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((c) => {
    const [key, ...rest] = c.trim().split('=');
    if (key) cookies[key] = rest.join('=');
  });
  return cookies;
}

function getSessionCookie(token) {
  const maxAge = SESSION_DURATION / 1000;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function verifyPassword(input) {
  const expected = DASHBOARD_PASSWORD || '';
  const inputStr = input || '';
  if (inputStr.length !== expected.length) return false;
  const inputBuf = Buffer.from(inputStr, 'utf-8');
  const expectedBuf = Buffer.from(expected, 'utf-8');
  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

function verifySession(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifyToken(cookies[COOKIE_NAME]);
}

module.exports = {
  createToken,
  verifyToken,
  verifyPassword,
  verifySession,
  getSessionCookie,
  clearSessionCookie,
  parseCookies,
  COOKIE_NAME,
};
