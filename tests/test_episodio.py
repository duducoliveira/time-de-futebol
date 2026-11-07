import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from timefc import estado as est, episodio as ep
from timefc.liga import calendario, tabela
from timefc.comentarios import ranking


INICIAL = pathlib.Path(__file__).with_name("estado_inicial.json")


def _estado():
    return est.carregar(INICIAL)  # estado do dia 0, independente do clube real


def test_calendario_turno_returno():
    times = [f"T{i}" for i in range(10)]
    cal = calendario(times)
    assert len(cal) == 18 and all(len(r) == 5 for r in cal)
    jogos = [j for r in cal for j in r]
    assert len(set(jogos)) == 90  # cada par 2x, mando invertido


def test_ranking_ignora_proprio_perfil_e_spam():
    cs = [{"username": "clube", "text": "valeu!", "like_count": 999},
          {"username": "spam", "text": "sorteio no link", "like_count": 500},
          {"username": "ana", "text": "goleiro novo", "like_count": 10, "timestamp": "2"},
          {"username": "bia", "text": "grama no campo", "like_count": 10, "timestamp": "1"}]
    top = ranking(cs, ignorar_usuarios={"clube"})
    assert [c["usuario"] for c in top] == ["bia", "ana"]  # empate: quem comentou primeiro


def test_comentario_viavel_mais_curtido():
    from timefc import catalogo
    e = _estado()
    top = [{"usuario": "rico", "texto": "faz refletores e grama!", "curtidas": 900},
           {"usuario": "nada", "texto": "vai corinthians", "curtidas": 500},
           {"usuario": "fulano", "texto": "uma lanchonete com meu nome", "curtidas": 200}]
    d, av = catalogo.escolher(e, top, caixa=946, dia=2)
    assert not av[0]["viavel"] and "caixa" in av[0]["motivo"]
    assert av[1]["revisar"]
    assert d["comentario"] == 2 and d["acoes"] == ["lanchonete"] and d["custo"] == 500
    assert d["efeitos"]["estrutura.lanchonete"] == "Lanchonete do @fulano"


def test_tres_dias():
    e = _estado()
    b = ep.preparar(e, 0, None, [])
    e, r = ep.fechar(e, b)
    assert e["dia"] == 1 and r["partida"] is None and e["liga"]["rodada"] == 0
    assert any(c["tipo"] == "jogador" for c in r["cenas"])

    coms = [{"id": "1", "username": "fulano", "text": "lanchonete com meu nome", "like_count": 206, "timestamp": "1"},
            {"id": "0", "username": "sonhador", "text": "estadio de 50 mil lugares e refletores", "like_count": 300, "timestamp": "1"}]
    b = ep.preparar(e, 3745, {"id": "x", "permalink": "p", "like_count": 946}, coms, "clube")
    assert b["decisao"]["acoes"] == ["lanchonete"]
    b["nova_enquete"] = {"id": "apelido", "pergunta": "Apelido do goleiro?", "atributo": "elenco.1.apelido",
                         "opcoes": {"A": ["muralha"], "B": ["gato"]}, "valores": {"A": "Muralha", "B": "Gato"}}
    e, r = ep.fechar(e, b)
    assert e["regras"]["gasto_lanchonete_por_torcedor"] == 1
    assert r["partida"] and e["liga"]["rodada"] == 1 and len(e["liga"]["resultados"]) == 5

    coms = [{"id": "2", "username": "x", "text": "A", "like_count": 1, "timestamp": "1"},
            {"id": "3", "username": "y", "text": "muralha! e um goleiro novo", "like_count": 5, "timestamp": "1"},
            {"id": "4", "username": "z", "text": "outra lanchonete", "like_count": 9, "timestamp": "1"}]
    b = ep.preparar(e, 13200, {"id": "y", "permalink": "q", "like_count": 16000}, coms, "clube")
    assert b["avaliacao_comentarios"][0]["motivo"].endswith("já foi feito")
    assert b["decisao"]["acoes"] == ["goleiro"]
    e, r = ep.fechar(e, b)
    assert e["elenco"]["1"]["apelido"] == "Muralha"
    assert "12" in e["elenco"] and e["elenco"]["12"]["posicao"] == "GOL"
    assert sum(l["j"] for l in tabela(list(e["liga"]["times"]), e["liga"]["resultados"])) == 20
    assert round(sum(x["valor"] for x in e["extrato"]), 2) == e["caixa"]


