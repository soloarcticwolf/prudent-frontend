import { useEffect, useRef, useState } from "react";
import type { BoundaryResponse } from "../../types/api";
import { Alert } from "../ui/primitives";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** MapLibre region map. Boundary layer is independent from thematic layers. */
export function RegionMap({ boundary }: { boundary: BoundaryResponse | null }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Map } = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !hostRef.current || mapRef.current) return;
      try {
        const map = new Map({
          container: hostRef.current,
          style: STYLE_URL,
          center: [10, 25],
          zoom: 1.4,
          attributionControl: { compact: true },
        });
        map.addControl(new (await import("maplibre-gl")).NavigationControl({ showCompass: false }), "top-right");
        map.on("error", () => setFailed(true));
        mapRef.current = map;
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !boundary) return;
    const id = "prudent-region";
    const apply = () => {
      const data = {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: boundary.display_geometry }],
      } as unknown as GeoJSON.FeatureCollection;
      if (map.getSource(id)) {
        (map.getSource(id) as import("maplibre-gl").GeoJSONSource).setData(data);
      } else {
        map.addSource(id, { type: "geojson", data });
        map.addLayer({
          id: `${id}-fill`,
          type: "fill",
          source: id,
          paint: { "fill-color": "#C96F53", "fill-opacity": 0.28 },
        });
        map.addLayer({
          id: `${id}-line`,
          type: "line",
          source: id,
          paint: { "line-color": "#C96F53", "line-width": 2 },
        });
      }
      const c = boundary.centroid;
      if (c) map.flyTo({ center: [c.lon, c.lat], zoom: 8.5, duration: 900 });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [boundary]);

  return (
    <div>
      <div ref={hostRef} className="h-72 w-full overflow-hidden rounded-lg border border-line bg-subtle sm:h-96" role="application" aria-label="Region map" />
      {failed ? (
        <div className="mt-2">
          <Alert kind="warn">Map tiles failed to load. Your analysis can still run — boundary metadata is listed below.</Alert>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-secondary">
        Basemap © OpenStreetMap contributors © CARTO. Boundary overlay is translucent terracotta with a clear outline.
      </p>
    </div>
  );
}
