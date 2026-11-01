import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';

const base = import.meta.env.BASE_URL;
const EASE = [0.22, 1, 0.36, 1] as const;

export function CityScene() {
  const [truth, setTruth] = useState(false);
  const [detail, setDetail] = useState(false);
  useSceneTimer([
    { time: 500, callback: () => setTruth(true) },
    { time: 3000, callback: () => setDetail(true) },
  ]);

  return (
    <motion.section className="film-stage"
      initial={{ opacity: 0, clipPath: 'circle(0% at 80% 46%)', scale: 1.07 }}
      animate={{ opacity: 1, clipPath: 'circle(125% at 80% 46%)', scale: 1 }}
      exit={{ opacity: 0, clipPath: 'polygon(0 0,100% 0,100% 100%,0 0)', scale: .96 }}
      transition={{ duration: .9, ease: EASE }}>
      <motion.img className="scene-image" src={`${base}images/bg/city.jpg`} alt=""
        initial={{ scale: 1.2, x: '3%' }} animate={{ scale: [1.2, 1.12, 1.15], x: ['3%', '0%', '-2%'] }}
        transition={{ duration: 5.9, times: [0, .66, 1], ease: 'easeInOut' }} />
      <motion.div className="absolute" style={{ inset: 0, background: 'linear-gradient(0deg,rgba(2,8,12,.83),transparent 66%),linear-gradient(90deg,rgba(2,8,12,.36),transparent 75%)' }}
        animate={{ opacity: [1, .74, .9] }} transition={{ duration: 5.8, ease: 'easeInOut' }} />
      <motion.div className="absolute" style={{ left: '57%', top: '14%', width: '23vmin', height: '62vmin', background: 'linear-gradient(180deg,rgba(62,224,197,.17),transparent)', clipPath: 'polygon(50% 0,100% 100%,0 100%)', mixBlendMode: 'screen' }}
        animate={{ opacity: [.2, .65, .36], scaleX: [1, 1.08, .96] }} transition={{ duration: 3.7, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="city-line" style={{ left: '52%', top: '62%', width: '24vmin', transform: 'rotate(-24deg)' }}
        initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: detail ? 1 : 0, opacity: detail ? .9 : 0 }} transition={{ duration: .75, ease: EASE }} />
      <motion.div className="city-line" style={{ left: '68%', top: '45%', width: '16vmin', transform: 'rotate(22deg)' }}
        initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: detail ? 1 : 0, opacity: detail ? .8 : 0 }} transition={{ duration: .7, delay: .22, ease: EASE }} />
      <motion.div className="city-line" style={{ left: '65%', top: '57%', width: '13vmin', transform: 'rotate(-5deg)' }}
        initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: detail ? 1 : 0, opacity: detail ? .8 : 0 }} transition={{ duration: .62, delay: .43, ease: EASE }} />
      <motion.div className="safe-copy" style={{ left: '6%', bottom: '15%', maxWidth: '54%' }}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: truth ? 1 : 0, y: truth ? 0 : 24 }} transition={{ duration: .65, ease: EASE }}>
        <div className="outline-type film-display" style={{ '--outline-color': '#e6f1ee', fontSize: '8vmin' } as CSSProperties}>RECONSTRUCT</div>
        <div className="film-display" style={{ fontSize: '9vmin', color: '#e6f1ee', marginTop: '.5vmin' }}>THE TRUTH.</div>
      </motion.div>
      <motion.p className="safe-copy" style={{ right: '6%', bottom: '7%', width: '33%', margin: 0, color: '#a9c0bf', fontSize: '2.7vmin', lineHeight: 1.22, textAlign: 'right' }}
        initial={{ opacity: 0, x: 25 }} animate={{ opacity: detail ? 1 : 0, x: detail ? 0 : 25 }} transition={{ duration: .55, ease: EASE }}>
        Closer to a lost civilization, a catastrophic mystery, and something waiting in the deep.
      </motion.p>
      <motion.div className="absolute" style={{ left: '72%', top: '41%', width: '1.6vmin', height: '1.6vmin', borderRadius: '50%', background: '#3ee0c5', boxShadow: '0 0 6vmin 2vmin rgba(62,224,197,.8)' }}
        animate={{ scale: [.7, 1.5, .8], opacity: [.4, 1, .6] }} transition={{ duration: 2.5, repeat: Infinity }} />
      <div className="scene-vignette" />
      <div className="film-grain" />
    </motion.section>
  );
}
