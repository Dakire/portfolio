// Aide des tests de lisibilité : SVG -> pixels (resvg) -> texte décodé par deux décodeurs indépendants (jsQR et ZXing).
import jsQR from 'jsqr';
import { Resvg } from '@resvg/resvg-js';
import { readBarcodes } from 'zxing-wasm/reader';

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Rastérise un SVG sur fond blanc (un QR code à fond transparent est posé sur du blanc, comme sur une page). */
export function rasterize(svg: string, width = 720): Raster {
  const image = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: '#ffffff',
  }).render();
  return { data: new Uint8ClampedArray(image.pixels), width: image.width, height: image.height };
}

export function pngDataUrl(svg: string, width = 128): string {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

export function decodeJsQr(raster: Raster): string | null {
  const result = jsQR(raster.data, raster.width, raster.height, {
    inversionAttempts: 'dontInvert',
  });
  return result ? result.data : null;
}

export async function decodeZxing(raster: Raster): Promise<string | null> {
  const results = await readBarcodes(
    {
      data: raster.data,
      width: raster.width,
      height: raster.height,
      colorSpace: 'srgb',
    } as ImageData,
    { formats: ['QRCode'], tryHarder: true, maxNumberOfSymbols: 1 },
  );
  return results[0]?.isValid ? results[0].text : null;
}
