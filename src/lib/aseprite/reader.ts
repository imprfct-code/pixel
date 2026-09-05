export class Reader {
  offset = 0;
  readonly view: DataView;

  readonly bytes: Uint8Array;
  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  take(length: number) {
    if (length < 0 || this.offset + length > this.bytes.length) {
      throw new Error("This Aseprite file is incomplete or damaged");
    }
    const result = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  u8() {
    return this.take(1)[0];
  }
  u16() {
    const offset = this.offset;
    this.take(2);
    return this.view.getUint16(offset, true);
  }
  i16() {
    const offset = this.offset;
    this.take(2);
    return this.view.getInt16(offset, true);
  }
  u32() {
    const offset = this.offset;
    this.take(4);
    return this.view.getUint32(offset, true);
  }
  string() {
    return new TextDecoder().decode(this.take(this.u16()));
  }
}

export async function inflate(data: Uint8Array, expectedSize: number) {
  const reader = new Blob([new Uint8Array(data)])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"))
    .getReader();
  const result = new Uint8Array(expectedSize);
  let offset = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (offset + value.length > expectedSize) throw new Error("Invalid compressed image size");
      result.set(value, offset);
      offset += value.length;
    }
    if (offset !== expectedSize) throw new Error("Incomplete compressed image");
    return result;
  } finally {
    await reader.cancel();
  }
}
