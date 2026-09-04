local root = app.params.root
for _, filename in ipairs(app.fs.listFiles(root)) do
  local path = app.fs.joinPath(root, filename)
  if app.fs.fileExtension(path) == 'aseprite' then
    local sprite = app.open(path)
    local out = assert(io.open(path .. '.rgba', 'wb'))
    for _, frame in ipairs(sprite.frames) do
      local image = Image(sprite.width, sprite.height, ColorMode.RGB)
      image:drawSprite(sprite, frame.frameNumber)
      out:write(image.bytes)
    end
    out:close()
    sprite:close()
  end
end
