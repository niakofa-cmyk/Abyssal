import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';

const base = import.meta.env.BASE_URL;
const EASE = [0.22, 1, 0.36, 1] as const;

export function ThreatScene() {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  useSceneTimer([
    { time: 1250, callback: () => setMouthOpen(true) },
    { time: 2200, callback: () => setNoteVisible(true) },
  ]);

  return (
    <motion.section className="film-stage"
      initial={{ opacity: 0, scale: 1.18, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.13, filter: 'blur(12px)', clipPath: 'circle(0% at 72% 49%)' }}
      transition={{ duration: .68, ease: EASE }}>
      <motion.img className="scene-image" src={`${base}images/bg/works.jpg`} alt=""
        initial={{ scale: 1.22, x: '3%' }} animate={{ scale: [1.22, 1.13, 1.18], x: ['3%', '0%', '-2%'] }}
        transition={{ duration: 4.9, times: [0, .65, 1], ease: 'easeInOut' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(2,8,12,.9) 0%,rgba(2,8,12,.42) 48%,rgba(2,8,12,.05) 100%),linear-gradient(0deg,rgba(2,8,12,.58),transparent 50%)' }} />
      <motion.div className="safe-copy" style={{ left: '6%', top: '25%', width: '41%' }}
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65, ease: EASE }}>
        <div className="film-display" style={{ fontSize: '22vmin', marginTop: '2vmin' }}>SURVIVE</div>
        <div className="film-display" style={{ fontSize: '13vmin', color: '#3ee0c5', marginTop: '.8vmin' }}>THE DEEP.</div>
      </motion.div>
      <motion.div className="sprite-frame" style={{ backgroundImage: `url(${base}images/sprites/maw.png)`, backgroundPosition: mouthOpen ? '0% 100%' : '100% 0%', width: '62vmin', height: '50vmin', right: '-3%', top: '21%', filter: 'drop-shadow(0 2vmin 2vmin rgba(0,0,0,.42))' }}
        initial={{ x: '22%', scale: .67, opacity: 0, rotate: 6 }} animate={{ x: ['22%', '0%', '-3%'], scale: [.67, 1.02, .95], opacity: 1, rotate: [6, 0, -2] }}
        transition={{ duration: 3.7, times: [0, .58, 1], ease: EASE }} />
      <motion.div className="absolute" style={{ right: '19%', top: '43%', width: '2.1vmin', height: '2.1vmin', borderRadius: '50%', background: '#c58aff', boxShadow: '0 0 5vmin 2vmin rgba(183,106,255,.7)' }}
        animate={{ scale: [1, 1.28, 1], opacity: [.75, 1, .75] }} transition={{ duration: 1.4, repeat: Infinity }} />
      <motion.div className="safe-copy small-label" style={{ left: '6%', bottom: '9%', color: '#e6f1ee' }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: noteVisible ? 1 : 0, y: noteVisible ? 0 : 10 }} transition={{ duration: .4 }}>
        SOMETHING WAITING IN THE DEEP.
      </motion.div>
      <motion.div className="absolute" style={{ inset: 0, zIndex: 8, background: 'radial-gradient(circle at 80% 47%,rgba(62,224,197,.36),transparent 8%)', pointerEvents: 'none' }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 0, .72, 0] }} transition={{ duration: 4.8, times: [0, .72, .84, 1] }} />
      <div className="scene-vignette" />
      <div className="film-grain" />
    </motion.section>
  );
}
