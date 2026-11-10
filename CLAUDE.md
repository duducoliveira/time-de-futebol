# Poeira FC (@poeira.fc): contexto do projeto

Perfil de Instagram com episódios diários de um time de várzea fictício que evolui com os seguidores.
Regras do formato: **1 seguidor = 1 torcedor**, **1 curtida = R$ 1 no caixa**, **o comentário VIÁVEL mais curtido decide**.
Veja `README.md` (comandos) e `docs/FORMATO.md` (formato e pipeline de vídeo).

## Decisões já tomadas
- Nome: **Poeira FC** no cenário, no escudo, na tabela e nos cartões; na narração, só "Poeira" (`clube.nome_falado`). Sigla PFC, estádio "Campo do Poeira".
- Narrador: **Tião**. Voz da ElevenLabs: Diego, `rpNe0HOx7heUulPiOEaG` (`personagens.narrador.voz`). Os gols usam `eleven_v3` com [tags] (estilo "grito").
- Presidente: Dona Cida (Bar da Cida). Elenco e liga ficam em `dados/estado_time.json`.
- Arco roteirizado (`liga.roteiro`): rodada 1 = **derrota** (cabaré); rodada 2 = **empate em casa**, com gols do Poeira só no 2º tempo (os reservas entram descansados graças ao banco); rodada 3 = **1ª vitória, no clássico contra o maior rival, o Estrela da Feira** (`liga.rival`, "quem perde paga o pastel"). `mando` em `liga.roteiro` inverte casa/fora (com espelho no returno).
- Gols: até 3 gols, narra todos ("Tudo igual", "Desempatou", "Ampliou", "Virou"); com 4+, só o 1º gol do Poeira e o último do jogo. `gol_decisivo` em `liga.roteiro` fixa o autor e o grito do último gol nosso (ex.: Benício no Dia 5).
- Jogo fora: as cenas do jogo levam `dados.local` (muro, torcida e decoração do dono da casa; Estrela da Feira = barracas de feira), sem bilheteria nem cantina. Kombi: `kombi()` em `video/arte.js`.
- Piada do dia (a partir do dia 3): 1 brincadeira de nome/apelido por vídeo, no formato "posição + apelido + o porquê". Alterna jogador nosso (o apelido fica no elenco) e adversário (banco em `dados/apelidos.json`, sem repetir); com seguidor, use `briefing["piada"]`.
- Episódios com comentários roteirizados: `briefing["historia"]` (`comentarios` com carimbos, `reforcos` com seguidores que viram jogadores, `antes_jogo`/`depois_jogo` com cenas extras como o cabaré). Preços da lista de pedidos ÷5 (rede R$ 60, banco R$ 50...).
- Narração: "reais" só no primeiro valor do caixa ("saiu de R$ 358 pra 658"). Banco de reservas: imagem própria da lateral (fora da linha), não aparece na vista do campo.
- Capa: todo vídeo abre com a cena `capa`, em que o Tião fala "Dia N: tema!" sobre a tela "DIA N" + tema (`briefing["tema"]`/`tema_falado` ou automático ESTREIA/RODADA N/CLÁSSICO!). O Buffer usa o quadro de 0,5 s como capa (`thumbnail_ms`).
- Peneira (Dia 3 → Dia 4): 5 jogadores + 1 técnico, pelos comentários mais curtidos com nome + posição (`timefc/peneira.py`, `selecionar_peneira`). Modelo do Dia 3: `episodios/modelos/dia-003-peneira.json`. Piadas com o padrão "o [posição] [nome], ou melhor, o [posição] [apelido do banco]: [porquê]".
- Fluxo diário: levantamento às 22h11 (tarefa agendada) → OK do usuário → vídeo → "aprovado" → hospeda e agenda para 6h.
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
3. ✅ (06/11) **Dia 1 agendado** no Buffer para 06/11/2026 às 06:00 (Brasília) e fechado no estado (`dia` = 1). O roteiro está em `episodios/dia-001/`.
   ✅ (06/11) Dia 1 no ar: 106 seguidores, 256 curtidas e 27 comentários em 16 h. ✅ Dia 2 no ar 07/11 6h (218 seguidores, 277 curtidas, 58 comentários). ✅ Dia 3 (peneira + Barraca do Guigs) publicado em 08/11 às 9h45, a pedido (`postar_reel(..., agora=True)`).
   ✅ Dia 4 publicado em 09/11 às 7h48: escalação da peneira (técnico Gilberto Teles; #15 Khauan, #16 Rodrigo Moura, #17 Biquinho, #18 Saci (uma perna só, gorro), #19 Kelvin) + 1x1 com gol de bicicleta do Saci. Próximo: Dia 5 = clássico contra o Estrela da Feira (1ª vitória).
4. Dia 2: rodar `preparar` (Instagram ao vivo) depois que o Dia 1 acumular curtidas e comentários, depois `fechar` → `video` → subir → agendar. A cadência (que dia e que hora) ainda será combinada com o usuário.
5. A lógica das decisões ainda está em discussão com o usuário.
6. Opcional: `FAL_KEY` existe no ambiente (geração de imagem); use só com o OK do usuário.

## Rodar
```bash
pip install -r requirements.txt pytest && export PYTHONPATH=src
python -m pytest -q tests
python -m timefc preparar --offline dados.json && python -m timefc fechar && python -m timefc video
```
Para testes, gere o vídeo numa cópia do repositório, para não avançar `dados/estado_time.json` (o repositório está no "dia 0").
