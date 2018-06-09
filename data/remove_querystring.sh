#!/bin/sh
$(ls {,not_}chickens/*) | while read f; do
  mv "$f" "$(echo $f | cut -d? -f1)"
done
