#!/bin/sh
cat rooster.txt hen.txt chickens.txt | xargs -P 16 wget -q -P chickens 
cat animal.txt bird.txt | xargs -P 16 wget -q -P not_chickens 
