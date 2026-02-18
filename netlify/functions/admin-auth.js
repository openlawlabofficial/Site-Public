exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ authorized: false, error: 'method_not_allowed' })
    };
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ authorized: false, error: 'admin_password_not_configured' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const password = typeof payload.password === 'string' ? payload.password : '';
    const botTrap = Boolean(payload.botTrap);

    if (botTrap) {
      return {
        statusCode: 403,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ authorized: false })
      };
    }

    if (password !== expectedPassword) {
      return {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ authorized: false })
      };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ authorized: true })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ authorized: false, error: 'invalid_json' })
    };
  }
};
