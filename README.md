# Poeira FC (@poeira.fc): um clube de várzea construído pelos seguidores

Um perfil de Instagram com episódios diários de um time fictício da última divisão da várzea. Três regras movem tudo:

- **1 seguidor = 1 torcedor** no estádio
- **1 curtida = +R$ 1** no caixa do clube
- **O comentário mais curtido decide** o que o clube faz no dia seguinte

Além disso, o time joga uma liga simulada (turno e returno, com tabela). Formato, personagens e pipeline de vídeo estão em [`docs/FORMATO.md`](docs/FORMATO.md).

## Ciclo diário

```bash
python -m timefc preparar     # lê seguidores, curtidas e comentários do episódio de ontem
                              # → episodios/dia-NNN/briefing.json (ranking dos comentários)
                              #   e já escolhe o COMENTÁRIO VIÁVEL MAIS CURTIDO (src/timefc/catalogo.py)
python -m timefc fechar       # aplica a decisão, simula a rodada e calcula a bilheteria
                              # → episodios/dia-NNN/roteiro.md / roteiro.json (cenas + narração)
python -m timefc video        # narra (ElevenLabs) e renderiza → episodios/dia-NNN/dia-NNN.mp4
python -m timefc postar       # sobe o MP4 para duducoliveira/poeirafc-videos e manda o link raw pro Buffer
                              # (legenda e 1º comentário vêm do roteiro)
```

**Comentário viável:** o pedido precisa estar no catálogo, ainda não ter sido feito e caber no caixa do dia. Se o mais curtido não for viável (por exemplo, "estádio de 50 mil lugares"), vale o próximo. Pedidos criativos fora do catálogo aparecem como "revisar" no briefing. Para escolher um deles, edite a `decisao` à mão, como no exemplo:

```json
"decisao": { "comentario": 0, "titulo": "Lanchonete do @fulano",
  "interpretacao": "Construímos a Lanchonete do Fulano: cada torcedor gasta R$1 por jogo.",
  "custo": 800,
  "efeitos": { "estrutura.lanchonete": "Lanchonete do @fulano", "regras.gasto_lanchonete_por_torcedor": 1, "clube.forca": "+2" } }
```

`clube.forca` (0–100) entra na simulação das partidas. `+N`/`-N` soma ao valor atual. Para testar sem API, use `preparar --offline dados.json` com `{"seguidores":..,"post":{"like_count":..},"comentarios":[..]}`.

```
 ┌──────────────┐   Reel + legenda    ┌─────────┐   publica   ┌───────────┐
 │ Vídeo pronto ├────────────────────►│ Buffer  ├────────────►│ Instagram │
 └──────▲───────┘   (python -m timefc └────┬────┘             └─────┬─────┘
        │            postar ...)           │ métricas (1x/dia)      │ comentários (texto)
        │                                  ▼                        ▼ + seguidores
        │                         ┌──────────────────────────────────────┐
        └──── próximo vídeo ◄─────┤ GitHub Actions: coletar + preparar   │
             usa o estado         │ → dados/estado_time.json (versionado)│
                                  └──────────────────────────────────────┘
```

## Por que Buffer **e** a API do Instagram

Conferi a API GraphQL nova do Buffer (`api.buffer.com`, com chave pessoal) em nov/2026:

| Necessidade | Buffer | Instagram API (Login do Instagram) |
|---|---|---|
| Postar Reel, agendar, 1º comentário | ✅ `createPost` (`metadata.instagram.type: reel`) | possível, mas não precisa |
| Curtidas / comentários / salvamentos **(contagem)** | ✅ `post.metrics`, atualizado **1x por dia** | ✅ `like_count`, `comments_count` em tempo real |
| **Texto e autor dos comentários** (para apurar votos) | ❌ não exposto | ✅ `/{media-id}/comments` |
| Número de seguidores | ❌ não exposto | ✅ `followers_count` |
| Responder comentários | ❌ | ✅ |

Resumindo: **o Buffer posta os vídeos e traz as métricas agregadas. A API do Instagram lê os comentários**, que é o que decide a votação. Os dois se cruzam pelo link do post (`externalLink` no Buffer = `permalink` no Instagram).

## Configuração

1. **Instagram**: deixe a conta como *Profissional* (Criador ou Empresa).
2. **Buffer**: conecte o Instagram, depois gere a chave em *Settings → API*. No plano gratuito o limite é de 600 requisições por dia, bem mais do que o projeto usa.
3. **App Meta**: crie um app em developers.facebook.com, adicione o produto *Instagram → API setup with Instagram login* e as permissões `instagram_business_basic` e `instagram_business_manage_comments`. Adicione sua conta como testadora e gere o token. Para uso só na própria conta, o modo desenvolvimento basta, sem App Review. O token dura 60 dias. Renove com `python -m timefc renovar-token`.
4. Copie `.env.example` para `.env` e preencha. No GitHub, cadastre os mesmos valores em *Settings → Secrets → Actions*.

