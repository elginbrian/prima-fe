"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, X, Plus } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  allowClear?: boolean;
  allowCustomValue?: boolean;
  customValueLabel?: (query: string) => string;
  size?: "sm" | "md";
  className?: string;
  buttonClassName?: string;
  id?: string;
  ariaLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Ketik untuk mencari...",
  emptyText = "Opsi tidak ditemukan",
  disabled = false,
  allowClear = false,
  allowCustomValue = false,
  customValueLabel,
  size = "md",
  className = "",
  buttonClassName = "",
  id,
  ariaLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.label} ${opt.value} ${opt.description ?? ""} ${opt.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const trimmedQuery = query.trim();
  const canCreateCustom =
    allowCustomValue &&
    trimmedQuery.length > 0 &&
    !options.some(
      (o) =>
        o.value.toLowerCase() === trimmedQuery.toLowerCase() ||
        o.label.toLowerCase() === trimmedQuery.toLowerCase()
    );

  useEffect(() => {
    if (!isOpen) return;
    setHighlightIndex(0);
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalCount = filteredOptions.length + (canCreateCustom ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalCount > 0) {
        setHighlightIndex((prev) => (prev + 1) % totalCount);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalCount > 0) {
        setHighlightIndex((prev) => (prev - 1 + totalCount) % totalCount);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex < filteredOptions.length) {
        const target = filteredOptions[highlightIndex];
        if (target && !target.disabled) {
          handleSelect(target.value);
        }
      } else if (canCreateCustom) {
        handleSelect(trimmedQuery);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  };

  const displayLabel = selectedOption
    ? selectedOption.label
    : value
    ? value
    : "";

  const paddingClass =
    size === "sm" ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-xs";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white text-left transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${paddingClass} ${
          isOpen
            ? "border-[#0a4d8c] ring-1 ring-[#0a4d8c]/20"
            : "border-slate-200 hover:border-slate-300"
        } ${buttonClassName}`}
      >
        <span
          className={`truncate ${
            displayLabel ? "text-slate-800 font-normal" : "text-slate-400 font-normal"
          }`}
        >
          {displayLabel || placeholder}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Hapus pilihan"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${
              isOpen ? "rotate-180 text-[#0a4d8c]" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-100">
          <div className="border-b border-slate-100 bg-slate-50/70 p-2">
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0a4d8c] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 && !canCreateCustom ? (
              <div className="px-3 py-4 text-center text-xs font-normal text-slate-400">
                {emptyText}
              </div>
            ) : (
              <>
                {filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightIndex;
                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      type="button"
                      disabled={opt.disabled}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => {
                        if (!opt.disabled) handleSelect(opt.value);
                      }}
                      className={`flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        isSelected
                          ? "bg-[#e8f2fc] text-[#0a4d8c] font-medium"
                          : isHighlighted
                          ? "bg-slate-50 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="truncate text-[11px] font-normal text-slate-400 mt-0.5">
                            {opt.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check
                          size={13}
                          className="mt-0.5 shrink-0 text-[#0a4d8c]"
                        />
                      )}
                    </button>
                  );
                })}

                {canCreateCustom && (
                  <button
                    type="button"
                    onMouseEnter={() =>
                      setHighlightIndex(filteredOptions.length)
                    }
                    onClick={() => handleSelect(trimmedQuery)}
                    className={`flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-xs font-medium text-[#0a4d8c] transition-colors ${
                      highlightIndex === filteredOptions.length
                        ? "bg-[#e8f2fc]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <Plus size={13} className="shrink-0" />
                    <span className="truncate">
                      {customValueLabel
                        ? customValueLabel(trimmedQuery)
                        : `Gunakan "${trimmedQuery}"`}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
