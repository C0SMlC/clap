import { NextResponse } from "next/server";
import { join } from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export async function POST(request) {
  const { videoSrc, captions, captionStyle } = await request.json();

  if (!videoSrc || !captions) {
    return NextResponse.json(
      { message: "Missing videoSrc or captions" },
      { status: 400 }
    );
  }

  try {
    const publicDir = join(process.cwd(), "public");
    const inputVideoPath = join(publicDir, videoSrc);
    const outputFilename = `output_${Date.now()}.mp4`;
    const outputPath = join(publicDir, outputFilename);
    const captionsPath = join(publicDir, `caption_${Date.now()}.srt`);

    // Check if input video exists
    try {
      await fs.access(inputVideoPath);
    } catch (error) {
      console.error("Input video file not found:", inputVideoPath);
      return NextResponse.json(
        { message: "Input video file not found", error: error.message },
        { status: 400 }
      );
    }

    // Write captions to SRT file
    const srtContent = formatCaptionsToSRT(captions);
    await fs.writeFile(captionsPath, srtContent);

    console.log("SRT file written to:", captionsPath);

    // Log the contents of the SRT file for debugging
    const srtFileContents = await fs.readFile(captionsPath, "utf-8");

    console.log("captionStyle.size", captionStyle.size);
    console.log("captionStyle.color", captionStyle.color);

    const args = [
      "-i",
      inputVideoPath,
      "-vf",
      `subtitles=public/caption_1728285071762.srt:force_style='Fontname=${
        captionStyle.font
      },Fontsize=${captionStyle.size},PrimaryColour=${convertColorToFFmpeg(
        captionStyle.color
      )},Spacing=0.2,Outline=0,Shadow=0.75'`,
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "-y",
      outputPath,
    ];

    console.log("FFmpeg command:", ffmpegStatic, args.join(" "));

    const { stdout, stderr } = await execFileAsync(ffmpegStatic, args);
    console.log("FFmpeg stdout:", stdout);
    console.log("FFmpeg stderr:", stderr);

    return NextResponse.json({
      embeddedVideoPath: `/${outputFilename}`,
      captionsPath: `/${captionsPath.split("\\").pop()}`,
    });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      {
        message: "Error processing video",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

function convertColorToFFmpeg(hexColor) {
  // Remove the '#' if present
  hexColor = hexColor.replace("#", "");

  // Ensure the color is in 6-digit format
  if (hexColor.length === 3) {
    hexColor = hexColor
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Split into RGB components
  const r = hexColor.substr(0, 2);
  const g = hexColor.substr(2, 2);
  const b = hexColor.substr(4, 2);

  // Return in FFmpeg format
  return `&H${b}${g}${r}&`;
}

function formatCaptionsToSRT(transcription) {
  let srt = "";
  for (let i = 0; i < transcription.length; i++) {
    const caption = transcription[i];
    const start = formatTime(caption.start);
    let end;

    if (i < transcription.length - 1) {
      // For all but the last caption, use the start time of the next caption as the end time
      end = formatTime(transcription[i + 1].start);
    } else {
      // For the last caption, add a fixed duration (e.g., 2 seconds)
      end = formatTime(caption.start + 2);
    }

    srt += `${i + 1}\n${start} --> ${end}\n${caption.text}\n\n`;
  }
  return srt.trim();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)},${padZero(
    ms,
    3
  )}`;
}

function padZero(num, length = 2) {
  return num.toString().padStart(length, "0");
}
