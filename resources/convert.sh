#!/bin/bash

convert -resize 256x256 -background none icon.svg icon.png
convert -background none -colors 256 icon.png icon.ico
convert -background none icon.png icon.icns

for Size in {16,24,32,48,64,96,128,256,512,1024}
do
	eval "convert -resize ${Size}x${Size} -background none icon.svg icons/${Size}x${Size}.png"
done
