#!/bin/sh -e

SOURCE="etc/hello.tal"
TARGET="bin/output.rom"

rm -rf bin
mkdir bin

echo "Assembling unicycle.."
uxnasm $SOURCE $TARGET
echo "Assembling formatter.."
uxnasm etc/format-js.tal bin/format-js.rom
echo "Writing program.js.."
uxncli bin/format-js.rom $TARGET > etc/program.js
echo "Done."
