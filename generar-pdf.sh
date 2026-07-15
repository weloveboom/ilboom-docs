#!/bin/bash
# Genera ILBOOM-documentacion.pdf unificando todos los .md del repositorio
# Requisitos: Node.js 18+ y Google Chrome instalado
# Uso: bash generar-pdf.sh
set -e
cd "$(dirname "$0")"
exec node generar-pdf.mjs
