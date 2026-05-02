import { useState, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  allowNegative?: boolean;
  className?: string;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, decimals = 2, prefix, suffix, allowNegative = false, className, onBlur, ...props }, ref) => {

    const toDisplay = (v: number | null | undefined): string => {
      if (v === null || v === undefined || isNaN(v as number)) return "";
      return (v as number).toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    };

    const toNumber = (s: string): number | null => {
      if (!s || s === "" || s === "-") return null;
      const clean = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    };

    const [display, setDisplay] = useState<string>(toDisplay(value));
    const [focused, setFocused] = useState(false);

    useEffect(() => {
      if (!focused) {
        setDisplay(toDisplay(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      if (prefix) raw = raw.replace(prefix, "");
      if (suffix) raw = raw.replace(suffix, "");

      const allowed = allowNegative ? /[^\d,.-]/g : /[^\d,.]/g;
      raw = raw.replace(allowed, "");

      const parts = raw.split(",");
      if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");

      if (decimals === 0) {
        raw = raw.replace(",", "").replace(/\./g, "");
      } else if (raw.includes(",")) {
        const [intPart, decPart] = raw.split(",");
        raw = intPart + "," + decPart.slice(0, decimals);
      }

      setDisplay(raw);
      onChange?.(toNumber(raw));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (value !== null && value !== undefined && !isNaN(value as number)) {
        setDisplay(
          (value as number).toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
          })
        );
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const n = toNumber(display);
      setDisplay(n !== null ? toDisplay(n) : "");
      onChange?.(n);
      onBlur?.(e);
    };

    const displayValue = display === "" ? "" : (prefix || "") + display + (suffix || "");

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";
