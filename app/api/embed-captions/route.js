import { NextResponse } from "next/server";
import { join } from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";

const execFileAsync = promisify(execFile);

function convertToASS(transcription) {
  // Using default video dimensions that work well with most videos
  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  // Convert each caption
  for (let i = 0; i < transcription.length; i++) {
    const caption = transcription[i];
    const start = formatASSTime(caption.start);
    // End time is either the start of next caption or current + 2 seconds
    const end = formatASSTime(
      i < transcription.length - 1
        ? transcription[i + 1].start
        : caption.start + 2
    );

    // Split text into words and apply styling
    const words = caption.text.split(" ");
    const styledText = words
      .map((word, idx) => {
        if ((idx + 1) % 3 === 0) {
          // Convert to ASS color format (BGR)
          return `{\\c&H0000FF&}${word}{\\c&HFFFFFF&}`; // Blue color
        }
        return word;
      })
      .join(" ");

    assContent += `Dialogue: 0,${start},${end},Default,,0,0,0,,${styledText}\n`;
  }

  return assContent;
}

function formatASSTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}.${padZero(
    cs
  )}`;
}

function padZero(num, length = 2) {
  return num.toString().padStart(length, "0");
}

export async function POST(request) {
  const { videoSrc, captions, captionStyle, customText } = await request.json();

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
    const assPath = join(publicDir, `caption_${Date.now()}.ass`);

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

    // Generate and write ASS file
    const assContent = convertToASS(captions);
    await fs.writeFile(assPath, assContent, "utf8");

    // Escape file paths for Windows
    const escapedInputPath = inputVideoPath.replace(/\\/g, "/");
    const escapedAssPath = assPath.replace(/\\/g, "/");
    const escapedOutputPath = outputPath.replace(/\\/g, "/");

    // Create filter complex string
    let filters = [];

    // Add ASS filter with original_size set to match video resolution
    filters.push(`ass='${escapedAssPath}:original_size=202x360'`);

    // Add custom text if present (commented out for debugging)
    // if (customText) {
    //   const escapedText = customText.text.replace(/'/g, "'\\''");
    //   filters.push(
    //     `drawtext=text='${escapedText}':fontsize=${customText.fontSize}:` +
    //       `fontcolor=${customText.fill}:x=${customText.left}:y=${customText.top}`
    //   );
    // }

    // Combine all filters
    const filterComplex = filters.join(" ");

    const args = [
      "-i",
      escapedInputPath,
      "-vf",
      filterComplex,
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "-y",
      escapedOutputPath,
    ];

    // Log the FFmpeg command
    console.log("FFmpeg command:", ffmpegStatic, args.join(" "));

    const { stdout, stderr } = await execFileAsync(ffmpegStatic, args);
    console.log("FFmpeg stdout:", stdout);
    console.log("FFmpeg stderr:", stderr);

    // Clean up the temporary ASS file
    try {
      await fs.unlink(assPath);
    } catch (error) {
      console.warn("Warning: Could not delete temporary ASS file:", error);
    }

    return NextResponse.json({
      embeddedVideoPath: `/${outputFilename}`,
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
