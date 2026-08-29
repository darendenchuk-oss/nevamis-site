/* Minimal PNG encoder and decoder, 8 bit truecolour (RGB), no interlace.
   Dependency free on purpose: this repo ships exactly one devDependency
   (@playwright/test) and placeholder scaffolding is not a reason to add more.

   The DECODER exists so the generator can verify its own output rather than
   assert it. Writing 492 files and printing "done" is the failure mode this
   whole phase is guarding against; encodePng/decodePng round trip in the
   generator's self test, and the self test reads the frame code back through
   the same decoder the browser guards will conceptually perform. */
import zlib from 'node:zlib';

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/**
 * @param {{width:number,height:number,data:Uint8Array}} img RGB, 3 bytes per pixel
 * @param {{level?:number}} [opts]
 * @returns {Buffer}
 */
export function encodePng(img, opts = {}) {
  const { width, height, data } = img;
  if (!(width > 0 && height > 0)) throw new Error(`encodePng: bad size ${width}x${height}`);
  if (data.length !== width * height * 3) {
    throw new Error(`encodePng: data is ${data.length} bytes, expected ${width * height * 3}`);
  }
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // colour type 2: truecolour
  ihdr[10] = 0;  // deflate
  ihdr[11] = 0;  // adaptive filtering
  ihdr[12] = 0;  // no interlace
  const idat = zlib.deflateSync(raw, { level: opts.level ?? 6 });
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/**
 * @param {Buffer} buf
 * @returns {{width:number,height:number,data:Uint8Array}} RGB, 3 bytes per pixel
 */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('decodePng: not a PNG');
  let off = 8;
  let width = 0; let height = 0; let bitDepth = 0; let colourType = 0; let interlace = 0;
  const idatParts = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colourType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }
  if (bitDepth !== 8 || colourType !== 2 || interlace !== 0) {
    throw new Error(`decodePng: only 8 bit truecolour non interlaced is supported (got depth ${bitDepth}, colour ${colourType}, interlace ${interlace})`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  const bpp = 3;
  const stride = width * bpp;
  const out = new Uint8Array(stride * height);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v;
      switch (filter) {
        case 0: v = line[x]; break;
        case 1: v = line[x] + a; break;
        case 2: v = line[x] + b; break;
        case 3: v = line[x] + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
          v = line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`decodePng: unknown filter ${filter} on row ${y}`);
      }
      cur[x] = v & 0xff;
    }
    out.set(cur, y * stride);
    prev = cur;
  }
  return { width, height, data: out };
}

/** Read one RGB triplet out of a decoded image. Throws rather than returning
 *  black for an out of range coordinate, because a silent black sample would
 *  classify as 'no-code' and read as a missing strip instead of a bad test. */
export function pixelAt(img, x, y) {
  const xi = Math.round(x); const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= img.width || yi >= img.height) {
    throw new Error(`pixelAt: (${xi},${yi}) is outside ${img.width}x${img.height}`);
  }
  const i = (yi * img.width + xi) * 3;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}
