import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import {
  AiOutlineScissor,
  AiOutlineVideoCamera,
  AiOutlineDelete,
} from "react-icons/ai";

const VideoTimeline = ({
  duration,
  currentTime,
  onSeek,
  videoSrc,
  onExport,
}) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [videoError, setVideoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const generatedRef = useRef(false);

  const thumbnailWidth = 160;
  const thumbnailHeight = 90;
  const timelineHeight = 160;
  const sidebarWidth = 80;

  const generateThumbnails = useCallback(async () => {
    if (generatedRef.current) return;
    console.log("Starting thumbnail generation");
    setVideoError(false);
    setLoading(true);

    const video = document.createElement("video");

    // Ensure the video source URL is correct
    const fullVideoSrc = videoSrc.startsWith("http")
      ? videoSrc
      : `${window.location.origin}/${videoSrc}`;
    console.log("Full video source URL:", fullVideoSrc);

    video.src = fullVideoSrc;
    video.crossOrigin = "anonymous"; // Add this line to handle CORS issues
    video.preload = "auto";

    video.onerror = (err) => {
      console.error("Error loading video:", err);
      setVideoError(true);
    };

    try {
      console.log("Waiting for video to load");
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });
      console.log("Video loaded successfully");

      const thumbnailCount = Math.ceil(duration / 2);
      console.log(`Generating ${thumbnailCount} thumbnails`);
      const newThumbnails = [];

      for (let i = 0; i < thumbnailCount; i++) {
        const time = i * 2;
        console.log(`Generating thumbnail for time: ${time}`);

        await new Promise((resolve) => {
          video.currentTime = time;
          video.onseeked = () => resolve();
        });

        const canvas = document.createElement("canvas");
        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);
        const thumbnailUrl = canvas.toDataURL();

        console.log(`Thumbnail generated for time ${time}`);
        newThumbnails.push({
          time,
          url: thumbnailUrl,
        });
      }

      console.log(`Total thumbnails generated: ${newThumbnails.length}`);
      setThumbnails(newThumbnails);
      generatedRef.current = true;
    } catch (err) {
      console.error("Thumbnail generation failed", err);
      setVideoError(true);
    } finally {
      setLoading(false);
      console.log("Thumbnail generation process completed");
    }
  }, [videoSrc, duration]);

  useEffect(() => {
    if (videoSrc && duration > 0 && !generatedRef.current) {
      console.log(`Initiating thumbnail generation for video: ${videoSrc}`);
      generateThumbnails();
    }
  }, [videoSrc, duration, generateThumbnails]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTimelineClick = (time) => {
    onSeek(time);
  };

  return (
    <Box
      width="100vw"
      height={`${timelineHeight}px`}
      position="relative"
      p={"20px"}
      bg="gray.900"
    >
      {loading ? (
        <Box color="white" p={4}>
          Generating thumbnails...
        </Box>
      ) : videoError ? (
        <Box color="red.500" p={4}>
          Error loading video for thumbnails
        </Box>
      ) : (
        <Flex>
          <Flex
            width={`${sidebarWidth}px`}
            height={`${timelineHeight}px`}
            bg="gray.800"
            flexDirection="column"
            justifyContent="space-around"
            alignItems="center"
            padding="12px 0"
          >
            {[
              { icon: AiOutlineVideoCamera, label: "Video" },
              { icon: AiOutlineScissor, label: "Cut" },
              { icon: AiOutlineDelete, label: "Delete" },
            ].map((item, index) => (
              <IconButton
                key={index}
                aria-label={item.label}
                icon={<item.icon size="24px" />}
                size="lg"
                variant="ghost"
                color="white"
                onClick={item.onClick}
                _hover={{ bg: "gray.700" }}
              />
            ))}
          </Flex>
          <Box
            width={`calc(100% - ${sidebarWidth}px)`}
            overflowX="auto"
            overflowY="hidden"
            css={{
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
              },
            }}
          >
            <Flex>
              {thumbnails.length > 0 ? (
                thumbnails.map((thumbnail, index) => (
                  <Box
                    key={index}
                    position="relative"
                    minWidth={`${thumbnailWidth}px`}
                    height={`${timelineHeight}px`}
                    onClick={() => handleTimelineClick(thumbnail.time)}
                    cursor="pointer"
                    _hover={{ opacity: 0.8 }}
                  >
                    <Box
                      backgroundImage={`url(${thumbnail.url})`}
                      backgroundSize="cover"
                      width={`${thumbnailWidth}px`}
                      height={`${thumbnailHeight}px`}
                      border={
                        currentTime >= thumbnail.time &&
                        currentTime < thumbnail.time + 2
                          ? "2px solid"
                          : "none"
                      }
                      borderColor="blue.500"
                    />
                    <Text fontSize="xs" color="white" textAlign="center" mt={1}>
                      {formatTime(thumbnail.time)}
                    </Text>
                  </Box>
                ))
              ) : (
                <Box color="white" p={4}>
                  No thumbnails generated. Check console for logs.
                </Box>
              )}
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default VideoTimeline;
