// @ts-nocheck
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FeatureTutorialDialog } from "@/components/cliente/FeatureTutorialDialog";
import { FEATURE_TUTORIALS } from "@/constants/featureTutorials";
import { useFeatureGate } from "@/contexts/FeatureGateContext";

interface FeatureTutorialButtonProps {
  slug: string;
}

export function FeatureTutorialButton({ slug }: FeatureTutorialButtonProps) {
  const tutorial = FEATURE_TUTORIALS[slug];
  const location = useLocation();
  const { getGateReason } = useFeatureGate();

  // Don't auto-open tutorial if the feature is gated (BUG-04: tutorial over locked overlay)
  const isGated = !!getGateReason(location.pathname);

  const [open, setOpen] = useState(() => {
    if (isGated) return false;
    const tourDone = localStorage.getItem("onboarding_tour_done");
    if (!tourDone) return false;
    return !localStorage.getItem(`feature_tutorial_${slug}_seen`);
  });

  // Don't render at all if feature is gated
  if (!tutorial || isGated) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(true)}>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tutorial: {tutorial.title}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <FeatureTutorialDialog tutorial={tutorial} open={open} onOpenChange={setOpen} />
    </>
  );
}
