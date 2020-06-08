#!/bin/sh
set -eu

pegjs --allowed-start-rules Document,Rule,Predicate --cache -o src/parser/generated-parser.js src/parser/language.pegjs
prettier --write src/parser/generated-parser.js
