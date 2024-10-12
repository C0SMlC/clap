"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, VStack, Button, useToast, HStack } from "@chakra-ui/react";
import VideoPlayer from "../components/VideoPlayer";
import Sidebar from "../components/Sidebar";
import EditVideo from "../components/EditVideo";
import VideoTimeline from "../components/VideoTimeline";

const VideoEditor = () => {
  const [activeTab, setActiveTab] = useState("edit");
  const [videoSrc, setVideoSrc] = useState("Before.mp4");
  const [caption, setCaption] = useState(null);
  const [captionStyle, setCaptionStyle] = useState({
    font: "Montserrat",
    weight: "Black",
    color: "#fafafa",
    position: 0,
    size: 8,
    display: "Displayed",
    animation: "No Animation",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [captionFilePath, setCaptionFilePath] = useState(
    "./short_transcription_file.json"
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAddingCaption, setIsAddingCaption] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const timelineHeight = 80;

  const toast = useToast();

  const updateCaptionStyle = (key, value) => {
    setCaptionStyle((prevStyle) => ({
      ...prevStyle,
      [key]: value,
    }));
  };

  const fetchCaptions = async () => {
    try {
      const response = await fetch(captionFilePath);
      if (!response.ok) throw new Error("Failed to fetch captions");

      const data = await response.json();
      const formattedCaptions = data.transcription.map((item) => ({
        start: item.startInSeconds,
        text: item.text,
      }));

      setCaption(formattedCaptions);
    } catch (error) {
      console.error("Error fetching captions:", error);
      toast({
        title: "Error fetching captions",
        description: error.message || "Failed to load captions.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  const handleEmbedCaptions = async () => {
    setIsProcessing(true);
    try {
      const customTextData = videoRef.current.getCustomTextData();
      const response = await fetch("/api/embed-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoSrc,
          captions: caption,
          captionStyle,
          customText: customTextData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process video");
      }

      const data = await response.json();
      setDownloadLink(data.embeddedVideoPath);
      toast({
        title: "Video processed successfully",
        description:
          "Your video with embedded captions and custom text is ready for download.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error embedding captions and custom text:", error);
      toast({
        title: "Error processing video",
        description:
          error.message ||
          "There was an error embedding the captions and custom text. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchCaptions();
  }, [captionFilePath]);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((newDuration) => {
    setDuration(newDuration);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Draw video duration rectangle
    ctx.fillStyle = "#2C3E50"; // Dark blue color for video rectangle
    ctx.fillRect(0, 0, width, height);

    // Draw time markers
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px Arial";
    const totalSeconds = Math.floor(duration);
    const step = width / (totalSeconds || 1);
    for (let i = 0; i <= totalSeconds; i += 2) {
      const x = i * step;
      ctx.fillText(formatTime(i), x, height * 0.5);

      // Draw tick marks
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.stroke();
    }

    // Draw playhead (vertical line)
    if (duration > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [currentTime, duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTimelineClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = (x / canvas.width) * (duration || 1);
    if (videoRef.current) {
      videoRef.current.currentTime = clickedTime;
    }
  };

  const handleAddCaption = () => {
    setIsAddingCaption(true);
  };

  const handleSaveCaption = () => {
    setIsAddingCaption(false);
    toast({
      title: "Caption saved",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "edit":
        return (
          <EditVideo
            captionStyle={captionStyle}
            updateCaptionStyle={updateCaptionStyle}
          />
        );
      case "caption":
        return (
          <VStack spacing={4} align="stretch">
            <Button onClick={handleAddCaption}>Add New Caption</Button>
            {isAddingCaption && (
              <Button onClick={handleSaveCaption}>Save Caption</Button>
            )}
          </VStack>
        );
      case "export":
        return (
          <VStack spacing={4} align="stretch">
            <Button
              colorScheme="blue"
              onClick={handleEmbedCaptions}
              isLoading={isProcessing}
              loadingText="Processing..."
            >
              Embed Captions
            </Button>
            {downloadLink && (
              <Button as="a" href={downloadLink} download colorScheme="green">
                Download Processed Video
              </Button>
            )}
          </VStack>
        );
      default:
        return null;
    }
  };

  return (
    <Flex bg="gray.900" minH="100vh" color="white">
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      <Flex flex={1}>
        <Box minWidth="300px" p={4} bg="gray.800">
          {renderActiveTab()}
        </Box>
        <Box flex={1} p={4}>
          <VideoPlayer
            videoSrc={videoSrc}
            caption={caption}
            captionStyle={captionStyle}
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            isAddingCaption={isAddingCaption}
          />
          <Box
            mt={4}
            width="100%"
            height={`${timelineHeight}px`}
            position="relative"
          >
            <VideoTimeline
              duration={duration}
              currentTime={currentTime}
              onSeek={(time) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = time;
                }
              }}
              videoSrc={videoSrc}
              onExport={handleEmbedCaptions}
            />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default VideoEditor;
