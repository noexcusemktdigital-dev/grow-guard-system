import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  // Load ffmpeg.wasm from CDN
  await ffmpeg.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export interface VideoGeneratorOptions {
  frameDurationSeconds?: number; // seconds per frame (default 3)
  fps?: number; // output fps (default 24)
  transitionFrames?: number; // number of frames for crossfade (default 12)
  onProgress?: (message: string) => void;
}

export async function generateVideoFromFrames(
  frameUrls: string[],
  options: VideoGeneratorOptions = {}
): Promise<Blob> {
  const {
    frameDurationSeconds = 3,
    fps = 24,
    transitionFrames = 12,
    onProgress,
  } = options;

  if (!frameUrls.length) throw new Error("No frames provided");

  onProgress?.("Carregando ffmpeg...");
  const ffmpeg = await getFFmpeg();

  // Download and write each frame to ffmpeg virtual filesystem
  for (let i = 0; i < frameUrls.length; i++) {
    onProgress?.(`Baixando frame ${i + 1}/${frameUrls.length}...`);
    const data = await fetchFile(frameUrls[i]);
    await ffmpeg.writeFile(`frame-${i}.png`, data);
  }

  onProgress?.("Montando vídeo com transições...");

  // Build a filter complex for crossfade transitions between frames
  const totalFramesPerImage = frameDurationSeconds * fps;

  if (frameUrls.length === 1) {
    // Single frame: just create a simple video
    await ffmpeg.exec([
      "-loop", "1",
      "-i", "frame-0.png",
      "-c:v", "libx264",
      "-t", String(frameDurationSeconds),
      "-pix_fmt", "yuv420p",
      "-vf", `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`,
      "-r", String(fps),
      "-y", "output.mp4",
    ]);
  } else {
    // Multiple frames: create individual clips then concat with crossfade
    const inputArgs: string[] = [];
    const filterParts: string[] = [];

    // Create input for each frame as a looped image
    for (let i = 0; i < frameUrls.length; i++) {
      inputArgs.push("-loop", "1", "-t", String(frameDurationSeconds + 1), "-i", `frame-${i}.png`);
    }

    // Scale all inputs
    for (let i = 0; i < frameUrls.length; i++) {
      filterParts.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}]`);
    }

    // Chain xfade transitions
    let lastLabel = "v0";
    for (let i = 1; i < frameUrls.length; i++) {
      const offset = i * frameDurationSeconds - (i * transitionFrames / fps);
      const outLabel = i === frameUrls.length - 1 ? "vout" : `xf${i}`;
      filterParts.push(
        `[${lastLabel}][v${i}]xfade=transition=fade:duration=${transitionFrames / fps}:offset=${Math.max(0, offset)}[${outLabel}]`
      );
      lastLabel = outLabel;
    }

    const filterComplex = filterParts.join(";");

    await ffmpeg.exec([
      ...inputArgs,
      "-filter_complex", filterComplex,
      "-map", "[vout]",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-preset", "fast",
      "-crf", "23",
      "-y", "output.mp4",
    ]);
  }

  onProgress?.("Finalizando vídeo...");

  const outputData = await ffmpeg.readFile("output.mp4");
  const uint8 = outputData instanceof Uint8Array ? outputData : new TextEncoder().encode(outputData as string);
  const blob = new Blob([new Uint8Array(uint8)], { type: "video/mp4" });

  // Cleanup virtual filesystem
  for (let i = 0; i < frameUrls.length; i++) {
    try { await ffmpeg.deleteFile(`frame-${i}.png`); } catch {}
  }
  try { await ffmpeg.deleteFile("output.mp4"); } catch {}

  return blob;
}
