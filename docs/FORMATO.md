# Formato dos episódios

## O que os vídeos de referência fazem

Os vídeos são três episódios diários (Dia 1, 2 e 3) de um clube inglês fictício da última divisão. Têm entre 56 e 99 s, formato vertical 9:16, ilustração 2D em estilo cartoon, narração em off energética e legendas grandes que destacam a palavra falada em laranja.

O coração do formato são **três regras fixas**, repetidas em todo episódio:

| Regra | Como aparece no vídeo |
|---|---|
| **1 seguidor = 1 torcedor** | Cartão imitando um perfil do Instagram: "ontem 0 → hoje 3.745". A arquibancada aparece literalmente cheia de gente. |
| **1 curtida = +1 no caixa** | Painel "CLUB FUND" com o saldo subindo. O dinheiro paga as melhorias. |
| **O comentário mais curtido decide** | Cartão de comentário com @usuario e curtidas. O clube executa o pedido, muitas vezes homenageando o autor (ex: a lanchonete com o nome dele). |

### Estrutura de cada episódio (~90 s)

1. **Gancho (0–5 s):** "DIA N" e a evolução da torcida desde ontem.
2. **Caixa:** as curtidas de ontem viram dinheiro.
3. **Comentário vencedor:** o pedido é executado, com o custo debitado e o antes/depois.
4. **Partida:** apresentação do adversário (com uma piada sobre ele), lances com placar e minuto no canto, e o resultado final.
5. **Tabela da liga:** a posição do clube em destaque.
6. **Finanças:** bilheteria (público × ingresso), receitas extras e saldo.
7. **Mini-enquete A/B** (opcional), ex: o apelido do novo herói.
8. **Próxima decisão:** 2 cartões de opção + "outra ideia?" e o lembrete "o comentário mais curtido decide".
9. **Próximo jogo** e o encerramento com o @ do perfil.

Elementos recorrentes:

- Personagens fixos com um traço cômico cada (jogadores com defeitos).
- Adversários caricatos.
- Números sempre na tela.
- Cada decisão deixa uma marca visível e permanente no cenário (telhado, grama, lanchonete).

## Nossa adaptação: original, não uma cópia

O formato (regras e ritmo) é a referência. **Nome, personagens, visual e liga são nossos.** Não reaproveitamos nada do clube dos vídeos. Proposta inicial (editável em `dados/estado_time.json`):

- **Clube:** *Poeira* (@poeira.fc), um time de várzea com campo de terra. Voz do narrador: ElevenLabs `UP5aPvvfM4UCXZrr3fdX`, configurada em `personagens.narrador.voz`.
- **Narrador:** *Tião*, locutor da rádio comunitária que narra tudo como se fosse uma final de Copa. Isso diferencia o tom e é muito brasileiro.
- **Presidente:** *Dona Cida*, dona do bar da esquina, que acumula os cargos de presidente, tesoureira e roupeira.
- **Elenco de várzea:** Baixinho (goleiro de 1,63 m), Bujão (centroavante de 118 kg), Maestro (44 anos, "fez teste num time grande em 98"), Zé Marmita (entregador que sai no intervalo), entre outros.
- **Liga:** *Terceira Divisão da Várzea*, com 10 times caricatos (Atlético Padaria, Veteranos do Bairro, Amigos do Churrasco FC…).
- **Moeda:** 1 curtida = R$ 1. Ingresso: R$ 2.

## Pipeline de produção (implementado)

```
briefing.json ──► fechar ──► roteiro.json ──► narração ElevenLabs (cache, tempo por palavra)
 (comentário viável                │                         │
  escolhido sozinho)               ▼                         ▼
                        cenas SVG geradas a partir do estado ──► Chromium quadro a quadro ──► ffmpeg ──► MP4 1080×1920
```

- **Arte:** `video/arte.js`. Personagens paramétricos, que são sempre os mesmos, e cenários que mudam com o estado: terrão ou grama, telhado, lanchonete, arquibancada, refletores e uniforme.
- **Cenas:** `video/cenas.js`, uma função por tipo de cena do roteiro (abertura, caixa, comentário, obra, gol, tabela, decisão…).
- **Legenda:** karaokê com a palavra falada em amarelo. Os números aparecem escritos ("R$ 4.732") e o TTS recebe a forma falada ("quatro mil setecentos e trinta e dois reais").
- **Fontes:** Anton e Nunito, ambas com licença OFL (`video/fontes/`).
