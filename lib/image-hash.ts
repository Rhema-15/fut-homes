// "Fingerprints" photos so a reposted room can be spotted: the same video
// shared again gives near-identical still shots, even after WhatsApp
// re-compresses it. dHash: shrink to 9x8 grey, compare neighbouring pixels.

export async function photoHash(url: string): Promise<bigint | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 9, 8);
    const px = ctx.getImageData(0, 0, 9, 8).data;
    let hash = BigInt(0);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const i = (y * 9 + x) * 4;
        const left = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
        const right = px[i + 4] * 0.3 + px[i + 5] * 0.59 + px[i + 6] * 0.11;
        hash = (hash << BigInt(1)) | (left > right ? BigInt(1) : BigInt(0));
      }
    }
    return hash;
  } catch {
    return null;
  }
}

function distance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & BigInt(1));
    x >>= BigInt(1);
  }
  return n;
}

// How many of the new photos have a near-twin among the old ones.
export function matchingShots(fresh: bigint[], old: bigint[], maxDistance = 8): number {
  return fresh.filter((f) => old.some((o) => distance(f, o) <= maxDistance)).length;
}
