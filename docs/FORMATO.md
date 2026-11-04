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

- **Clube:** *Unidos do Terrão*, um time de várzea com campo de terra.
- **Narrador:** *Zé do Rádio*, locutor da rádio comunitária que narra tudo como se fosse uma final de Copa. Isso diferencia o tom e é muito brasileiro.
- **Presidente:** *Dona Cida*, dona do bar da esquina, que acumula os cargos de presidente, tesoureira e roupeira.
- **Elenco de várzea:** Baixinho (goleiro de 1,63 m), Bujão (centroavante de 118 kg), Maestro (44 anos, "fez teste num time grande em 98"), Zé Marmita (entregador que sai no intervalo), entre outros.
- **Liga:** *Terceira Divisão da Várzea*, com 10 times caricatos (Atlético Padaria, Veteranos do Bairro, Amigos do Churrasco FC…).
- **Moeda:** 1 curtida = R$ 1. Ingresso: R$ 2.

## Pipeline de produção

```
briefing.json ──(decisão humana)──► fechar ──► roteiro.json ──► narração (TTS + tempos por palavra)
                                                     │                    │
                                                     ▼                    ▼
                                    cenas: arte fixa + cartões gerados  ──► montagem ──► MP4 1080×1920
                                                                                              │
                                                                    hospedagem pública (R2) ──► Buffer
```

| Etapa | Ferramenta sugerida | Observação |
|---|---|---|
| Arte (personagens/cenários) | Gerador de imagem com referência de personagem | Criar uma **biblioteca fixa** uma vez e gerar só as novidades de cada dia (ex: a lanchonete). A consistência dos personagens é o que mais pesa. |
| Narração | TTS em PT-BR com timestamps por palavra (ex: ElevenLabs) | Os timestamps alimentam a legenda karaokê. |
| Montagem | Remotion (React → MP4), com um template por tipo de cena | Placar, caixa, tabela e comentários são gerados **a partir do `roteiro.json`**, então os números saem sempre certos. |
| Hospedagem | Cloudflare R2 / S3 | O Buffer exige uma URL pública. |
| Publicação | `python -m timefc postar URL` | Usa a legenda e o 1º comentário do roteiro. |

O texto de narração do `roteiro.json` é um rascunho gerado por template. O ideal é passar por um redator (pessoa ou Claude) para ganhar piadas e ritmo antes do TTS.
