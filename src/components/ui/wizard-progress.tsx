import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function WizardProgress({ steps, currentStep, className }: WizardProgressProps) {
  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium border-2 transition-colors",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary bg-background",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground bg-background"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
              </div>
              <span className={cn(
                "mt-1 text-[10px] max-w-[60px] text-center leading-tight hidden sm:block",
                isCurrent && "text-primary font-medium",
                !isCurrent && "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                "h-0.5 flex-1 mx-1 transition-colors",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
