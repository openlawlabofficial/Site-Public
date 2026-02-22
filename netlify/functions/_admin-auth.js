function getPasswordFromEvent(event) {
  const headers = event.headers || {};
  const direct = headers['x-admin-password'] || headers['X-Admin-Password'];
  if (typeof direct === 'string') return direct;
  return '';
}

function requireAdminPassword(event) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, response: { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'admin_password_not_configured' }) } };
  }

  const supplied = getPasswordFromEvent(event);
  if (!supplied || supplied !== expected) {
    return { ok: false, response: { statusCode: 401, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'unauthorized' }) } };
  }

  return { ok: true };
}

module.exports = { requireAdminPassword };
