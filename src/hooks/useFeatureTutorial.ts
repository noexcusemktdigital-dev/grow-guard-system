import { useState } from "react";
import { FEATURE_TUTORIALS } from "@/constants/featureTutorials";

export function useFeatureTutorial(slug: string) {
  const key = `feature_tutorial_${slug}_seen`;
  const [open, setOpen] = useState(() => !localStorage.getItem(key));
  const tutorial = FEATURE_TUTORIALS[slug];

  const openTutorial = () => setOpen(true);

  return { tutorial, open, setOpen, openTutorial };
}
