#!/bin/sh -e

SOURCE="etc/hello.tal"
TARGET="bin/output.rom"

rm -rf bin
mkdir bin

# Assembler
echo "Assembling formatter.."
uxnasm etc/format-js.tal bin/format-js.rom
uxnasm etc/drifloon.tal bin/drifloon.rom

echo "Writing program.js.."
uxncli bin/format-js.rom bin/drifloon.rom > src/asm.js
echo "Done."

