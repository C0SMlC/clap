/* eslint-disable react/display-name */
"use client";
import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Box } from "@chakra-ui/react";
import { fabric } from "fabric";
import Caption from "./Captions";

const VideoPlayer = forwardRef(
  (
    {
      videoSrc,
      caption,
      captionStyle,
      onTimeUpdate,
      onDurationChange,
      isAddingCaption,
    },
    ref
  ) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const [currentCaption, setCurrentCaption] = useState("");
    const [customText, setCustomText] = useState(null);

    useEffect(() => {
      if (isAddingCaption && canvasRef.current && videoRef.current) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
          width: 900,
          height: 900,
        });

        const text = new fabric.IText("Edit this texthkkkkkkkkkkkk", {
          left: 900 / 2,
          top: 900 / 2,
          fontFamily: "Arial",
          fill: "#ffffff",
          fontSize: 30,
          originX: "center",
          originY: "center",
        });

        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);

        console.log(videoHeight, videoWidth);

        // Set canvas size to match video dimensions
        fabricCanvasRef.current.setDimensions({
          width: 900,
          height: 900,
        });

        // Ensure text stays within canvas bounds
        text.on("moving", function () {
          text.setCoords();
          if (text.left < 0) {
            text.left = 0;
          }
          if (text.top < 0) {
            text.top = 0;
          }
          // if (text.getScaledWidth() + text.left > videoWidth) {
          //   text.left = videoWidth - text.getScaledWidth();
          // }
          // if (text.getScaledHeight() + text.top > videoHeight) {
          //   text.top = videoHeight - text.getScaledHeight();
          // }
        });

        setCustomText(text);
      }

      return () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        }
      };
    }, [isAddingCaption]);

    // Function to get custom text data
    const getCustomTextData = () => {
      if (customText) {
        return {
          text: customText.text,
          left: customText.left,
          top: customText.top,
          fontFamily: customText.fontFamily,
          fontSize: customText.fontSize,
          fill: customText.fill,
        };
      }
      return null;
    };

    useImperativeHandle(ref, () => ({
      get currentTime() {
        return videoRef.current?.currentTime || 0;
      },
      set currentTime(time) {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      get duration() {
        return videoRef.current?.duration || 0;
      },
      play() {
        videoRef.current?.play();
      },
      pause() {
        videoRef.current?.pause();
      },
      getCustomTextData,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const updateCaptions = () => {
        const currentTime = video.currentTime;
        const activeCaption = caption.find(
          (cap) => currentTime >= cap.start && currentTime < cap.start + 1
        );
        setCurrentCaption(activeCaption ? activeCaption.text : "");
        onTimeUpdate(currentTime);
      };

      const handleDurationChange = () => {
        onDurationChange(video.duration);
      };

      video.addEventListener("timeupdate", updateCaptions);
      video.addEventListener("loadedmetadata", handleDurationChange);

      return () => {
        video.removeEventListener("timeupdate", updateCaptions);
        video.removeEventListener("loadedmetadata", handleDurationChange);
      };
    }, [caption, onTimeUpdate, onDurationChange]);

    // useEffect(() => {
    //   if (isAddingCaption && canvasRef.current) {
    //     fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
    //       width: videoRef.current.videoWidth,
    //       height: videoRef.current.videoHeight,
    //     });

    //     const text = new fabric.IText("Edit this text", {
    //       left: 50,
    //       top: 50,
    //       fontFamily: "Arial",
    //       fill: "#ffffff",
    //       fontSize: 30,
    //     });

    //     fabricCanvasRef.current.add(text);
    //     fabricCanvasRef.current.setActiveObject(text);
    //   }

    //   return () => {
    //     if (fabricCanvasRef.current) {
    //       fabricCanvasRef.current.dispose();
    //       fabricCanvasRef.current = null;
    //     }
    //   };
    // }, [isAddingCaption]);

    return (
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        padding={4}
      >
        <Box width={["100%", "80%", "60%", "40%"]} maxWidth="300px">
          <Box
            width="100%"
            height="0"
            paddingBottom="177.78%"
            position="relative"
            overflow="hidden"
            borderRadius="md"
            boxShadow="lg"
          >
            <video
              ref={videoRef}
              controls
              src={videoSrc}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            >
              Your browser does not support the video tag.
            </video>
            {<Caption caption={currentCaption} style={captionStyle} />}
            {isAddingCaption && (
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "auto",
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  }
);

export default VideoPlayer;
