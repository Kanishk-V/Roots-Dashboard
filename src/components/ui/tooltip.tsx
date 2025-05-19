"use client"

import { Tooltip as ChakraTooltip, TooltipProps } from "@chakra-ui/react"
import * as React from "react"

/**
 * Tooltip - A wrapper around Chakra UI's Tooltip component.
 *
 * Usage:
 *   <Tooltip label="Hello!">
 *     <Button>Hover me</Button>
 *   </Tooltip>
 */
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, ref) {
    return <ChakraTooltip ref={ref} {...props} />;
  }
);
