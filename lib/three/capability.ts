/**
 * Decides whether this device should run the 3-D view at all.
 *
 * The requirement is a 2-D fallback that happens automatically on devices that
 * can't cope — so rather than sniffing user agents (which lies), we ask three
 * questions the browser can actually answer: does WebGL exist, is the GPU a
 * known software rasteriser, and does the device report enough cores/memory.
 * A live FPS watchdog (see `FpsWatchdog`) catches whatever slips through.
 */

export type Capability3D = 'ok' | 'reduced' | 'unsupported';

export interface CapabilityReport {
  level: Capability3D;
  reason: string;
  webgl2: boolean;
  renderer?: string;
}

let cached: CapabilityReport | null = null;

export function detect3DCapability(): CapabilityReport {
  if (cached) return cached;

  if (typeof window === 'undefined') {
    return { level: 'unsupported', reason: 'ไม่มีเบราว์เซอร์', webgl2: false };
  }

  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const gl = gl2 ?? (canvas.getContext('webgl') as WebGLRenderingContext | null);

  if (!gl) {
    cached = {
      level: 'unsupported',
      reason: 'เบราว์เซอร์นี้ไม่รองรับ WebGL',
      webgl2: false,
    };
    return cached;
  }

  let renderer: string | undefined;
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch {
    /* blocked by privacy settings — fine, we fall back to the other signals */
  }

  const software = renderer
    ? /swiftshader|software|llvmpipe|microsoft basic render/i.test(renderer)
    : false;

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  // Release the context immediately; some browsers allow only ~16 at once.
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  if (software) {
    cached = {
      level: 'unsupported',
      reason: 'อุปกรณ์นี้เรนเดอร์ 3D ด้วยซอฟต์แวร์ ซึ่งจะช้ามาก',
      webgl2: Boolean(gl2),
      renderer,
    };
  } else if (cores <= 2 || memory <= 1) {
    cached = {
      level: 'reduced',
      reason: 'อุปกรณ์มีทรัพยากรจำกัด จะลดคุณภาพภาพลงเพื่อความลื่นไหล',
      webgl2: Boolean(gl2),
      renderer,
    };
  } else {
    cached = { level: 'ok', reason: '', webgl2: Boolean(gl2), renderer };
  }

  return cached;
}

/** Device pixel ratio budget for the 3-D canvas. */
export function dprRange(level: Capability3D): [number, number] {
  if (level === 'reduced') return [1, 1.25];
  return [1, Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)];
}

/**
 * Watches real frame times and reports a sustained slowdown.
 * Used to drop back to 2-D on a device that passed the static checks but still
 * can't hold a usable frame rate.
 */
export class FpsWatchdog {
  private frames = 0;
  private start = 0;
  private slowWindows = 0;
  private done = false;

  constructor(
    private readonly onSlow: (fps: number) => void,
    private readonly threshold = 24,
    private readonly windowsBeforeGivingUp = 3,
  ) {}

  tick(now: number): void {
    if (this.done) return;
    if (!this.start) {
      this.start = now;
      return;
    }
    this.frames++;
    const elapsed = now - this.start;
    if (elapsed < 1000) return;

    const fps = (this.frames * 1000) / elapsed;
    this.frames = 0;
    this.start = now;

    if (fps < this.threshold) {
      this.slowWindows++;
      if (this.slowWindows >= this.windowsBeforeGivingUp) {
        this.done = true;
        this.onSlow(fps);
      }
    } else {
      this.slowWindows = 0;
    }
  }
}
