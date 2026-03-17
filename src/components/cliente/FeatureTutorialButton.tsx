import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FeatureTutorialDialog } from "@/components/cliente/FeatureTutorialDialog";
import { FEATURE_TUTORIALS } from "@/constants/featureTutorials";

interface FeatureTutorialButtonProps {
  slug: string;
}

export function FeatureTutorialButton({ slug }: FeatureTutorialButtonProps) {
  const tutorial = FEATURE_TUTORIALS[slug];
  const [open, setOpen] = useState(() => !localStorage.getItem(`feature_tutorial_${slug}_seen`));

  if (!tutorial) return null;

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
