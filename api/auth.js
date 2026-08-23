import crypto from 'crypto';

export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    res.status(500).send('OAUTH_CLIENT_ID não configurado nas variáveis de ambiente da Vercel.');
    return;
  }

  // Proteção CSRF do fluxo OAuth: um valor aleatório é gerado aqui, guardado
  // num cookie de curta duração e reenviado pelo GitHub no callback. Se o
  // valor não bater lá, a autenticação é recusada (ver api/callback.js).
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader(
    'Set-Cookie',
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const redirectUri = `https://${req.headers.host}/api/callback`;
  const authUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=repo,user` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}
