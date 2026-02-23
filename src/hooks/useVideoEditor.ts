import { useState, useCallback, useRef } from "react";

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
}

export interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "center" | "bottom";
  style: "classic" | "highlight" | "minimal";
}

export interface ImageInsert {
  id: string;
  file: File;
  previewUrl: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "fullscreen";
  startTime: number;
  endTime: number;
  opacity: number;
}

export interface MusicTrack {
  file: File;
  previewUrl: string;
  volume: number;
  mode: "mix" | "replace";
}

let idCounter = 0;
const genId = () => `ve_${++idCounter}_${Date.now()}`;

export function useVideoEditor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [inserts, setInserts] = useState<ImageInsert[]>([]);
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);

  const loadVideo = useCallback((file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setSegments([]);
    setSubtitles([]);
    setInserts([]);
    setMusic(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedSegmentId(null);
  }, [videoUrl]);

  const onDurationLoaded = useCallback((dur: number) => {
    setDuration(dur);
    setSegments([{ id: genId(), startTime: 0, endTime: dur }]);
  }, []);

  // Split segment at playhead position
  const splitAtCurrentTime = useCallback(() => {
    if (currentTime <= 0 || currentTime >= duration) return;
    setSegments(prev => {
      const seg = prev.find(s => currentTime > s.startTime && currentTime < s.endTime);
      if (!seg) return prev;
      return prev.flatMap(s =>
        s.id === seg.id
          ? [
              { id: genId(), startTime: s.startTime, endTime: currentTime },
              { id: genId(), startTime: currentTime, endTime: s.endTime },
            ]
          : [s]
      );
    });
  }, [currentTime, duration]);

  // Delete selected segment
  const deleteSelectedSegment = useCallback(() => {
    if (!selectedSegmentId) return;
    setSegments(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(s => s.id !== selectedSegmentId);
    });
    setSelectedSegmentId(null);
  }, [selectedSegmentId]);

  const removeSegment = useCallback((id: string) => {
    setSegments(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(s => s.id !== id);
    });
    if (selectedSegmentId === id) setSelectedSegmentId(null);
  }, [selectedSegmentId]);

  const updateSegment = useCallback((id: string, updates: Partial<VideoSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // Smart playback: find next segment when current time falls in a gap
  const getNextSegmentStart = useCallback((time: number): number | null => {
    const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
    for (const seg of sorted) {
      if (time >= seg.startTime && time < seg.endTime) return null; // within a segment
      if (seg.startTime > time) return seg.startTime; // next segment
    }
    return null;
  }, [segments]);

  const isTimeInSegment = useCallback((time: number): boolean => {
    return segments.some(s => time >= s.startTime && time < s.endTime);
  }, [segments]);

  const addSubtitle = useCallback(() => {
    setSubtitles(prev => [...prev, {
      id: genId(),
      text: "Legenda",
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, duration),
      position: "bottom",
      style: "classic",
    }]);
  }, [currentTime, duration]);

  const updateSubtitle = useCallback((id: string, updates: Partial<Subtitle>) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeSubtitle = useCallback((id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
  }, []);

  const setSubtitlesList = useCallback((subs: Subtitle[]) => {
    setSubtitles(subs);
  }, []);

  const addInsert = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setInserts(prev => [...prev, {
      id: genId(),
      file,
      previewUrl,
      position: "bottom-right",
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration),
      opacity: 80,
    }]);
  }, [currentTime, duration]);

  const updateInsert = useCallback((id: string, updates: Partial<ImageInsert>) => {
    setInserts(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const removeInsert = useCallback((id: string) => {
    setInserts(prev => {
      const ins = prev.find(i => i.id === id);
      if (ins) URL.revokeObjectURL(ins.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const setMusicTrack = useCallback((file: File) => {
    if (music) URL.revokeObjectURL(music.previewUrl);
    setMusic({
      file,
      previewUrl: URL.createObjectURL(file),
      volume: 50,
      mode: "mix",
    });
  }, [music]);

  const updateMusic = useCallback((updates: Partial<MusicTrack>) => {
    setMusic(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const removeMusic = useCallback(() => {
    if (music) URL.revokeObjectURL(music.previewUrl);
    setMusic(null);
  }, [music]);

  const resetEditor = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    inserts.forEach(i => URL.revokeObjectURL(i.previewUrl));
    if (music) URL.revokeObjectURL(music.previewUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setSegments([]);
    setSubtitles([]);
    setInserts([]);
    setMusic(null);
    setSelectedSegmentId(null);
  }, [videoUrl, inserts, music]);

  return {
    videoRef,
    videoFile, videoUrl, duration, currentTime, isPlaying,
    segments, subtitles, inserts, music,
    selectedSegmentId, isGeneratingSubtitles,
    setCurrentTime, setIsPlaying, setSelectedSegmentId, setIsGeneratingSubtitles,
    loadVideo, onDurationLoaded, resetEditor,
    splitAtCurrentTime, deleteSelectedSegment,
    removeSegment, updateSegment,
    addSubtitle, updateSubtitle, removeSubtitle, setSubtitlesList,
    addInsert, updateInsert, removeInsert,
    setMusicTrack, updateMusic, removeMusic,
    getNextSegmentStart, isTimeInSegment,
  };
}
