export default async function handler(req, res) {
  const { code } = req.query;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!code) {
    res.status(400).send('Código de autorização ausente.');
    return;
  }
  if (!clientId || !clientSecret) {
    res.status(500).send('OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET não configurados nas variáveis de ambiente da Vercel.');
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
                  'authorization:github:success:${payload}',
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
