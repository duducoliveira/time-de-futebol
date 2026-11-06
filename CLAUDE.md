# Poeira FC (@poeira.fc): contexto do projeto

Perfil de Instagram com episódios diários de um time de várzea fictício que evolui com os seguidores.
Regras do formato: **1 seguidor = 1 torcedor**, **1 curtida = R$ 1 no caixa**, **o comentário VIÁVEL mais curtido decide**.
Veja `README.md` (comandos) e `docs/FORMATO.md` (formato e pipeline de vídeo).

## Decisões já tomadas
- Nome: **Poeira FC** no cenário, no escudo, na tabela e nos cartões; na narração, só "Poeira" (`clube.nome_falado`). Sigla PFC, estádio "Campo do Poeira".
- Narrador: **Tião**. Voz da ElevenLabs: Diego, `rpNe0HOx7heUulPiOEaG` (`personagens.narrador.voz`). Os gols usam `eleven_v3` com [tags] (estilo "grito").
- Presidente: Dona Cida (Bar da Cida). Elenco e liga ficam em `dados/estado_time.json`.
- Estreia roteirizada: o Poeira **perde o 1º jogo** (`liga.roteiro`), com gol de honra.
- Visual: arte vetorial por código (`video/arte.js`, `video/cenas.js`). Antes de renderizar, rode a checagem de sobreposição (`--qa`); o layout é em faixas (topo = contador, meio = cartões, y≈1165 = legenda, embaixo = personagens).
- Escudo oficial: `escudoPoeira()` em `video/arte.js`; as imagens de perfil ficam em `marca/` (gere com `node video/logo.mjs marca`).
- Vídeos hospedados no repositório público **duducoliveira/poeirafc-videos** (`clube.repo_videos`, arquivo `dia-NNN.mp4`, link raw do GitHub) → Buffer.
- Dados: o **Buffer** posta e traz curtidas e contagem de comentários (atualizados 1x/dia); a **API do Instagram** (login do Instagram, graph.instagram.com) traz o texto dos comentários e os seguidores.

## Credenciais (variáveis de ambiente, nunca no código nem no chat)
- `BUFFER_API_KEY_POEIRA`, `INSTAGRAM_ACCESS_TOKEN_POEIRA` (sufixo `_POEIRA`: o ambiente é compartilhado com outros projetos; `env()` em `__main__.py` lê o sufixo primeiro).
- `ELEVENLABS_API_KEY`.
- O token do Instagram atual é do tipo **Facebook (`EAA…`)**, gerado pelo login unificado: usa graph.facebook.com com o ID da conta (`clube.instagram_id` = 17841453282683112). **Não expira** (conferido pelo usuário no Depurador de token em 06/11/2026). Só deixa de funcionar se for revogado, se a senha da conta mudar ou se o app for removido; nesse caso, gere outro no painel da Meta. Um token `IG…` também funciona (graph.instagram.com).
- Canal do Buffer da @poeira.fc: `clube.buffer_canal_id` = 6aed11bde29c69a171783476.

## Próximos passos (em 06/11/2026)
1. ✅ (06/11) Leitura do Instagram e do Buffer testada: @poeira.fc com 1 seguidor e 0 posts; canal do Buffer encontrado.
2. ✅ (06/11) Dia 1 hospedado em poeirafc-videos (`dia-001.mp4`) e **rascunho** criado no Buffer (id 6aed2684f3498efda75f1669, Reel de 80 s). Não publique nada sem aprovação.
   - Buffer grátis: **sem primeiro comentário automático** (plano pago); a pergunta do dia vai na legenda.
   - O raw do GitHub serve MP4 como application/octet-stream, e o Buffer aceitou assim mesmo.
3. A lógica das decisões ainda está em discussão com o usuário.
4. Opcional: `FAL_KEY` existe no ambiente (geração de imagem); use só com o OK do usuário.

## Rodar
```bash
pip install -r requirements.txt pytest && export PYTHONPATH=src
python -m pytest -q tests
python -m timefc preparar --offline dados.json && python -m timefc fechar && python -m timefc video
```
Para testes, gere o vídeo numa cópia do repositório, para não avançar `dados/estado_time.json` (o repositório está no "dia 0").
