#!/usr/bin/env bash
#
# Genera el PDF del informe con formato APA.
#
#   ./generar-pdf.sh
#
# Composición del PDF:
#   1. portada.md  -> portada única (título, nombre, universidad, asignatura,
#                     profesor, fecha) inyectada con --include-before-body.
#                     ATENCIÓN: --include-before-body inserta el archivo VERBATIM
#                     (sin parsear Markdown); debe contener solo LaTeX crudo.
#   2. README.md   -> SOLO el cuerpo: desde "## 1." hasta antes de "## 5."
#                     (se excluyen la cabecera de citas, la §5 de reflexión
#                     final y la §6 de indicaciones, que es material de apoyo
#                     y no forma parte del informe entregado).
#   3. apa.yaml    -> normas APA (Times New Roman 12pt, interlineado 2.0,
#                     márgenes 1", sangría 0.5") + monofont para bloques de código.
#
# IMPORTANTE: el filtro awk depende de los encabezados exactos
# "## 1. Introducción" y "## 5. Reflexión final: ...". Si se renombran
# esas secciones del README, hay que ajustar el patrón awk de abajo.

set -euo pipefail
cd "$(dirname "$0")"

PDF="Taller_Scripts_Automatizados_JuanFelipeQuinteroGutierrez.pdf"

# Extrae el cuerpo del informe (§1 a §4) y lo pasa a pandoc por stdin.
# --resource-path=. resuelve las imágenes de evidence/screenshots/ aunque
# el markdown venga por stdin.
awk '/^## 1\./{f=1} /^## 5\./{f=0} f' README.md | \
pandoc -f markdown \
  --include-before-body=portada.md \
  --metadata-file=apa.yaml \
  --pdf-engine=xelatex \
  --resource-path=. \
  -o "$PDF"

echo "OK: $PDF"
