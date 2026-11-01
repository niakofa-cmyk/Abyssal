import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;
const base = import.meta.env.BASE_URL;

export function DescentScene() {
  const [copyReady, setCopyReady] = useState(false);
  const [sublineReady, setSublineReady] = useState(false);
  useSceneTimer([
    { time: 180, callback: () => setCopyReady(true) },
    { time: 1050, callback: () => setSublineReady(true) },
  ]);

  return (
    <motion.section
      className="film-stage"
      initial={{ opacity: 0, scale: 1.03, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, scale: 1, clipPath: 'inset(0 0 0% 0)' }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)', clipPath: 'circle(0% at 50% 47%)' }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      <motion.img
        className="scene-image"
        src={`${base}images/bg/reef.jpg`}
        alt=""
        initial={{ scale: 1.16, y: '4%' }}
        animate={{ scale: [1.16, 1.08, 1.12], y: ['4%', '-1%', '-4%'] }}
        transition={{ duration: 4.6, times: [0, 0.65, 1], ease: 'easeInOut' }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(2,8,12,.58),transparent 70%),linear-gradient(0deg,rgba(2,8,12,.44),transparent 65%)' }} />
      <motion.div
        className="sprite-frame"
        style={{ backgroundImage: `url(${base}images/sprites/diver.png)`, backgroundPosition: '100% 100%', width: '34vmin', height: '32vmin', left: '47%', top: '35%', filter: 'drop-shadow(0 1.6vmin 2vmin rgba(0,0,0,.5))' }}
        initial={{ y: '-13%', scale: 1.15, rotate: -6, opacity: 0 }}
        animate={{ y: ['-13%', '1%', '8%'], scale: [1.15, 1, .91], rotate: [-6, 1, 4], opacity: 1 }}
        transition={{ duration: 4.2, times: [0, .4, 1], ease: EASE }}
      />
      <motion.div className="absolute" style={{ width: '1.6vmin', height: '1.6vmin', borderRadius: '50%', background: '#3ee0c5', left: '61.1%', top: '46%', boxShadow: '0 0 4vmin 1vmin rgba(62,224,197,.7)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [1, .62, 1] }} transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute" style={{ left: '6%', top: '21%', width: '41vmin' }}
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: copyReady ? 1 : 0, x: copyReady ? 0 : -30 }} transition={{ duration: .7, ease: EASE }}>
        <span className="film-kicker" style={{ color: '#3ee0c5', display: 'flex', alignItems: 'center', gap: '1.2vmin' }}>
          <span style={{ display: 'inline-block', width: '4.2vmin', height: '1px', background: '#3ee0c5' }} /> AN OCEAN THAT
        </span>
        <div className="film-display" style={{ fontSize: '8vmin', marginTop: '1.5vmin', textShadow: '0 1vmin 4vmin rgba(0,0,0,.5)' }}>REMEMBERS.</div>
        <motion.p className="film-copy" style={{ maxWidth: '38vmin', margin: '2.2vmin 0 0', color: '#d4e5e1' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: sublineReady ? 1 : 0, y: sublineReady ? 0 : 16 }} transition={{ duration: .6, ease: EASE }}>
          A cooperative descent through an ocean that remembers.
        </motion.p>
      </motion.div>
      <div className="scene-vignette" />
      <div className="film-grain" />
    </motion.section>
  );
}
