#!/bin/bash

convert -resize 256x256 -background none icon.svg icon.png
convert -background none -colors 256 icon.png icon.ico
convert -background none icon.png icon.icns

for Size in {16,24,32,48,64,96,128,256,512,1024}
do
	eval "convert -resize ${Size}x${Size} -background none icon.svg icons/${Size}x${Size}.png"
done

# macOS iconset
for Size in {16,32,128,256,512}
do
	let RetinaSize=Size*2
	eval "convert -resize ${Size}x${Size} -background none icon.svg icon.iconset/icon_${Size}x${Size}.png"
	eval "convert -resize ${RetinaSize}x${RetinaSize} -background none icon.svg icon.iconset/icon_${Size}x${Size}@2x.png"
done

iconutil -c icns icon.iconset