```bash
pip install -r requirements.txt
export PYTHONPATH=src
python -m timefc canais        # descobre o ID do canal Instagram no Buffer
python -m timefc coletar       # seguidores + métricas → dados/metricas/AAAA-MM-DD.json
python -m timefc postar "https://cdn.exemplo.com/ep01.mp4" --legenda "Dia 1 do Poeira FC" \
    --agendar 2026-11-10T21:00:00Z --comentario "O comentário mais curtido decide 👇"
```

O vídeo precisa estar numa **URL pública** (Cloudflare R2, S3, Google Cloud Storage…). O Buffer baixa o arquivo de lá.

## Vídeo

O vídeo é 100% gerado por código, sem banco de imagens. Arte vetorial em SVG (`video/arte.js`), cenas (`video/cenas.js`), render com Chromium + ffmpeg (`video/render.mjs`) e narração na voz configurada da ElevenLabs, com legenda karaokê sincronizada por palavra. O visual acompanha o estado do clube: o gramado vira grama, o telhado é trocado, a lanchonete aparece e a arquibancada enche conforme os seguidores.

- Requisitos: `ffmpeg`, Node 18+ com `playwright` (Chromium) e as variáveis `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID`.
- A narração fica em cache em `.cache/tts`, então re-renderizar não gasta créditos.
- `python -m timefc video --preview` gera só um PNG por cena, para revisar rápido.
- **Checagem visual automática:** antes de renderizar, o `video` mede todos os textos, cartões, letreiros do cenário (placa do bar, muro, lanchonete) e rostos de personagens, e para se algo estiver sobreposto ou cortado na borda (use `--forcar` para ignorar). Manualmente: `node video/render.mjs render.json x --qa`.
- **Layout em faixas:** topo = contador e @; meio = cartões e títulos; faixa central (y≈1165) = legenda; embaixo = personagens. Cenas novas devem respeitar isso.
- Trilha de fundo: `video/audio/trilha.mp3`, um loop de samba gerado pela ElevenLabs. O áudio final é normalizado para cerca de -14 LUFS.
- Um episódio de 90 s leva uns 3 minutos para renderizar.

### Estrutura dos episódios

- **Dia 1:** abertura, depois **as regras logo no início** (seguidor = torcedor, curtida = R$ 1, comentário decide). Em seguida o estádio vazio, a presidente, o elenco, a liga, a primeira decisão e o encerramento, que repete as regras.
- **Dia 2 em diante:** começa sempre pela **evolução**: torcida e caixa de ontem → hoje, com contadores subindo e as regras na tela. Depois vem a vista aérea do estádio com a torcida crescendo. Quando a arquibancada lota, o excesso vai para a beira do campo, depois para o muro, as árvores e, por fim, as lajes do morro. Cada faixa tem uma fala própria. Na sequência: comentário vencedor, obra, jogo, bilheteria, tabela, próxima decisão e encerramento.
- Em todas as cenas, um contador no canto mostra 👥 torcida e 💰 caixa.

## Enquetes A/B

Além do comentário mais curtido, dá para abrir enquetes rápidas (ex: o apelido do goleiro) pelo campo `nova_enquete` do briefing. Depois elas são encerradas com `encerrar_enquetes`. Regras da apuração (`src/timefc/votacao.py`):

- Vale 1 voto por usuário, e conta o comentário mais recente.
- Aceita a letra (`A`, `#a`, `voto b`) ou uma palavra-chave da opção, sem ligar para acento.
- Comentários ambíguos são descartados.
- Em caso de empate, a enquete continua aberta.

Todo dia às 08:17 (Brasília), o GitHub Actions roda `coletar` e `preparar` e faz commit do briefing, que fica pronto para alguém decidir.

## Próximos passos

- [x] Formato a partir dos vídeos de referência (`docs/FORMATO.md`)
- [x] Motor do jogo: torcida, caixa, comentário vencedor, liga simulada, roteiro
- [x] Comentário viável mais curtido escolhido automaticamente
- [x] Vídeo gerado automaticamente: arte vetorial, narração ElevenLabs, legendas karaokê, trilha
- [ ] Hospedagem dos vídeos (R2) e publicação automática pelo Buffer
- [ ] Rodar o ciclo completo (preparar → fechar → video → postar) no GitHub Actions
