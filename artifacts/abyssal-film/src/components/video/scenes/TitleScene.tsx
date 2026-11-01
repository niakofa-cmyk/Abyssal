import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;

export function TitleScene() {
  const [promise, setPromise] = useState(false);
  const [closing, setClosing] = useState(false);
  useSceneTimer([
    { time: 1250, callback: () => setPromise(true) },
    { time: 3800, callback: () => setClosing(true) },
  ]);
  return (
    <motion.section className="film-stage"
      initial={{ opacity: 0, clipPath: 'polygon(0 0,100% 0,100% 100%,0 0)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }}
      exit={{ opacity: 0, scale: .97 }}
      transition={{ duration: .65, ease: EASE }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 48%,#0b2228 0%,#06141c 37%,#02080c 76%)' }} />
      <motion.div className="absolute" style={{ left: '50%', top: '45%', width: '2.1vmin', height: '2.1vmin', borderRadius: '50%', background: '#3ee0c5', boxShadow: '0 0 6vmin 2vmin rgba(62,224,197,.7)', translate: '-50% -50%' }}
        initial={{ scale: 0 }} animate={closing ? { scale: 12, opacity: 0 } : { scale: [0, 1.2, 1], opacity: 1 }}
        transition={closing ? { duration: 1.15, ease: EASE } : { duration: .9, ease: EASE }} />
      <div className="safe-copy" style={{ width: '100%', left: 0, top: '34%', textAlign: 'center' }}>
        <motion.div className="film-serif" style={{ color: '#e6f1ee', fontSize: '15vmin', letterSpacing: '-.07em', textShadow: '0 1vmin 4vmin rgba(0,0,0,.5)' }}
          initial={{ opacity: 0, y: 18, scale: 1.08 }} animate={{ opacity: closing ? 0 : 1, y: closing ? -12 : 0, scale: closing ? .96 : 1 }} transition={{ duration: closing ? .45 : .8, delay: closing ? 0 : .2, ease: EASE }}>
          ABYSSAL
        </motion.div>
        <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.2vmin', marginTop: '2.6vmin' }}
          initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration: closing ? .4 : .6, delay: closing ? 0 : .75 }}>
          <motion.span className="thin-rule" style={{ width: '8vmin' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: .55, delay: .85 }} />
          <span className="film-kicker" style={{ color: '#e7a04a', fontSize: '2.5vmin' }}>THE LAST ASCENT</span>
          <motion.span className="thin-rule" style={{ width: '8vmin' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: .55, delay: .85 }} />
        </motion.div>
        <motion.p className="tagline" style={{ maxWidth: '70vmin', margin: '5.4vmin auto 0', color: '#b7ceca' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: promise && !closing ? 1 : 0, y: promise && !closing ? 0 : 12 }} transition={{ duration: .65, ease: EASE }}>
          Explore the ruins. Survive the deep. Reconstruct the truth.
        </motion.p>
      </div>
      <motion.div className="absolute" style={{ bottom: '8%', left: 0, width: '100%', textAlign: 'center', color: 'rgba(138,164,166,.58)', fontSize: '1.7vmin', letterSpacing: '.3em' }}
        animate={{ opacity: closing ? 0 : [.38, .7, .38] }} transition={{ duration: closing ? .4 : 3, repeat: closing ? 0 : Infinity }}>
        A COOPERATIVE DESCENT THROUGH AN OCEAN THAT REMEMBERS
      </motion.div>
      <motion.div className="absolute" style={{ inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 45%,transparent 10%,rgba(2,8,12,.65) 100%)' }}
        animate={{ opacity: [.5, .2, .5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="film-grain" />
    </motion.section>
  );
}
