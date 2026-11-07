import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from timefc.peneira import selecionar, selecionar_peneira, posicao, nome


def test_posicao_e_nome():
    assert posicao("Kaique dias Goleiro🙌🙌") == "GOL" and nome("Kaique dias Goleiro🙌🙌", "kaique_dias.gk01") == "Kaique Dias"
    assert posicao("Gil - LD e PD") == "LD" and nome("Gil - LD e PD", "gideon_saraiva") == "Gil"
    assert nome("Contrata eu por 0 reais e n preciso de salário, prefiro meia", "beniciocarmocarvalho") == "Beniciocarmocarvalho"
    assert nome("Centroavante raiz , só jogo se tiver desconto", "gscarneiro_corretor") == "Gscarneiro"
    assert nome("nicolas valdinei-volante", "nicolas.alm01") == "Nicolas Valdinei"
    assert posicao("Compra uma bola oficial") is None


def test_um_por_perfil_mais_curtidos_primeiro():
    cs = [{"username": "a", "text": "Ana goleira", "like_count": 3, "timestamp": "2"},
          {"username": "a", "text": "Ana zagueira", "like_count": 9, "timestamp": "3"},
          {"username": "b", "text": "Beto atacante", "like_count": 9, "timestamp": "1"},
          {"username": "clube", "text": "atacante", "like_count": 99, "timestamp": "1"}]
    sel = selecionar(cs, vagas=5, ignorar={"clube"})
    assert [(s["usuario"], s["posicao"]) for s in sel] == [("b", "CA"), ("a", "ZAG")]


def test_cinco_jogadores_e_um_tecnico():
    cs = [{"username": f"u{i}", "text": f"Fulano{i} atacante", "like_count": i, "timestamp": str(i)} for i in range(8)]
    cs += [{"username": "t1", "text": "Quero ser técnico kkkk", "like_count": 3, "timestamp": "1"},
           {"username": "t2", "text": "Carlão treinador", "like_count": 7, "timestamp": "1"}]
    r = selecionar_peneira(cs, vagas=5)
    assert [c["usuario"] for c in r["jogadores"]] == ["u7", "u6", "u5", "u4", "u3"]
    assert r["tecnico"]["usuario"] == "t2" and r["tecnico"]["nome"] == "Carlão"
    assert posicao("Quero ser técnico kkkk") == "TEC"
