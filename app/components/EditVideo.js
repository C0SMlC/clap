"use client";

import React from "react";
import {
  HStack,
  Text,
  Button,
  Select,
  Slider,
  SliderTrack,
  VStack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";

function EditVideo({ captionStyle, updateCaptionStyle }) {
  return (
    <VStack spacing={4} align="stretch" flex={1}>
      <Text fontWeight="bold">Captions</Text>
      <Select
        placeholder="Font"
        bg="gray.700"
        value={captionStyle.font}
        onChange={(e) => updateCaptionStyle("font", e.target.value)}
      >
        <option>Montserrat</option>
      </Select>
      <Select
        placeholder="Weight"
        bg="gray.700"
        value={captionStyle.weight}
        onChange={(e) => updateCaptionStyle("weight", e.target.value)}
      >
        <option>Black</option>
      </Select>
      <HStack>
        <Button>AA</Button>
        <Button>Aa</Button>
      </HStack>
      <Text fontWeight="bold">Fill</Text>
      <HStack>
        {[
          "#fafafa",
          "#000000",
          "#d50000",
          "#ffd600",
          "#2e7d32",
          "#0091ea",
          "#6200ea",
        ].map((color) => (
          <Button
            key={color}
            bg={color}
            w={8}
            h={8}
            borderRadius="full"
            onClick={() => updateCaptionStyle("color", color)}
          />
        ))}
      </HStack>
      <Text fontWeight="bold">Position</Text>
      <Slider
        value={captionStyle.position}
        onChange={(value) => updateCaptionStyle("position", value)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <Text fontWeight="bold">Size</Text>
      <Slider
        min={1}
        max={20}
        step={1}
        value={captionStyle.size}
        onChange={(value) => updateCaptionStyle("size", value)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <Text fontSize="sm">{captionStyle.size}</Text>
      <Text fontWeight="bold">Display</Text>
      <HStack>
        {["Displayed", "Lines", "Words"].map((option) => (
          <Button
            key={option}
            variant={captionStyle.display === option ? "solid" : "outline"}
            color="white"
            onClick={() => updateCaptionStyle("display", option)}
          >
            {option}
          </Button>
        ))}
      </HStack>
      <Text fontWeight="bold" color="white">
        Animation
      </Text>
      <HStack>
        {["No Animation", "Spring"].map((option) => (
          <Button
            key={option}
            variant={captionStyle.animation === option ? "solid" : "outline"}
            color="white"
            onClick={() => updateCaptionStyle("animation", option)}
          >
            {option}
          </Button>
        ))}
      </HStack>
    </VStack>
  );
}

export default EditVideo;
