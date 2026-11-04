# Unidos do Terrão: um clube de várzea construído pelos seguidores

Um perfil de Instagram com episódios diários de um time fictício da última divisão da várzea. Três regras movem tudo:

- **1 seguidor = 1 torcedor** no estádio
- **1 curtida = +R$ 1** no caixa do clube
- **O comentário mais curtido decide** o que o clube faz no dia seguinte

Além disso, o time joga uma liga simulada (turno e returno, com tabela). Formato, personagens e pipeline de vídeo estão em [`docs/FORMATO.md`](docs/FORMATO.md).

## Ciclo diário

```bash
python -m timefc preparar     # lê seguidores, curtidas e comentários do episódio de ontem
                              # → episodios/dia-NNN/briefing.json (ranking dos comentários)
# edite o briefing: como o comentário vencedor vira ação, custo e efeitos
python -m timefc fechar       # aplica a decisão, simula a rodada e calcula a bilheteria
                              # → episodios/dia-NNN/roteiro.md / roteiro.json (cenas + narração)
# produza o vídeo a partir do roteiro e suba numa URL pública
python -m timefc postar https://cdn.exemplo.com/dia-002.mp4   # legenda e 1º comentário vêm do roteiro
```

Exemplo de `decisao` no briefing:

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
        └──── próximo vídeo ◄─────┤ GitHub Actions diário: coletar/apurar│
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
python -m timefc apurar        # parcial das votações abertas
python -m timefc apurar --encerrar   # aplica o vencedor no estado do time
python -m timefc postar "https://cdn.exemplo.com/ep01.mp4" "Episódio 1: escolham o nome! Comente A, B ou C" \
    --agendar 2026-11-10T21:00:00Z --comentario "Vote: A, B ou C 👇"
```

O vídeo precisa estar numa **URL pública** (Cloudflare R2, S3, Google Cloud Storage…). O Buffer baixa o arquivo de lá.

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
- [ ] Bater o martelo no nome, nos personagens e no estilo visual
- [ ] Biblioteca de arte (personagens e cenários)
- [ ] Narração TTS + legendas karaokê
- [ ] Templates de cena em Remotion, renderizados a partir do `roteiro.json`
- [ ] Hospedagem dos vídeos (R2) e publicação automática
