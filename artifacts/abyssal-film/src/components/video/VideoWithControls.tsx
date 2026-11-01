import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  descent: { title: 'The Descent', filePath: 'src/components/video/scenes/DescentScene.tsx' },
  expedition: { title: 'Expedition', filePath: 'src/components/video/scenes/ExpeditionScene.tsx' },
  threat: { title: 'The Threat', filePath: 'src/components/video/scenes/ThreatScene.tsx' },
  city: { title: 'The City', filePath: 'src/components/video/scenes/CityScene.tsx' },
  title: { title: 'Title', filePath: 'src/components/video/scenes/TitleScene.tsx' },
};

function formatPlaybackTime(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function PlaybackStatus({
  sceneKeys, activeIndex, activeDuration, activeStartTime, totalDuration, tick, paused, onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedBaseRef = useRef(0);
  useEffect(() => {
    setElapsed(0);
    elapsedBaseRef.current = 0;
  }, [tick]);
  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      setElapsed(elapsedBaseRef.current + performance.now() - startedAt);
    }, 60);
    return () => {
      window.clearInterval(interval);
      elapsedBaseRef.current += performance.now() - startedAt;
    };
  }, [paused, tick]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const fullElapsed = Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration));
  return (
    <>
      <div className="playback-segments">
        {sceneKeys.map((key, index) => (
          <button className="playback-segment" key={key} aria-label={`Jump to scene ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined} onClick={() => onJumpTo(index)}>
            <span className="playback-fill" style={{ width: index === activeIndex ? `${progress * 100}%` : index < activeIndex ? '100%' : '0%' }} />
          </button>
        ))}
      </div>
      <span className="playback-meta scene-count">{activeIndex + 1}/{sceneKeys.length}</span>
      <span className="playback-meta time-count" role="timer" aria-label={`Playback time ${formatPlaybackTime(fullElapsed)} of ${formatPlaybackTime(totalDuration)}`}>
        {formatPlaybackTime(fullElapsed)} / {formatPlaybackTime(totalDuration)}
      </span>
    </>
  );
}

export default function VideoWithControls() {
  const iframed = typeof window !== 'undefined' && window.self !== window.top;
  const controls = useSceneControls(SCENE_DURATIONS);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);
  const barVisible = !collapsed || hovering || tapPinned;

  const handleJumpTo = useCallback((index: number) => {
    controls.jumpTo(index);
    const key = controls.sceneKeys[index];
    const details = SCENE_DETAILS[key];
    if (!details?.filePath) return;
    window.parent.postMessage({
      type: 'REPLIT_VIDEO_SCENE_SELECTED',
      payload: { sceneIndex: index, sceneCount: controls.sceneKeys.length, sceneTitle: details.title, filePath: details.filePath, lineNumber: 1 },
    }, '*');
  }, [controls.jumpTo, controls.sceneKeys]);

  useEffect(() => {
    if (!controls.paused) return;
    const running = document.getAnimations().filter((animation) => animation.playState === 'running');
    running.forEach((animation) => animation.pause());
    return () => running.forEach((animation) => animation.play());
  }, [controls.paused]);

  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const onOutsidePress = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      if (sensorRef.current && !sensorRef.current.contains(event.target as Node)) setTapPinned(false);
    };
    document.addEventListener('pointerdown', onOutsidePress);
    return () => document.removeEventListener('pointerdown', onOutsidePress);
  }, [collapsed, tapPinned]);

  if (!iframed) return <VideoTemplate />;

  return (
    <div className="relative h-screen w-full">
      <VideoTemplate key={controls.mountKey} durations={controls.durations} loop paused={controls.paused} muted={muted} onSceneChange={controls.onSceneChange} />
      <div ref={sensorRef} className="control-sensor"
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovering(true); }}
        onPointerLeave={(event) => { if (event.pointerType === 'mouse') setHovering(false); }}
        onPointerDown={(event) => { if (event.pointerType !== 'mouse' && collapsed) setTapPinned(true); }}>
        <div style={{ flex: 1, width: '100%' }} aria-hidden="true" />
        <div className={`control-bar${barVisible ? '' : ' is-hidden'}`} aria-hidden={!barVisible}>
          <button className="control-button" onClick={controls.togglePause} title={controls.paused ? 'Play' : 'Pause'} aria-label={controls.paused ? 'Play' : 'Pause'}>
            {controls.paused ? <Play /> : <Pause />}
          </button>
          <button className="control-button" onClick={controls.toggleLock} title={controls.locked ? 'Loop current scene: on' : 'Loop current scene: off'} aria-label={controls.locked ? 'Loop current scene: on' : 'Loop current scene: off'} aria-pressed={controls.locked}>
            <Repeat />
          </button>
          <button className="control-button" onClick={() => setMuted((value) => !value)} title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute audio' : 'Mute audio'} aria-pressed={muted}>
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <div className="control-divider" aria-hidden="true" />
          <PlaybackStatus {...controls} onJumpTo={handleJumpTo} />
          <button className="control-button" onClick={() => {
            setCollapsed((value) => {
              if (!value) { setHovering(false); setTapPinned(false); }
              return !value;
            });
          }} title={collapsed ? 'Show controls' : 'Hide controls'} aria-label={collapsed ? 'Show controls' : 'Hide controls'} aria-expanded={!collapsed}>
            {collapsed ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>
    </div>
  );
}
