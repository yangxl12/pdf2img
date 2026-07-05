"""Generate PWA icon PNGs (192x192 and 512x512) using only stdlib."""
import struct
import zlib
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

def create_png(width: int, height: int) -> bytes:
    """Create a minimal PNG with a simple '票影' themed icon design."""
    # BG: warm cream #F7F3EA, accent: dark brown #5D4037
    BG_R, BG_G, BG_B = 0xF7, 0xF3, 0xEA
    ACC_R, ACC_G, ACC_B = 0x5D, 0x40, 0x37

    # Build raw pixel rows (RGBA)
    raw = b""
    cx, cy = width // 2, height // 2
    radius = int(width * 0.38)

    for y in range(height):
        raw += b"\x00"  # filter byte: none
        for x in range(width):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5

            # Rounded square with circle cutout
            in_circle = dist <= radius
            in_square = (abs(dx) <= radius and abs(dy) <= radius)

            # Draw a document shape: rounded rect with folded corner
            half = width // 2
            qr = width // 4
            # Simple design: circle on cream background
            if in_circle:
                r, g, b, a = ACC_R, ACC_G, ACC_B, 255
            else:
                r, g, b, a = BG_R, BG_G, BG_B, 255

            raw += struct.pack("BBBB", r, g, b, a)

    def chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    # PNG signature
    sig = b"\x89PNG\r\n\x1a\n"

    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b"IHDR", ihdr_data)

    # IDAT
    compressed = zlib.compress(raw)
    idat = chunk(b"IDAT", compressed)

    # IEND
    iend = chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for size in [192, 512]:
        png = create_png(size, size)
        path = os.path.join(OUT_DIR, f"icon-{size}.png")
        with open(path, "wb") as f:
            f.write(png)
        print(f"  ✓ {path}  ({len(png):,} bytes)")

    print("\nDone. Icons generated.")


if __name__ == "__main__":
    main()
