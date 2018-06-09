#!/bin/sh
cat rooster.txt hen.txt chickens.txt | xargs -P 16 wget -P chickens 
cat animal.txt bird.txt | xargs -P 16 wget -P not_chickens 
