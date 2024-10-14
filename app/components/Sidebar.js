"use client";

import React from "react";
import { VStack, Button, Icon, Text, Box } from "@chakra-ui/react";
import { FiEdit, FiMessageSquare, FiShare2 } from "react-icons/fi";

function Sidebar({ setActiveTab, activeTab }) {
  const menuItems = [
    { name: "Edit Video", icon: FiEdit, tab: "edit" },
    { name: "Add Caption", icon: FiMessageSquare, tab: "caption" },
    { name: "Export", icon: FiShare2, tab: "export" },
  ];

  return (
    <Box bg="gray.800" w="64" p={4}>
      <VStack spacing={4} align="stretch">
        {menuItems.map((item) => (
          <Button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            variant={activeTab === item.tab ? "solid" : "ghost"}
            colorScheme="blue"
            justifyContent="flex-start"
            leftIcon={<Icon as={item.icon} />}
            size="lg"
          >
            {item.name}
          </Button>
        ))}
      </VStack>
    </Box>
  );
}

export default Sidebar;
