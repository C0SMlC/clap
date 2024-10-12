import React, { useEffect, useRef, useState } from "react";
import { Box, Flex, VStack, Text, IconButton } from "@chakra-ui/react";
import {
  AiOutlineScissor,
  AiOutlineVideoCamera,
  AiOutlineDelete,
  AiOutlineDownload,
} from "react-icons/ai";

const VideoTimeline = ({
  duration,
  currentTime,
  onSeek,
  videoSrc,
  onExport,
}) => {
  const canvasRef = useRef(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [videoError, setVideoError] = useState(false);
  const timelineHeight = 120;
  const thumbnailWidth = 160;
  const thumbnailHeight = 90;
  const sidebarWidth = 60;

  useEffect(() => {
    const generateThumbnails = async () => {
      setVideoError(false); // Reset the error state

      const video = document.createElement("video");
      video.src = videoSrc;
      video.preload = "metadata";

      // Error handling for video load
      video.onerror = (err) => {
        console.error("Error loading video:", err);
        setVideoError(true);
      };

      try {
        // Wait for the video to load metadata
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject; // Handle video load errors
        });

        const thumbnailCount = Math.ceil(duration / 2); // Thumbnails every 2 seconds
        const newThumbnails = [];

        for (let i = 0; i < thumbnailCount; i++) {
          const time = i * 3;
          video.currentTime = time;

          await new Promise((resolve, reject) => {
            video.onseeked = resolve;
            video.onerror = reject; // Handle seek errors
          });

          const canvas = document.createElement("canvas");
          canvas.width = thumbnailWidth;
          canvas.height = thumbnailHeight;

          const ctx = canvas.getContext("2d");
          try {
            ctx.drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);
            newThumbnails.push({
              time,
              url: canvas.toDataURL(),
            });
          } catch (drawError) {
            console.error("Error generating thumbnail", drawError);
          }
        }

        setThumbnails(newThumbnails);
      } catch (err) {
        console.error("Thumbnail generation failed", err);
        setVideoError(true); // Handle the error state
      }
    };

    // Only generate thumbnails if there's no video error
    if (videoSrc) {
      generateThumbnails();
    }
  }, [videoSrc, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || videoError) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width - sidebarWidth;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, height);

    // Draw background
    ctx.fillStyle = "#1A202C";
    ctx.fillRect(sidebarWidth, 0, width, height);

    // Draw thumbnails
    thumbnails.forEach((thumbnail) => {
      const img = new Image();
      img.src = thumbnail.url;
      const x = sidebarWidth + (thumbnail.time / duration) * width;
      img.onload = () => {
        ctx.drawImage(img, x, 0, thumbnailWidth, thumbnailHeight);
      };
    });

    // Draw time markers
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px Arial";
    for (let i = 0; i <= duration; i += 3) {
      const x = sidebarWidth + (i / duration) * width;
      ctx.fillText(formatTime(i), x, height - 5);
    }

    // Draw playhead
    const playheadX = sidebarWidth + (currentTime / duration) * width;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.strokeStyle = "#3182CE";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw sidebar
    ctx.fillStyle = "#2D3748";
    ctx.fillRect(0, 0, sidebarWidth, height);
  }, [currentTime, duration, thumbnails, videoError]);

  const handleTimelineClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - sidebarWidth;
    const clickedTime = (x / (canvas.width - sidebarWidth)) * duration;
    onSeek(clickedTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Box width="100%" height={`${timelineHeight}px`} position="relative">
      {videoError ? (
        <Box color="red">Error loading video for thumbnails</Box>
      ) : (
        <Flex>
          <VStack
            width={`${sidebarWidth}px`}
            height={`${timelineHeight}px`}
            bg="gray.700"
            justifyContent="space-around"
            alignItems="center"
            padding="8px 0"
          >
            <IconButton
              aria-label="Video"
              icon={<AiOutlineVideoCamera />}
              size="sm"
              variant="ghost"
              color="white"
            />
            <IconButton
              aria-label="Cut"
              icon={<AiOutlineScissor />}
              size="sm"
              variant="ghost"
              color="white"
            />
            <IconButton
              aria-label="Delete"
              icon={<AiOutlineDelete />}
              size="sm"
              variant="ghost"
              color="white"
            />
            <IconButton
              aria-label="Export"
              icon={<AiOutlineDownload />}
              size="sm"
              variant="ghost"
              color="white"
              onClick={onExport}
            />
          </VStack>
          <Box position="relative" width={`calc(100% - ${sidebarWidth}px)`}>
            <canvas
              ref={canvasRef}
              width={1000}
              height={timelineHeight}
              style={{
                cursor: "pointer",
                width: "100%",
                height: "100%",
              }}
              onClick={handleTimelineClick}
            />
            <Box
              position="absolute"
              top={0}
              right={0}
              bg="gray.800"
              color="white"
              padding="8px"
              borderRadius="md"
            ></Box>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default VideoTimeline;
