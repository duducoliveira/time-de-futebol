import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from timefc import estado as est, episodio as ep
from timefc.liga import calendario, tabela
from timefc.comentarios import ranking


def _estado():
    return est.carregar()


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


def test_tres_dias():
    e = _estado()
    b = ep.preparar(e, 0, None, [])
    e, r = ep.fechar(e, b)
    assert e["dia"] == 1 and r["partida"] is None and e["liga"]["rodada"] == 0

    coms = [{"id": "1", "username": "fulano", "text": "lanchonete com meu nome", "like_count": 206, "timestamp": "1"}]
    b = ep.preparar(e, 3745, {"id": "x", "permalink": "p", "like_count": 4732}, coms, "clube")
    b["decisao"].update(titulo="Lanchonete", interpretacao="Lanchonete do @fulano.", custo=800,
                        efeitos={"regras.gasto_lanchonete_por_torcedor": 1, "clube.forca": "+2"})
    b["nova_enquete"] = {"id": "apelido", "pergunta": "Apelido do goleiro?", "atributo": "elenco.1.apelido",
                         "opcoes": {"A": ["muralha"], "B": ["gato"]}, "valores": {"A": "Muralha", "B": "Gato"}}
    e, r = ep.fechar(e, b)
    assert e["caixa"] >= 4732 - 800
    assert e["clube"]["forca"] == 30 and e["liga"]["times"]["Unidos do Terrão"] == 30
    assert r["partida"] and e["liga"]["rodada"] == 1
    assert len(e["liga"]["resultados"]) == 5

    coms = [{"id": "2", "username": "x", "text": "A", "like_count": 1, "timestamp": "1"},
            {"id": "3", "username": "y", "text": "muralha!", "like_count": 1, "timestamp": "1"}]
    b = ep.preparar(e, 13200, {"id": "y", "permalink": "q", "like_count": 100}, coms, "clube")
    b["decisao"].update(interpretacao="ok")
    b["encerrar_enquetes"] = ["apelido"]
    e, r = ep.fechar(e, b)
    assert e["elenco"]["1"]["apelido"] == "Muralha"
    assert sum(l["j"] for l in tabela(list(e["liga"]["times"]), e["liga"]["resultados"])) == 20
    extrato_ok = round(sum(x["valor"] for x in e["extrato"]), 2) == e["caixa"]
    assert extrato_ok
