#!/bin/bash
ls {,not_}chickens/* | while read f; do
  mv -n "$f" "$(echo $f | cut -d? -f1)"
done
