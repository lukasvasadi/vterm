#!/bin/zsh

# Convert 1024x1024 png to icns

if [ "$1" != "" ]
then
    ICON1024=$1
    mkdir Icon.iconset
    sips -z 16 16     "$ICON1024" --out Icon.iconset/icon_16x16.png
    sips -z 32 32     "$ICON1024" --out Icon.iconset/icon_16x16@2x.png
    sips -z 32 32     "$ICON1024" --out Icon.iconset/icon_32x32.png
    sips -z 64 64     "$ICON1024" --out Icon.iconset/icon_32x32@2x.png
    sips -z 128 128   "$ICON1024" --out Icon.iconset/icon_128x128.png
    sips -z 256 256   "$ICON1024" --out Icon.iconset/icon_128x128@2x.png
    sips -z 256 256   "$ICON1024" --out Icon.iconset/icon_256x256.png
    sips -z 512 512   "$ICON1024" --out Icon.iconset/icon_256x256@2x.png
    sips -z 512 512   "$ICON1024" --out Icon.iconset/icon_512x512.png
    cp "$ICON1024" Icon.iconset/icon_512x512@2x.png
    iconutil -c icns Icon.iconset
    rm -R Icon.iconset
else
    echo "Please include path to icon png file (1024 px)"
fi
