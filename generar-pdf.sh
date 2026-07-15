#!/bin/bash
# Genera ILBOOM-documentacion.pdf unificando todos los .md del repositorio
# Requisito: npx (viene con Node.js), descarga md-to-pdf en primer uso
# Uso: bash generar-pdf.sh

set -e

DOCS_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$DOCS_DIR/ILBOOM-documentacion.pdf"

FILES=(
  "README.md"
  "arquitectura.md"
  "modulos.md"
  "despliegue.md"
  "decisiones-tecnicas.md"
  "bugs-y-limitaciones.md"
)

echo "Generando $OUTPUT ..."

# Verificar que existen todos los archivos
for f in "${FILES[@]}"; do
  if [ ! -f "$DOCS_DIR/$f" ]; then
    echo "ERROR: Falta $f"
    exit 1
  fi
done

# Concatenar con separadores de página
COMBINED=$(mktemp)
for f in "${FILES[@]}"; do
  cat "$DOCS_DIR/$f" >> "$COMBINED"
  printf "\n\n<div style=\"page-break-after: always;\"></div>\n\n" >> "$COMBINED"
done

# Generar PDF con md-to-pdf (sin instalar nada permanente)
npx --yes md-to-pdf "$COMBINED" --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"20mm","right":"20mm"}}' --stylesheet "$DOCS_DIR/pdf-style.css" 2>/dev/null || true

# md-to-pdf genera con extensión .pdf desde el input
GENERATED="${COMBINED}.pdf"
if [ -f "$GENERATED" ]; then
  mv "$GENERATED" "$OUTPUT"
  rm -f "$COMBINED"
  echo "✅ PDF generado: $OUTPUT"
else
  # Fallback: intentar con --output
  npx --yes md-to-pdf "$COMBINED" --output "$OUTPUT" --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"20mm","right":"20mm"}}'
  rm -f "$COMBINED"
  echo "✅ PDF generado: $OUTPUT"
fi
