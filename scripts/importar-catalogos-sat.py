"""Importa las dos hojas oficiales sin transcribir claves ni reglas.

Requiere xlrd en el Python de desarrollo; no añade dependencias de runtime.
Uso: python scripts/importar-catalogos-sat.py archivo.xls --fuente URL --publicado AAAA-MM-DD --sql semillas.sql
El SQL generado se incorpora a una migración de Supabase para actualizar ambas capas juntas.
"""
import argparse
import hashlib
import json
from pathlib import Path
import xlrd

parser = argparse.ArgumentParser()
parser.add_argument("archivo", type=Path)
parser.add_argument("--fuente", required=True)
parser.add_argument("--publicado", required=True)
parser.add_argument("--sql", type=Path, required=True)
args = parser.parse_args()
libro = xlrd.open_workbook(args.archivo, on_demand=True)

def fecha(valor):
    return xlrd.xldate_as_datetime(valor, libro.datemode).date().isoformat() if isinstance(valor, (int, float)) else None

def hoja(nombre):
    sheet = libro.sheet_by_name(nombre)
    if sheet.cell_value(5 if nombre == "c_RegimenFiscal" else 4, 0) != nombre:
        raise ValueError("El SAT cambió la estructura de la hoja; revisar antes de importar")
    datos = []
    for i in range(6, sheet.nrows):
        r = sheet.row_values(i)
        if not r[0]:
            continue
        opcion = dict(clave=str(int(r[0])) if isinstance(r[0], float) else r[0], descripcion=r[1].strip(),
                      fisica=r[2] == "Sí", moral=r[3] == "Sí", vigenteDesde=fecha(r[4]), vigenteHasta=fecha(r[5]))
        if nombre == "c_UsoCFDI":
            opcion["regimenes"] = str(int(r[6]) if isinstance(r[6], float) else r[6]).replace(" ", "").split(",")
        datos.append(opcion)
    if not datos or len({d["clave"] for d in datos}) != len(datos):
        raise ValueError("Catálogo vacío o con claves duplicadas")
    return datos

catalogo = dict(versionCfdi="4.0", fuente=args.fuente, publicado=args.publicado,
                sha256=hashlib.sha256(args.archivo.read_bytes()).hexdigest(),
                regimenes=hoja("c_RegimenFiscal"), usos=hoja("c_UsoCFDI"))
if any(c not in {r["clave"] for r in catalogo["regimenes"]} for u in catalogo["usos"] for c in u["regimenes"]):
    raise ValueError("Uso con régimen desconocido")
destino = Path(__file__).resolve().parents[1] / "packages/shared/src/catalogos/sat-cfdi-4.json"
destino.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

def sql(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    return "'" + str(v).replace("'", "''") + "'"

sentencias = [f"-- Fuente SAT: {args.fuente}\n-- SHA256: {catalogo['sha256']}"]
for nombre, tabla in [("regimenes", "sat_regimenes_fiscales"), ("usos", "sat_usos_cfdi")]:
    columnas = "clave, descripcion, fisica, moral, vigente_desde, vigente_hasta"
    if nombre == "usos": columnas += ", regimenes"
    valores = []
    for o in catalogo[nombre]:
        campos = [sql(o[k]) for k in ["clave", "descripcion", "fisica", "moral", "vigenteDesde", "vigenteHasta"]]
        if nombre == "usos": campos.append("array[" + ",".join(sql(c) for c in o["regimenes"]) + "]::text[]")
        valores.append("(" + ",".join(campos) + ")")
    actualizaciones = "descripcion=excluded.descripcion, fisica=excluded.fisica, moral=excluded.moral, vigente_desde=excluded.vigente_desde, vigente_hasta=excluded.vigente_hasta"
    if nombre == "usos": actualizaciones += ", regimenes=excluded.regimenes"
    sentencias.append(f"insert into public.{tabla} ({columnas}) values\n" + ",\n".join(valores) + f"\non conflict (clave) do update set {actualizaciones};")
    claves = ",".join(sql(o["clave"]) for o in catalogo[nombre])
    sentencias.append(f"update public.{tabla} set vigente_hasta = least(coalesce(vigente_hasta, {sql(args.publicado)}::date), {sql(args.publicado)}::date - 1) where clave not in ({claves});")
args.sql.write_text("\n\n".join(sentencias) + "\n", encoding="utf8")
print(f"Importados {len(catalogo['regimenes'])} regímenes y {len(catalogo['usos'])} usos; SHA256 {catalogo['sha256']}")
