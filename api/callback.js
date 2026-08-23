function parseCookie(header, name) {
  if (!header) return null;
  const prefix = name + '=';
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

// Serializa uma string como literal JS seguro para colar dentro de uma tag
// <script>: usa JSON.stringify (escapa aspas/backslashes) e neutraliza
// qualquer "<"/">" para que não seja possível fechar a tag prematuramente.
function toSafeScriptLiteral(str) {
  return JSON.stringify(str).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export default async function handler(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  // O cookie de state é de uso único: limpamos aqui, antes de decidir se a
  // autenticação será aceita ou não.
  const cookieState = parseCookie(req.headers.cookie, 'oauth_state');
  res.setHeader('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  if (!code) {
    res.status(400).send('Código de autorização ausente.');
    return;
  }
  if (!clientId || !clientSecret) {
    res.status(500).send('OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET não configurados nas variáveis de ambiente da Vercel.');
    return;
  }
  if (!state || !cookieState || state !== cookieState) {
    res.status(400).send('Falha na verificação de segurança (state inválido ou expirado). Tente autenticar novamente pelo /admin.');
    return;
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      res.status(400).send(`Erro na autenticação: ${data.error_description || data.error}`);
      return;
    }

    const token = data.access_token;
    const payload = JSON.stringify({ token, provider: 'github' });
    const mensagem = toSafeScriptLiteral(`authorization:github:success:${payload}`);

    // Handshake padrão esperado pelo Decap CMS: a janela de login envia
    // uma mensagem postMessage de volta pra janela que abriu o /admin.
    const html = `
      <!doctype html>
      <html>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                window.opener.postMessage(
                  ${mensagem},
                  e.origin
                );
                window.removeEventListener('message', receiveMessage, false);
              }
              window.addEventListener('message', receiveMessage, false);
              window.opener.postMessage('authorizing:github', '*');
            })();
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send('Erro ao trocar o código pelo token: ' + err.message);
  }
}
