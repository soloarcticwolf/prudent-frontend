import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Droplets, Flame, ThermometerSun, Wind } from "lucide-react";
import { Card } from "../components/ui/primitives";

export function HomePage() {
  const reduce = useReducedMotion();
  const anim = reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35]">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1200 400">
            {Array.from({ length: 14 }).map((_, i) => (
              <path
                key={i}
                d={`M -20 ${30 + i * 26} C 300 ${10 + i * 26}, 700 ${50 + i * 26}, 1220 ${20 + i * 26}`}
                fill="none"
                stroke={i % 3 === 0 ? "#C96F53" : "#A8B8A5"}
                strokeOpacity={i % 3 === 0 ? 0.5 : 0.35}
                strokeWidth={1}
              />
            ))}
          </svg>
        </div>
        <motion.div {...anim} transition={{ duration: 0.45 }} className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">Climate intelligence</p>
          <h1 className="mt-3 max-w-2xl font-serif text-5xl leading-tight text-ink sm:text-6xl">
            The climate is changing. Explore where.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-secondary">
            Prudent lets you investigate historical heatwave patterns across geographic regions and
            time periods — with real data, documented methods, and honest uncertainty.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-deepforest"
            >
              Explore climate data <ArrowRight size={16} />
            </Link>
            <Link to="/methodology" className="inline-flex items-center rounded-md border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-forest">
              How it works
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Flame, t: "Heatwaves, fully analyzed", d: "Frequency, duration, intensity and trends from decades of daily maxima." },
            { icon: ThermometerSun, t: "Traceable science", d: "Versioned heatwave definition, published baseline, visible data gaps." },
            { icon: Droplets, t: "Built for more hazards", d: "Flood, drought, cold and fire-weather layers slot into the same map architecture." },
          ].map((c, i) => (
            <motion.div key={c.t} {...anim} transition={{ duration: 0.4, delay: reduce ? 0 : 0.08 * i }}>
              <Card className="h-full p-5">
                <c.icon size={22} className="text-terracotta" />
                <h2 className="mt-3 font-serif text-xl text-ink">{c.t}</h2>
                <p className="mt-2 text-sm text-secondary">{c.d}</p>
              </Card>
            </motion.div>
          ))}
        </div>
        <Card className="mt-4 flex items-center gap-3 p-5 text-sm text-secondary">
          <Wind size={18} className="shrink-0 text-forest" />
          <p>
            No account needed. Pick a recognized region, choose a historical period, and reuse cached
            results instead of reprocessing identical datasets.
          </p>
        </Card>
      </section>
    </div>
  );
}
