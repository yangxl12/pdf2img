import { FileImage } from "lucide-vue-next";
import type { Component } from "vue";

export interface ToolDefinition {
  id: string;
  titleKey: string;
  icon: Component;
  route: string;
  available: boolean;
}

export const tools: ToolDefinition[] = [
  {
    id: "pdf-to-image",
    titleKey: "pdf.title",
    icon: FileImage,
    route: "/",
    available: true
  }
];
