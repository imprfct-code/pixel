local root = app.params.root
local sprite = Sprite(12, 10, ColorMode.RGB)
sprite.layers[1].name = 'base'
local base = sprite.cels[1].image
for y=0,9 do for x=0,11 do base:drawPixel(x,y,app.pixelColor.rgba(50+x*10,100+y*10,200,120+x*10)) end end
local layer = sprite:newLayer()
layer.name = 'translucent'
layer.opacity = 180
local overlay = Image(8, 8, ColorMode.RGB)
for y=0,7 do for x=0,7 do overlay:drawPixel(x,y,app.pixelColor.rgba(220,40,80,80+y*20)) end end
local cel = sprite:newCel(layer,1,overlay,Point(-2,3))
cel.opacity = 170
sprite:saveAs(app.fs.joinPath(root,'alpha-offset.aseprite'))
sprite:close()
local gray = Sprite(8,8,ColorMode.GRAY)
for y=0,7 do for x=0,7 do gray.cels[1].image:drawPixel(x,y,app.pixelColor.graya(x*30,y*30)) end end
gray:saveAs(app.fs.joinPath(root,'grayscale.aseprite'))
gray:close()
