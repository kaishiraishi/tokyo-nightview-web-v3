(() => {
  const cfg = JSON.parse(localStorage.getItem('__fake') || '{}');
  const geo = cfg.geo || { lat: 35.6600, lng: 139.3700, acc: 15 };
  const heading = cfg.heading ?? 42;
  try { Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 }); } catch {}
  window.ontouchstart = null;
  const pos = () => ({ coords: { latitude: geo.lat, longitude: geo.lng, accuracy: geo.acc, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
  const g = {
    getCurrentPosition: (ok, err) => setTimeout(() => cfg.geoDenied ? err && err({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' }) : ok(pos()), 300),
    watchPosition: (ok, err) => { const id = setInterval(() => cfg.geoDenied ? err && err({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' }) : ok(pos()), 1000); setTimeout(() => cfg.geoDenied ? err && err({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' }) : ok(pos()), 300); return id; },
    clearWatch: (id) => clearInterval(id),
  };
  try { Object.defineProperty(Navigator.prototype, 'geolocation', { get: () => g }); } catch {}
  if (cfg.noSensor) return;
  setInterval(() => {
    for (const type of ['deviceorientationabsolute', 'deviceorientation']) {
      const e = new Event(type);
      Object.assign(e, { alpha: (360 - heading) % 360, beta: 0, gamma: 0, absolute: true, webkitCompassHeading: heading, webkitCompassAccuracy: cfg.lowAcc ? 40 : 5 });
      window.dispatchEvent(e);
    }
  }, 100);
})();