def test_niveis_da_torcida_e_gancho():
    assert ep.nivel_torcida(0, 500) == "vazio"
    assert ep.nivel_torcida(200, 500) == "enchendo"
    assert ep.nivel_torcida(1500, 500) == "beira"
    assert ep.nivel_torcida(3745, 500) == "arvore"
    assert ep.nivel_torcida(13200, 500) == "laje"
    assert ep.nivel_torcida(10**6, 500) == "tudo"
    e = _estado()
    e, r = ep.fechar(e, ep.preparar(e, 0, None, []))
    assert [c["tipo"] for c in r["cenas"][:3]] == ["abertura", "regras", "estadio"]
    e, r = ep.fechar(e, ep.preparar(e, 3745, {"like_count": 4732}, []))
    capa, evo = r["cenas"][0], r["cenas"][1]
    assert capa["tipo"] == "capa" and capa["narracao"] == "Dia 2: Estreia!" and capa["dados"]["tema"] == "ESTREIA"
    assert evo["tipo"] == "evolucao" and evo["dados"]["caixa"] == 4732 and evo["dados"]["antes"] == 0
    assert r["cenas"][2]["tipo"] == "estadio" and r["cenas"][2]["dados"]["nivel"] == "arvore"
    assert all("hud" in c["dados"] and "estrutura" in c["dados"] for c in r["cenas"])


def test_estreia_e_derrota_roteirizada():
    for seguidores in (50, 3745, 20000):
        e = _estado()
        e, _ = ep.fechar(e, ep.preparar(e, 0, None, []))
        e, r = ep.fechar(e, ep.preparar(e, seguidores, {"like_count": 100}, []))
        assert ep._desfecho(r["partida"], e["clube"]["nome"]) == "derrota"
        assert any(g["time"] == e["clube"]["nome"] for g in r["partida"]["gols"])  # mas marca um golzinho


def test_arco_da_temporada_empate_e_classico():
    e = _estado()
    e, _ = ep.fechar(e, ep.preparar(e, 0, None, []))
    resultados = []
    for dia, seg in ((2, 106), (3, 300), (4, 600)):
        e, r = ep.fechar(e, ep.preparar(e, seg, {"like_count": 100}, []))
        resultados.append(ep._desfecho(r["partida"], e["clube"]["nome"]))
        if dia == 3:
            assert any(c["tipo"] == "banco" for c in r["cenas"])
            assert all(g["minuto"] >= 46 for g in r["partida"]["gols"] if g["time"] == e["clube"]["nome"])
            assert r["partida"]["mandante"] == e["clube"]["nome"]  # em casa
            assert "clássico" in r["cenas"][-1]["narracao"]
        if dia == 4:
            assert any(c["tipo"] == "festa" for c in r["cenas"])
            assert "clássico" in next(c["narracao"] for c in r["cenas"] if c["tipo"] == "pre_jogo").lower()
    assert resultados == ["derrota", "empate", "vitória"]


def test_rodada_2_em_casa_com_espelho_no_returno():
    e = _estado()
    cal = ep.calendario_do_clube(e)
    nome = e["clube"]["nome"]
    r2 = next(j for j in cal[1] if nome in j)
    assert r2[0] == nome  # rodada 2 em casa
    turno = len(cal) // 2
    espelho = next(j for j in cal[1 + turno] if nome in j)
    assert espelho[1] == nome and espelho[0] == r2[1]  # returno fora, contra o mesmo time


def test_piada_do_dia_alterna_e_nao_repete():
    e = _estado()
    e, _ = ep.fechar(e, ep.preparar(e, 0, None, []))
    vistos = []
    for dia, seg in ((2, 106), (3, 300), (4, 600), (5, 900)):
        e, r = ep.fechar(e, ep.preparar(e, seg, {"like_count": 100}, []))
        ap = [c for c in r["cenas"] if c["tipo"] == "apelido"]
        if dia == 2:
            assert not ap  # começa no dia 3
            continue
        assert len(ap) == 1
        d = ap[0]["dados"]
        assert d["alvo"] == ("nosso" if dia % 2 else "adversario")
        vistos.append(d["apelido"])
        if d["alvo"] == "nosso":
            assert e["elenco"][d["numero"]]["apelido"] == d["apelido"]
    assert len(set(vistos)) == len(vistos)


def test_apelidos_so_adversario_nunca_no_nosso_elenco():
    import random
    e = _estado()
    e["dia"] = 3
    for i in range(60):
        p = ep.piada_do_dia(e, {"piada": {"alvo": "nosso"}}, "Real Laje", random.Random(i))
        if p is None:
            break
        assert p["apelido"] not in ("Elizo Matsunaga", "Suzane")
    assert not any(j.get("apelido") in ("Elizo Matsunaga", "Suzane") for j in e["elenco"].values())
