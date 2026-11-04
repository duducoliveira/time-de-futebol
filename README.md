# Time de Futebol: um clube construído pelos seguidores

Um perfil de Instagram de um time de futebol fictício que **evolui com a interação dos seguidores**. Cada Reel abre uma decisão (nome, cores, escudo, mascote, uniforme, contratações, escalação…). Os comentários são apurados automaticamente, o vencedor passa a fazer parte do estado do time e o vídeo seguinte mostra o resultado.

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

## Como funciona uma votação

Em `dados/estado_time.json`, cada votação liga um post a um atributo do time:

```json
{ "id": "v001-nome", "status": "aberta", "pergunta": "Qual vai ser o nome do time?",
  "atributo": "identidade.nome", "post_permalink": "https://www.instagram.com/reel/XXXX/",
  "opcoes":  { "A": ["exemplo um"], "B": ["exemplo dois"] },
  "valores": { "A": "Exemplo Um FC", "B": "Exemplo Dois EC" }, "peso_curtidas": 0 }
```

As regras da apuração estão em `src/timefc/votacao.py` e são cobertas por `tests/`:

- Vale **1 voto por usuário**, e conta o comentário mais recente.
- Aceita a letra (`A`, `#a`, `voto b`) ou uma palavra-chave da opção. Acentos e maiúsculas não importam.
- Comentários ambíguos (com duas opções) ou que não votam são descartados.
- Os comentários do próprio perfil são ignorados.
- Com `peso_curtidas`, curtidas no comentário viram votos extras.
- Em caso de empate, a votação continua aberta.

O GitHub Actions (`.github/workflows/coleta.yml`) roda todo dia às 08:17 (Brasília). Ele coleta os dados, mostra a parcial e faz commit do resultado. Para encerrar uma votação, dispare o workflow manualmente marcando "encerrar". O histórico do git vira a linha do tempo do clube.

## Próximos passos

- [ ] Definir o formato dos vídeos a partir dos vídeos de referência
- [ ] Identidade visual do perfil (bio, destaques, capas, template dos Reels)
- [ ] Gerar automaticamente o "placar da votação" (imagem/vídeo) a partir do estado
- [ ] Roteiro de temporada: ordem das decisões e cadência de posts
