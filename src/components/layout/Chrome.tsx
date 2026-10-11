import { Link, NavLink } from "react-router-dom";
import { Flame } from "lucide-react";

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-subtle text-forest" : "text-secondary hover:text-ink"
  }`;

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Prudent home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-white">
            <Flame size={18} strokeWidth={2.2} />
          </span>
          <span className="font-serif text-2xl tracking-tight text-ink">Prudent</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink to="/explore" className={link}>Explore</NavLink>
          <NavLink to="/methodology" className={link}>Methodology</NavLink>
          <NavLink to="/about" className={link}>About</NavLink>
        </nav>
        <Link
          to="/explore"
          className="hidden rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-deepforest sm:inline-flex"
        >
          Explore climate data
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-secondary sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-serif text-lg text-ink">Prudent</p>
          <p className="mt-2 max-w-xs">
            Historical heatwave intelligence from real, traceable climate data. No account required.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">Data &amp; boundaries</p>
          <ul className="mt-2 space-y-1">
            <li>Climate: Open-Meteo archive (ERA5 family)</li>
            <li>Boundaries: geoBoundaries · Natural Earth · OpenStreetMap (ODbL)</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Method</p>
          <p className="mt-2">
            Heatwave = ≥3 consecutive days above the regional calendar-day 95th percentile (1991–2020 baseline).
          </p>
        </div>
      </div>
    </footer>
  );
}
