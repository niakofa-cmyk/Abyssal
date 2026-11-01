import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';

const base = import.meta.env.BASE_URL;
const EASE = [0.22, 1, 0.36, 1] as const;

export function ExpeditionScene() {
  const [labels, setLabels] = useState(false);
  useSceneTimer([{ time: 350, callback: () => setLabels(true) }]);

  return (
    <motion.section className="film-stage"
      initial={{ opacity: 0, clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', scale: 1.04 }}
      animate={{ opacity: 1, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', scale: 1 }}
      exit={{ opacity: 0, scale: 1.12, filter: 'blur(8px)', clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }}
      transition={{ duration: .65, ease: EASE }}>
      <motion.img className="scene-image" src={`${base}images/bg/plains.jpg`} alt=""
        initial={{ scale: 1.18, y: '5%' }} animate={{ scale: [1.18, 1.1, 1.13], y: ['5%', '-2%', '-4%'] }}
        transition={{ duration: 4.7, times: [0, .65, 1], ease: 'easeInOut' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(2,8,12,.3),rgba(2,8,12,.16) 45%,rgba(2,8,12,.7))' }} />
      <motion.div className="sonar-ring" initial={{ scale: .18, opacity: 0 }} animate={{ scale: [1.2, .86, .22], opacity: [0, .95, .8] }}
        transition={{ duration: 4.2, times: [0, .66, 1], ease: EASE }} style={{ width: '48vmin', height: '48vmin', top: '54%' }}>
        <span className="scan-beam" />
      </motion.div>
      <motion.div className="sprite-frame" style={{ backgroundImage: `url(${base}images/sprites/barrow.png)`, backgroundPosition: '50% 50%', width: '51vmin', height: '34vmin', left: '27%', top: '35%', filter: 'drop-shadow(0 2vmin 2vmin rgba(0,0,0,.55))' }}
        initial={{ x: '-8%', y: '4%', scale: .72, opacity: 0 }} animate={{ x: ['-8%', '0%', '5%'], y: ['4%', '0%', '-2%'], scale: [.72, 1, .95], opacity: 1 }}
        transition={{ duration: 4.4, times: [0, .48, 1], ease: EASE }} />
      <motion.div className="sprite-frame" style={{ backgroundImage: `url(${base}images/sprites/diver.png)`, backgroundPosition: '100% 100%', width: '15vmin', height: '14vmin', left: '18%', top: '43%' }}
        initial={{ x: '-5vmin', opacity: 0 }} animate={{ x: ['-5vmin', '0vmin', '2vmin'], y: ['1vmin', '-1vmin', '2vmin'], opacity: 1 }}
        transition={{ duration: 4.1, ease: 'easeInOut' }} />
      <motion.div className="safe-copy" style={{ right: '6%', top: '12%', width: '32%', textAlign: 'right' }}
        initial={{ opacity: 0, x: 25 }} animate={{ opacity: labels ? 1 : 0, x: labels ? 0 : 25 }} transition={{ duration: .55, ease: EASE }}>
        <div className="film-copy" style={{ color: '#3ee0c5' }}>A cooperative descent</div>
        <div className="film-display" style={{ fontSize: '15vmin', marginTop: '1.1vmin', color: 'rgba(230,241,238,.86)' }}>DESCENT</div>
      </motion.div>
      <motion.div className="safe-copy small-label" style={{ left: '6%', bottom: '8%', color: '#e6f1ee' }}
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: labels ? 1 : 0, y: labels ? 0 : 15 }} transition={{ duration: .5, delay: .4 }}>
        EXPLORE THE RUINS.
      </motion.div>
      <div className="scene-vignette" />
      <div className="film-grain" />
    </motion.section>
  );
}
