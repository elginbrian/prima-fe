import { ActionItem, ActionPriority, ActionSource } from "@/types";

export interface ActionRowProps {
  item: ActionItem;
}

export interface ActionFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sourceFilter: ActionSource | "All";
  setSourceFilter: (val: ActionSource | "All") => void;
  priorityFilter: ActionPriority | "All";
  setPriorityFilter: (val: ActionPriority | "All") => void;
  onExport?: () => void;
}
