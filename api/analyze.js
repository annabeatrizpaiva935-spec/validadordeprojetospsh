// Backend do "Validador de Projetos | PSH 2026".
// Recebe as chamadas do front-end (index.html) e repassa para a API da
// Anthropic usando uma chave guardada do lado do servidor (variável de
// ambiente ANTHROPIC_API_KEY no painel do Vercel) — assim os visitantes
// do site público nunca precisam ter (nem ver) uma chave de API.
//
// Proteção opcional: se a variável de ambiente ACCESS_CODE estiver
// definida no Vercel, esta função passa a exigir o cabeçalho
// "x-site-code" com o mesmo valor em toda requisição, evitando uso
// público descontrolado da sua chave. Se ACCESS_CODE não estiver
// definida, o endpoint fica aberto para qualquer visitante.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const accessCode = process.env.ACCESS_CODE;
  if (accessCode) {
    const provided = req.headers['x-site-code'];
    if (provided !== accessCode) {
      res.status(403).json({ error: { message: 'Código de acesso inválido ou ausente.' } });
      return;
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          'O backend não está configurado corretamente: falta a variável de ambiente ANTHROPIC_API_KEY no projeto Vercel.'
      }
    });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: 'Erro ao contatar a API da Anthropic: ' + err.message } });
  }
}
