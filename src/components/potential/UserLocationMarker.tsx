import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { normalizeAngle } from '../../lib/heading';

type UserLocationMarkerProps = {
    map: maplibregl.Map | null;
    position: GeolocationPosition | null;
    accuracy: number | null;
    compassActive: boolean;
    heading: number | null;
    mapBearing: number;
};

type MarkerParts = {
    marker: maplibregl.Marker;
    accuracyCircle: HTMLDivElement;
    cone: HTMLDivElement;
};

type LocationCoordinates = {
    latitude: number;
    longitude: number;
};

const MAX_ACCURACY_METERS = 1000;
const EARTH_CIRCUMFERENCE_METERS = 40_075_016.68557849;
const MAP_TILE_SIZE = 512;
const MIN_ACCURACY_DIAMETER_PX = 8;

function setCenteredPosition(element: HTMLElement, width: number, height: number) {
    Object.assign(element.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${width}px`,
        height: `${height}px`,
        boxSizing: 'border-box',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
    });
}

function metersToPixels(meters: number, latitude: number, zoom: number): number {
    const latitudeCosine = Math.max(0.01, Math.cos((latitude * Math.PI) / 180));
    return (meters * MAP_TILE_SIZE * 2 ** zoom) / (EARTH_CIRCUMFERENCE_METERS * latitudeCosine);
}

function createMarkerParts(map: maplibregl.Map, coordinates: LocationCoordinates): MarkerParts {
    const root = document.createElement('div');
    root.className = 'user-location-marker';
    root.setAttribute('aria-hidden', 'true');
    Object.assign(root.style, {
        position: 'relative',
        width: '0',
        height: '0',
        pointerEvents: 'none',
        zIndex: '2',
    });

    const accuracyCircle = document.createElement('div');
    accuracyCircle.className = 'rounded-full';
    accuracyCircle.style.border = '1px solid rgba(221, 214, 254, 0.42)';
    accuracyCircle.style.background = 'rgba(167, 139, 250, 0.12)';
    accuracyCircle.style.display = 'none';

    // Google Maps-style beam: a wedge fading outward, plus an arrow tip on the dot,
    // so the facing direction reads at a glance even over bright tiles.
    const cone = document.createElement('div');
    Object.assign(cone.style, {
        width: '96px',
        height: '96px',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transformOrigin: '50% 50%',
        transform: 'translate(-50%, -50%)',
        display: 'none',
        pointerEvents: 'none',
        zIndex: '1',
    });
    const beam = document.createElement('div');
    Object.assign(beam.style, {
        position: 'absolute',
        inset: '0',
        borderRadius: '9999px',
        background:
            'conic-gradient(from -30deg, rgba(221, 214, 254, 0.75) 0deg, rgba(196, 181, 253, 0.55) 30deg, rgba(221, 214, 254, 0.75) 60deg, transparent 60deg)',
        WebkitMaskImage: 'radial-gradient(circle, #000 0%, #000 20%, rgba(0,0,0,0.35) 60%, transparent 72%)',
        maskImage: 'radial-gradient(circle, #000 0%, #000 20%, rgba(0,0,0,0.35) 60%, transparent 72%)',
    });
    const arrow = document.createElement('div');
    Object.assign(arrow.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '0',
        height: '0',
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderBottom: '10px solid rgba(255, 255, 255, 0.98)',
        transform: 'translate(-50%, -21px)',
        filter: 'drop-shadow(0 0 2px rgba(76, 29, 149, 0.8))',
    });
    cone.append(beam, arrow);

    const pulseShell = document.createElement('span');
    setCenteredPosition(pulseShell, 24, 24);
    const pulse = document.createElement('span');
    pulse.className = 'animate-ping rounded-full';
    Object.assign(pulse.style, {
        position: 'absolute',
        inset: '0',
        border: '1px solid rgba(221, 214, 254, 0.72)',
        animationDuration: '2.6s',
        pointerEvents: 'none',
    });
    pulseShell.append(pulse);

    const dot = document.createElement('span');
    setCenteredPosition(dot, 16, 16);
    Object.assign(dot.style, {
        background: 'rgba(196, 181, 253, 0.98)',
        border: '3px solid rgba(255, 255, 255, 0.98)',
        borderRadius: '9999px',
        boxShadow: '0 0 0 1px rgba(76, 29, 149, 0.55), 0 0 12px rgba(167, 139, 250, 0.55)',
        zIndex: '3',
    });

    root.append(accuracyCircle, cone, pulseShell, dot);
    const marker = new maplibregl.Marker({ element: root, anchor: 'center' })
        .setLngLat([coordinates.longitude, coordinates.latitude])
        .addTo(map);

    return { marker, accuracyCircle, cone };
}

export function UserLocationMarker({
    map,
    position,
    accuracy,
    compassActive,
    heading,
    mapBearing,
}: UserLocationMarkerProps) {
    const markerPartsRef = useRef<MarkerParts | null>(null);
    const zoomHandlerRef = useRef<(() => void) | null>(null);
    const updateAccuracyRef = useRef<(() => void) | null>(null);
    const latitude = position?.coords.latitude ?? null;
    const longitude = position?.coords.longitude ?? null;
    const latitudeRef = useRef(latitude);
    const accuracyRef = useRef(accuracy);
    latitudeRef.current = latitude;
    accuracyRef.current = accuracy;

    useEffect(() => {
        if (!map) return;

        return () => {
            if (zoomHandlerRef.current) map.off('zoom', zoomHandlerRef.current);
            markerPartsRef.current?.marker.remove();
            markerPartsRef.current = null;
            zoomHandlerRef.current = null;
            updateAccuracyRef.current = null;
        };
    }, [map]);

    useEffect(() => {
        if (
            !map ||
            latitude === null ||
            longitude === null ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            markerPartsRef.current
        ) return;

        const parts = createMarkerParts(map, { latitude, longitude });
        markerPartsRef.current = parts;

        const updateAccuracy = () => {
            const currentLatitude = latitudeRef.current;
            const currentAccuracy = accuracyRef.current;
            if (currentLatitude === null || currentAccuracy === null || !Number.isFinite(currentAccuracy) || currentAccuracy > MAX_ACCURACY_METERS) {
                parts.accuracyCircle.style.display = 'none';
                return;
            }

            const radius = metersToPixels(currentAccuracy, currentLatitude, map.getZoom());
            const diameter = Math.max(MIN_ACCURACY_DIAMETER_PX, radius * 2);
            setCenteredPosition(parts.accuracyCircle, diameter, diameter);
            parts.accuracyCircle.style.display = 'block';
        };

        updateAccuracyRef.current = updateAccuracy;
        zoomHandlerRef.current = updateAccuracy;
        map.on('zoom', updateAccuracy);
        updateAccuracy();
    }, [latitude, longitude, map]);

    useEffect(() => {
        if (!map || (latitude !== null && longitude !== null) || !markerPartsRef.current) return;

        if (zoomHandlerRef.current) map.off('zoom', zoomHandlerRef.current);
        markerPartsRef.current.marker.remove();
        markerPartsRef.current = null;
        zoomHandlerRef.current = null;
        updateAccuracyRef.current = null;
    }, [latitude, longitude, map]);

    useEffect(() => {
        if (latitude === null || longitude === null || !markerPartsRef.current) return;
        markerPartsRef.current.marker.setLngLat([longitude, latitude]);
        updateAccuracyRef.current?.();
    }, [accuracy, latitude, longitude]);

    useEffect(() => {
        const parts = markerPartsRef.current;
        if (!map || !parts) return;

        if (!compassActive || heading === null || !Number.isFinite(heading)) {
            parts.cone.style.display = 'none';
            return;
        }

        const relativeHeading = normalizeAngle(heading - map.getBearing());
        parts.cone.style.display = 'block';
        parts.cone.style.transform = `translate(-50%, -50%) rotate(${relativeHeading}deg)`;
    }, [compassActive, heading, latitude, longitude, map, mapBearing]);

    return null;
}
