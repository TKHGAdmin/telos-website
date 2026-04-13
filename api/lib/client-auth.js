const crypto = require('crypto');
const { parseCookies } = require('./auth');

const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = 'telos_client_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// PBKDF2 password hashing - 100k iterations SHA-512
function hashPassword(password) {
  var salt = crypto.randomBytes(32).toString('hex');
  var hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash: hash, salt: salt };
}

function verifyPassword(password, hash, salt) {
  var derived = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  var a = Buffer.from(derived, 'hex');
  var b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Client session token: {clientId}.{expiry}.{signature}
function createClientToken(clientId) {
  var expires = Date.now() + SESSION_DURATION;
  var payload = clientId + '.' + expires;
  var signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return payload + '.' + signature;
}

function verifyClientToken(token) {
  if (!token) return null;
  var parts = token.split('.');
  if (parts.length !== 3) return null;
  var clientId = parts[0];
  var expires = parts[1];
  var signature = parts[2];
  var payload = clientId + '.' + expires;
  var expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  var a = Buffer.from(signature, 'hex');
  var b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() > parseInt(expires, 10)) return null;
  return clientId;
}

function getClientSessionCookie(token) {
  var maxAge = SESSION_DURATION / 1000;
  return COOKIE_NAME + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=' + maxAge;
}

function clearClientSessionCookie() {
  return COOKIE_NAME + '=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0';
}

function verifyClientSession(req) {
  var cookies = parseCookies(req.headers.cookie);
  return verifyClientToken(cookies[COOKIE_NAME]);
}

function normalizeEmail(email) {
  return (email || '').toLowerCase().trim();
}

module.exports = {
  hashPassword: hashPassword,
  verifyPassword: verifyPassword,
  createClientToken: createClientToken,
  verifyClientToken: verifyClientToken,
  getClientSessionCookie: getClientSessionCookie,
  clearClientSessionCookie: clearClientSessionCookie,
  verifyClientSession: verifyClientSession,
  normalizeEmail: normalizeEmail,
  COOKIE_NAME: COOKIE_NAME,
};
