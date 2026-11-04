import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from timefc.votacao import apurar, detectar_opcao

OPC = {"A": ["leão", "leao"], "B": ["águia"], "C": ["lobo"]}

def test_detecta_letra_e_palavra():
    assert detectar_opcao("A", OPC) == "A"
    assert detectar_opcao("voto b!!", OPC) == "B"
    assert detectar_opcao("#c", OPC) == "C"
    assert detectar_opcao("Leão com certeza 🦁", OPC) == "A"
    assert detectar_opcao("AGUIA", OPC) == "B"

def test_ambiguo_e_lixo():
    assert detectar_opcao("leão ou lobo?", OPC) is None
    assert detectar_opcao("que time feio kkk", OPC) is None
    assert detectar_opcao("bacana", OPC) is None  # 'b' dentro de palavra não conta

def test_um_voto_por_usuario_vale_o_ultimo():
    cs = [
        {"username": "ana", "text": "A", "timestamp": "2026-11-01T10:00:00+0000"},
        {"username": "ana", "text": "C", "timestamp": "2026-11-01T12:00:00+0000"},
        {"username": "bia", "text": "lobo", "timestamp": "2026-11-01T11:00:00+0000"},
        {"username": "time", "text": "A", "timestamp": "2026-11-01T11:00:00+0000"},
        {"username": "caio", "text": "oi", "timestamp": "2026-11-01T11:00:00+0000"},
    ]
    r = apurar(cs, OPC, ignorar_usuarios={"time"})
    assert r["placar"] == {"A": 0, "B": 0, "C": 2}
    assert r["vencedor"] == "C" and r["votantes"] == 2 and r["comentarios_invalidos"] == 1

def test_empate():
    cs = [{"username": "x", "text": "A", "timestamp": "1"}, {"username": "y", "text": "B", "timestamp": "1"}]
    r = apurar(cs, OPC)
    assert r["empate"] and r["vencedor"] is None
