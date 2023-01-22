#!/bin/sh -e

SOURCE="etc/hello.tal"
TARGET="bin/output.rom"

rm -rf bin
mkdir bin

# Assembler
uxnasm etc/format-js.tal bin/format-js.rom
uxnasm etc/drifloon.tal bin/drifloon.rom

echo "Assembling unicycle.."
echo "Assembling formatter.."

echo "Writing program.js.."
echo "Done."
