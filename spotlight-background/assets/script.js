/**
 * Spotlight Background
 *
 * Two stage follow-spots hung at the top of the frame, drawn in WebGL as
 * real light in a hazed room: a small hot lamp at each fixture, a cone of
 * lit smoke that fades with distance, and a soft pool
 * where each beam lands. On load the beams sweep in from the wings, cross
 * once over the headline and land on it; after that they follow the
 * pointer like spots worked by an operator, heavy and lagged, and drift
 * home to breathe on the headline when left alone. Press and hold pulls
 * both into a tight pin spot. The heading the light falls on catches it: a
 * highlight travels across the letterforms with each beam.
 *
 * Who owns what:
 *   GSAP   every motion value: the entrance timeline, the lagged aim
 *          (quickTo with a back ease for the overshoot), the pin spot and
 *          its elastic release, the idle return and sway, matchMedia
 *          (pointer, touch, reduced motion) and teardown. The frame loop
 *          runs on gsap.ticker.
 *   Shader reads those values as uniforms each frame and draws the light:
 *          cones, haze, pools, lamps, additive mixing and dither.
 *
 * Without WebGL or JavaScript the stylesheet's CSS rendition shows instead:
 * a lit, resting frame. Under reduced motion the WebGL frame is drawn once,
 * as a still.
 *
 * @plugins none (GSAP core, three.js for the canvas)
 * @techniques webgl-shader, spotlight, mouse-follow, load-sequence, ambient, pointer-effects, touch-gestures
 */

/* Every helper and shared value is declared before first use. The demo
   build obfuscates this file and turns function declarations into
   non-hoisted consts. */

/* Reads a numeric data attribute so that an explicit "0" is honoured. */
const SPOTLIGHT_NUM = function (value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    const n = parseFloat(value);
    return isFinite(n) ? n : fallback;
};

const SPOTLIGHT_CLAMP = function (value, min, max) {
    return value < min ? min : (value > max ? max : value);
};

const SPOTLIGHT_ON = function (value) {
    return value !== '0' && value !== 'false';
};

/* Any CSS colour (hex, rgb(), hsl(), oklch(), color-mix()...) to an sRGB
   triple in 0..1, by letting the browser paint it into one pixel. */
const SPOTLIGHT_COLOR = function (value, fallback) {
    try {
        const probe = document.createElement('canvas');
        probe.width = 1;
        probe.height = 1;
        const g = probe.getContext('2d', { willReadFrequently: true });
        g.fillStyle = fallback;
        g.fillStyle = (value || '').trim() || fallback;
        g.fillRect(0, 0, 1, 1);
        const px = g.getImageData(0, 0, 1, 1).data;
        return [px[0] / 255, px[1] / 255, px[2] / 255];
    } catch (error) {
        return [1, 1, 1];
    }
};

/* three.js logs a failed context as several console errors before it
   throws, so support is probed with a throwaway context first, and that
   context is released at once: browsers cap live contexts per page. */
const SPOTLIGHT_HAS_WEBGL = function () {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return false;
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
        return true;
    } catch (error) {
        return false;
    }
};

/* How the operator feels. The key spot answers in under a second; the gel
   spot takes half as long again, so the two separate while the pointer
   moves and re-converge after it stops. The back ease is the slight
   overshoot a heavy fixture makes when the operator stops it. */
const SPOTLIGHT_KEY_FOLLOW = { duration: 0.85, ease: 'back.out(1.5)' };
const SPOTLIGHT_GEL_FOLLOW = { duration: 1.3, ease: 'back.out(1.8)' };
const SPOTLIGHT_IDLE_AFTER = 2.5;

/* The haze clock the reduced-motion still is drawn at: a frame where the
   smoke has body in both beams. */
const SPOTLIGHT_STILL_TIME = 14;

/* ============================================================================
   SHADERS
   One full-screen triangle pair; everything is in the fragment shader. The
   strings are globals so a thumbnail page can reuse them unchanged.
   ============================================================================ */

const SPOTLIGHT_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const SPOTLIGHT_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2 uRes;        // layer size in CSS px
uniform float uDpr;
uniform float uTime;      // seconds, wrapped
uniform vec3 uGround;     // sRGB 0..1
uniform vec3 uKeyColor;   // sRGB 0..1
uniform vec3 uGelColor;
uniform vec4 uKeyGeo;     // apex.xy, land.xy  (CSS px, y down)
uniform vec4 uGelGeo;
uniform vec3 uKeyShape;   // pool half-width px, brightness, focus 0..1
uniform vec3 uGelShape;
uniform float uHaze;      // haze density, 0..~2

/* 3D simplex noise. Ashima Arts / Ian McEwan, MIT. */
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

/* Three octaves of the noise above: rolling smoke at three scales. The
   field lives in screen space, not beam space, so it is the same air
   whichever way a beam points: nothing streaks when a beam turns or
   widens, the beam just lights a different slice of it. */
float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.55;
    for (int i = 0; i < 3; i++) {
        sum += amp * snoise(p);
        p = p * 2.07 + vec3(19.1, -7.3, 3.7);
        amp *= 0.5;
    }
    return sum;
}

/* One fixture. Returns the light it puts into this pixel, before colour:
   x = light in the haze, y = the pool on the floor, z = the lamp itself. */
vec3 fixture(vec2 p, vec4 geo, vec3 shape) {
    vec2 apex = geo.xy;
    vec2 land = geo.zw;
    float halfW = max(shape.x, 4.0);
    float focus = shape.z;

    vec2 axis = land - apex;
    float len = max(length(axis), 1.0);
    vec2 dir = axis / len;
    vec2 nrm = vec2(-dir.y, dir.x);
    vec2 v = p - apex;
    float t = dot(v, dir);              // distance down the beam
    float s = dot(v, nrm);              // distance across it

    /* Cone radius grows from the lens (a few px) to the pool. */
    float radius = 4.0 + max(t, 0.0) * halfW / len;
    float u = abs(s) / radius;

    /* Seen side-on, a cone of lit haze is brightest down the middle,
       where the line of sight crosses the most of it: chord length. The
       edge is a soft lens edge, a little crisper when focused. */
    float chord = sqrt(max(1.0 - u * u, 0.0));
    float edge = smoothstep(1.0, mix(0.72, 0.86, focus), u);
    float start = smoothstep(0.0, 18.0, t);

    /* Brightness falls off with distance: inverse square over a widening
       cross-section reads as roughly 1 / distance in the air. */
    float fall = 1.7 / (1.0 + t / (0.14 * len));

    /* The beam stops where it meets the floor: fade across the pool's
       near half, measured on the floor's own vertical axis. */
    float floorY = (p.y - land.y) / (halfW * 0.3);
    float stopAt = (1.0 - smoothstep(-0.6, 0.9, floorY))
                 * (1.0 - smoothstep(len - 0.15 * halfW, len + 0.45 * halfW, t));

    float inside = edge * start * stopAt;
    float air = chord * inside * fall;

    /* The pool: a floor ellipse, flat-ish in the middle with a soft lens
       edge, plus a faint wide spill where light bounces off the floor. */
    /* An oblique beam throws a longer pool. */
    vec2 e = (p - land) / (vec2(1.0 + 0.5 * abs(dir.x), 0.3) * halfW);
    float q = length(e);
    float pool = smoothstep(1.0, mix(0.55, 0.8, focus), q) * (0.45 + 0.55 * exp(-q * q * 2.2));
    pool += 0.08 * exp(-q * q * 0.5);

    /* The lamp: a small hot lens with a soft bloom, thrown a little
       forward along the beam. */
    float dl = length(v);
    float lamp = exp(-dl * dl / 10.0) * 2.4
               + 0.5 / (1.0 + dl * dl / 140.0)
               + 0.025 * exp(-dl / 60.0);
    lamp *= 0.7 + 0.3 * smoothstep(-30.0, 30.0, t);

    return vec3(air, pool, lamp);
}

vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }

void main() {
    /* CSS px, origin top-left, y down: the same space the script aims in. */
    vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;

    vec3 key = fixture(p, uKeyGeo, uKeyShape) * uKeyShape.y;
    vec3 gel = fixture(p, uGelGeo, uGelShape) * uGelShape.y;

    /* Haze density, only computed where there is light to see it in. */
    float density = 1.0;
    float lit = key.x + gel.x;
    if (lit > 0.0005) {
        vec3 hp = vec3(p / 230.0, 0.0);
        hp.xy += vec2(uTime * 0.011, -uTime * 0.017);
        hp.z = uTime * 0.045;
        float n = fbm(hp);
        density = mix(1.0, 0.12 + 1.75 * smoothstep(-0.45, 0.55, n), clamp(uHaze, 0.0, 1.0));
        density *= 0.55 + 0.45 * clamp(uHaze, 0.0, 2.0);
    }

    vec3 keyLin = toLinear(uKeyColor);
    vec3 gelLin = toLinear(uGelColor);

    const float AIR = 0.26;
    const float POOL = 0.065;
    vec3 light = keyLin * (key.x * density * AIR + key.y * POOL + key.z)
               + gelLin * (gel.x * density * AIR + gel.y * POOL + gel.z);

    /* Additive light, soft-clipped so the crossing and the lamps roll off
       to white instead of hard-clipping. */
    vec3 ground = toLinear(uGround);
    vec3 col = ground + (1.0 - exp(-light * 1.15)) * (1.0 - ground);
    col = toSrgb(col);

    /* Dither last: one level of noise so the dark falloff never bands. */
    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    col += (ign - 0.5) / 255.0;

    gl_FragColor = vec4(col, 1.0);
}
`;

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initSpotlightBackground() {
    if (typeof gsap === 'undefined') {
        /* Without GSAP the CSS rendition stays on screen. */
        document.documentElement.classList.remove('gl');
        return;
    }

    const previousContext = window.gsapContext;
    const previousApi = window.SpotlightBackground;
    let instances = [];

    const createSpotlight = function (root, conditions, mediaContext) {
        const isMotion = conditions.isMotion;
        const isFine = conditions.isFine;
        const isTouch = isMotion && !isFine;

        const CONFIG = {
            beams: SPOTLIGHT_NUM(root.dataset.spotlightBeams, 2) >= 2 ? 2 : 1,
            follow: SPOTLIGHT_ON(root.dataset.spotlightFollow),
            idle: SPOTLIGHT_ON(root.dataset.spotlightIdle),
            entrance: SPOTLIGHT_ON(root.dataset.spotlightEntrance),
            intensity: SPOTLIGHT_CLAMP(SPOTLIGHT_NUM(root.dataset.spotlightIntensity, 1), 0, 1)
        };
        /* Ambient motion (sway, touch sweep, drifting haze). */
        const ambient = CONFIG.idle && isMotion;

        const host = root.parentElement || document.body;
        let target = null;
        if (root.dataset.spotlightTarget) {
            try {
                target = host.querySelector(root.dataset.spotlightTarget)
                    || document.querySelector(root.dataset.spotlightTarget);
            } catch (error) {
                target = null;
            }
        }
        if (!target) target = host.querySelector('h1, h2, h3');
        const names = CONFIG.beams === 2 ? ['key', 'gel'] : ['key'];

        /* -------------------------------------------------------------
           Renderer. One canvas, one full-screen quad, one shader.
           ------------------------------------------------------------- */
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
        } catch (error) {
            /* Support was probed first, so this is the page's context
               budget running out. The CSS rendition is still there. */
            return null;
        }
        const dprCap = isFine || !isMotion ? 2 : 1.5;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
        const canvas = renderer.domElement;
        canvas.className = 'spotlight__canvas';
        canvas.setAttribute('aria-hidden', 'true');
        root.insertBefore(canvas, root.firstChild);

        /* Colours and haze come from the CSS custom properties, read once
           here, so a restyle never touches this file. */
        const rootStyle = getComputedStyle(root);
        const readVar = function (name) { return rootStyle.getPropertyValue(name).trim(); };
        const ground = SPOTLIGHT_COLOR(readVar('--spotlight-ground') || rootStyle.backgroundColor, '#0a0a0a');
        const keyColor = SPOTLIGHT_COLOR(readVar('--spotlight-key'), '#fff1dc');
        const gelColor = SPOTLIGHT_COLOR(readVar('--spotlight-gel'), '#ff2d6f');
        const hazeBase = SPOTLIGHT_CLAMP(SPOTLIGHT_NUM(readVar('--spotlight-haze'), 0.6), 0, 1);
        renderer.setClearColor(new THREE.Color(ground[0], ground[1], ground[2]), 1);

        const uniforms = {
            uRes: { value: new THREE.Vector2(1, 1) },
            uDpr: { value: renderer.getPixelRatio() },
            uTime: { value: SPOTLIGHT_STILL_TIME },
            uGround: { value: new THREE.Vector3(ground[0], ground[1], ground[2]) },
            uKeyColor: { value: new THREE.Vector3(keyColor[0], keyColor[1], keyColor[2]) },
            uGelColor: { value: new THREE.Vector3(gelColor[0], gelColor[1], gelColor[2]) },
            uKeyGeo: { value: new THREE.Vector4(0, -100, 0, 0) },
            uGelGeo: { value: new THREE.Vector4(0, -100, 0, 0) },
            uKeyShape: { value: new THREE.Vector3(100, 0, 0) },
            uGelShape: { value: new THREE.Vector3(100, 0, 0) },
            uHaze: { value: hazeBase }
        };
        const geometry = new THREE.PlaneGeometry(2, 2);
        /* The shader writes sRGB itself, so no colour-space chunk: the
           colours above are handed over exactly as CSS defines them. */
        const material = new THREE.ShaderMaterial({
            vertexShader: SPOTLIGHT_VERTEX_SHADER,
            fragmentShader: SPOTLIGHT_FRAGMENT_SHADER,
            uniforms: uniforms,
            depthTest: false,
            depthWrite: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        const scene = new THREE.Scene();
        scene.add(mesh);
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        /* Everything the script writes to is restored exactly on revert. */
        const touched = [target, host]
            .filter(function (el, i, list) { return el && list.indexOf(el) === i; });
        const savedStyles = touched.map(function (el) { return el.getAttribute('style'); });
        const targetWasLit = target ? target.classList.contains('spotlight-lit') : false;
        const listeners = [];
        const observers = [];
        let destroyed = false;
        let contextLost = false;

        const on = function (el, type, fn, options) {
            const wrapped = mediaContext.add(null, fn);
            el.addEventListener(type, wrapped, options);
            listeners.push(function () { el.removeEventListener(type, wrapped, options); });
        };

        /* The heading keeps its own ink; the catch only ever adds light. */
        if (target) {
            target.style.setProperty('--spotlight-ink', getComputedStyle(target).color);
            target.style.setProperty('--spotlight-key-c', readVar('--spotlight-key') || '#fff');
            target.style.setProperty('--spotlight-gel-c', readVar('--spotlight-gel') || '#fff');
            target.style.setProperty('--spotlight-ga', '0');
            target.classList.add('spotlight-lit');
        }
        if (isTouch && CONFIG.follow) host.style.touchAction = 'pan-y';

        /* ---------------------------------------------------------------
           Geometry, in CSS px relative to the layer
           --------------------------------------------------------------- */
        const geo = {
            w: 0, h: 0, fy: 0, poolW: 300,
            fx: { key: 0, gel: 0 },
            home: { kx: 0, ky: 0, gx: 0, gy: 0 },
            tx: 0, ty: 0
        };

        const measure = function () {
            const rect = root.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            const narrow = w < 640;
            geo.w = w;
            geo.h = h;
            /* The lamps hang just inside the top edge, so they are seen. */
            geo.fy = SPOTLIGHT_CLAMP(h * 0.04, 16, 34);
            if (names.length === 2) {
                geo.fx.key = w * (narrow ? 0.14 : 0.27);
                geo.fx.gel = w * (narrow ? 0.86 : 0.73);
            } else {
                geo.fx.key = w * 0.5;
            }
            geo.poolW = SPOTLIGHT_CLAMP(w * (narrow ? 0.56 : 0.3), 190, 460);

            let cx = w / 2;
            let cy = h * 0.6;
            let spread = geo.poolW * 0.24;
            if (target) {
                const t = target.getBoundingClientRect();
                geo.tx = t.left - rect.left;
                geo.ty = t.top - rect.top;
                cx = geo.tx + t.width / 2;
                cy = geo.ty + t.height / 2;
                spread = Math.min(t.width * 0.2, geo.poolW * 0.24);
            }
            if (names.length === 2) {
                geo.home.kx = cx - spread;
                geo.home.gx = cx + spread;
            } else {
                geo.home.kx = cx;
                geo.home.gx = cx;
            }
            geo.home.ky = cy;
            geo.home.gy = cy;

            renderer.setSize(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), false);
            uniforms.uRes.value.set(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
            uniforms.uDpr.value = renderer.getPixelRatio();
        };

        /* ---------------------------------------------------------------
           State. GSAP tweens these plain numbers; render() hands them to
           the shader.
           --------------------------------------------------------------- */
        const S = { kx: 0, ky: 0, gx: 0, gy: 0, on: 0, focus: 0, sway: 0, sweep: 0, wide: 1 };
        const E = { kx: 0, ky: 0, gx: 0, gy: 0 };   // the entrance path
        let entering = false;
        let clock = SPOTLIGHT_STILL_TIME;           // haze time
        let swayClock = 0;
        let energy = 0;                             // pointer speed, decays
        let energySmooth = 0;
        let pointerSeen = false;

        const toKX = gsap.quickTo(S, 'kx', SPOTLIGHT_KEY_FOLLOW);
        const toKY = gsap.quickTo(S, 'ky', SPOTLIGHT_KEY_FOLLOW);
        const toGX = gsap.quickTo(S, 'gx', SPOTLIGHT_GEL_FOLLOW);
        const toGY = gsap.quickTo(S, 'gy', SPOTLIGHT_GEL_FOLLOW);

        /* jump: the key spot snaps (keyboard, resize); the gel still eases. */
        const aimTo = function (x, y, jump) {
            const yy = SPOTLIGHT_CLAMP(y, geo.h * 0.3, geo.h * 1.02);
            const xx = SPOTLIGHT_CLAMP(x, -geo.w * 0.05, geo.w * 1.05);
            const offset = names.length === 2 ? geo.poolW * 0.06 : 0;
            if (jump) {
                toKX(xx - offset, xx - offset);
                toKY(yy, yy);
            } else {
                toKX(xx - offset);
                toKY(yy);
            }
            toGX(xx + offset);
            toGY(yy);
        };

        const aimHome = function (instant) {
            if (instant) {
                toKX(geo.home.kx, geo.home.kx);
                toKY(geo.home.ky, geo.home.ky);
                toGX(geo.home.gx, geo.home.gx);
                toGY(geo.home.gy, geo.home.gy);
                return;
            }
            toKX(geo.home.kx);
            toKY(geo.home.ky);
            toGX(geo.home.gx);
            toGY(geo.home.gy);
        };

        /* ---------------------------------------------------------------
           Render: motion values in, one frame out.
           --------------------------------------------------------------- */
        const lastProps = {};
        const writeProp = function (name, value) {
            if (lastProps[name] === value) return;
            lastProps[name] = value;
            target.style.setProperty(name, value);
        };

        const render = function () {
            if (destroyed || contextLost) return;
            const I = CONFIG.intensity;
            const f = S.focus;
            /* Speed widens the cones a little; the pin spot narrows them. */
            const spread = S.wide * (1 + 0.28 * energySmooth * I) * (1 - 0.62 * f);
            const breathe = 1 + 0.05 * Math.sin(swayClock * 0.7) * S.sway;
            const bright = S.on * I * (1 + 0.25 * f) * breathe;
            const halfW = geo.poolW * spread * 0.5;

            uniforms.uTime.value = clock;
            /* Speed thickens the haze. */
            uniforms.uHaze.value = hazeBase * (1 + 1.1 * energySmooth * I);

            ['key', 'gel'].forEach(function (name, i) {
                const isKey = name === 'key';
                const geoU = isKey ? uniforms.uKeyGeo.value : uniforms.uGelGeo.value;
                const shapeU = isKey ? uniforms.uKeyShape.value : uniforms.uGelShape.value;
                if (names.indexOf(name) < 0) {
                    shapeU.set(halfW, 0, f);
                    return;
                }
                let ax = entering ? (isKey ? E.kx : E.gx) : (isKey ? S.kx : S.gx);
                const ay = entering ? (isKey ? E.ky : E.gy) : (isKey ? S.ky : S.gy);

                /* Touch screens: the operator sweeps on their own, the two
                   spots crossing each other over the content. */
                if (S.sweep > 0) {
                    ax += Math.sin(swayClock * 0.42 + i * 2.7) * geo.w * 0.26 * S.sweep * I;
                }

                const fx = geo.fx[name];
                const dx = ax - fx;
                const dy = Math.max(40, ay - geo.fy);
                /* Idle breathing: a two-degree sway about the fixture. */
                const sway = S.sway * I * (2 * Math.PI / 180) * Math.sin(swayClock * 0.55 + i * 1.9);
                const angle = Math.atan2(dx, dy) + sway;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const px = fx + Math.sin(angle) * dist;
                const py = geo.fy + Math.cos(angle) * dist;

                geoU.set(fx, geo.fy, px, py);
                shapeU.set(halfW, bright, f);

                if (target) {
                    /* The heading's catch: centred where this beam lands,
                       sized to its pool, brightening the type it crosses. */
                    const p = isKey ? '--spotlight-k' : '--spotlight-g';
                    const rx = halfW * 1.25;
                    writeProp(p + 'x', (px - geo.tx).toFixed(1) + 'px');
                    writeProp(p + 'y', (py - geo.ty).toFixed(1) + 'px');
                    writeProp(p + 'r', rx.toFixed(1) + 'px');
                    writeProp(p + 'ry', (rx * 0.62).toFixed(1) + 'px');
                    writeProp(p + 'a', SPOTLIGHT_CLAMP(S.on * I * (0.9 + 0.1 * f), 0, 1).toFixed(3));
                }
            });

            renderer.render(scene, camera);
        };

        /* ---------------------------------------------------------------
           Loop: on gsap.ticker, so tweens are current when the frame
           draws. Runs only while on screen, tab visible, not paused, and
           something is moving (ambient motion counts).
           --------------------------------------------------------------- */
        let running = false;
        let visible = true;
        let paused = false;
        let quietFrames = 0;

        const isActive = function () {
            return ambient || entering || S.sway > 0.001 || S.sweep > 0.001 || energySmooth > 0.002
                || gsap.isTweening(S) || gsap.isTweening(E);
        };

        const tick = function (time, deltaTime) {
            if (!root.isConnected) {
                stopLoop();
                return;
            }
            const dt = SPOTLIGHT_CLAMP(deltaTime || 16.7, 0, 50) / 1000;
            /* The haze drifts only while ambient motion is on. */
            if (ambient) {
                clock += dt;
                if (clock > 1000) clock -= 1000;
            }
            swayClock += dt;
            if (swayClock > 1e4) swayClock -= 1e4;
            energy *= Math.exp(-dt * 4);
            energySmooth += (energy - energySmooth) * Math.min(1, dt * 6);
            if (energySmooth < 0.002 && energy < 0.002) { energy = 0; energySmooth = 0; }
            render();
            if (isActive()) {
                quietFrames = 0;
            } else if (++quietFrames > 3) {
                stopLoop();
            }
        };

        const stopLoop = function () {
            if (!running) return;
            running = false;
            gsap.ticker.remove(tick);
        };

        const wake = function () {
            if (running || paused || !visible || document.hidden || !isMotion || destroyed || contextLost) return;
            running = true;
            quietFrames = 0;
            gsap.ticker.add(tick);
        };

        /* ---------------------------------------------------------------
           Idle: home to the heading, then breathe (or sweep on touch).
           --------------------------------------------------------------- */
        const goIdle = function () {
            aimHome(false);
            pointerSeen = false;
            if (ambient) {
                gsap.to(S, isTouch
                    ? { sweep: 1, duration: 2.4, ease: 'sine.inOut', overwrite: 'auto' }
                    : { sway: 1, duration: 1.6, ease: 'sine.inOut', overwrite: 'auto' });
            }
            wake();
        };
        const idleCall = gsap.delayedCall(SPOTLIGHT_IDLE_AFTER, goIdle).pause();

        const noteInput = function () {
            if (S.sway > 0 || S.sweep > 0) {
                gsap.to(S, { sway: 0, sweep: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
            }
            if (isMotion && !paused) idleCall.restart(true);
        };

        /* ---------------------------------------------------------------
           Focus: hold for a pin spot, release springs back.
           --------------------------------------------------------------- */
        const focus = function (onState) {
            if (!isMotion) {
                S.focus = onState ? 1 : 0;
                render();
                return;
            }
            if (onState) {
                gsap.to(S, { focus: 1, duration: 0.32, ease: 'power3.out', overwrite: 'auto' });
            } else {
                gsap.to(S, { focus: 0, duration: 1.1, ease: 'elastic.out(1, 0.42)', overwrite: 'auto' });
            }
            wake();
        };

        const pulse = function () {
            gsap.timeline()
                .to(S, { focus: 1, duration: 0.22, ease: 'power3.out', overwrite: 'auto' })
                .to(S, { focus: 0, duration: 1.1, ease: 'elastic.out(1, 0.42)' });
            wake();
        };

        /* ---------------------------------------------------------------
           Entrance: the lamps strike, the beams swing in from the wings,
           cross once over the heading and land.
           --------------------------------------------------------------- */
        let entrance = null;
        let pendingAim = null;

        const land = function () {
            entering = false;
            entrance = null;
            root.classList.add('is-landed');
            if (pendingAim) {
                aimTo(pendingAim.x, pendingAim.y, false);
                pendingAim = null;
            }
            if (!paused) idleCall.restart(true);
            wake();
        };

        const playEntrance = function () {
            if (entrance) entrance.kill();
            root.classList.remove('is-landed');
            aimHome(true);
            const w = geo.w;
            const h = geo.h;
            const crossBy = Math.max(w * 0.16, geo.poolW * 0.55);
            E.kx = -w * 0.18;
            E.gx = names.length === 2 ? w * 1.18 : -w * 0.18;
            E.ky = h * 0.2;
            E.gy = h * 0.2;
            S.on = 0;
            S.sway = 0;
            S.sweep = 0;
            S.wide = 1.3;
            entering = true;
            entrance = gsap.timeline({ onComplete: land })
                .to(S, { on: 1, duration: 0.4, ease: 'power2.out' }, 0)
                .to(E, {
                    kx: geo.home.kx + crossBy,
                    gx: names.length === 2 ? geo.home.gx - crossBy : geo.home.kx + crossBy,
                    ky: geo.home.ky - h * 0.05,
                    gy: geo.home.gy - h * 0.05,
                    duration: 0.9,
                    ease: 'expo.inOut'
                }, 0)
                .to(E, {
                    kx: geo.home.kx,
                    gx: names.length === 2 ? geo.home.gx : geo.home.kx,
                    ky: geo.home.ky,
                    gy: geo.home.gy,
                    duration: 0.6,
                    ease: 'expo.inOut'
                }, 0.9)
                .to(S, { wide: 1, duration: 1.1, ease: 'power2.inOut' }, 0.4);
            if (paused) entrance.pause();
            wake();
        };

        /* ---------------------------------------------------------------
           Input
           --------------------------------------------------------------- */
        const localPoint = function (clientX, clientY) {
            const rect = root.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
            return { x: x, y: y };
        };

        let lastMove = null;
        const feedSpeed = function (x, y) {
            const now = performance.now();
            if (lastMove) {
                const dt = Math.max(8, now - lastMove.t);
                const speed = Math.hypot(x - lastMove.x, y - lastMove.y) / dt * 1000;
                energy = Math.max(energy, SPOTLIGHT_CLAMP(speed / 2600, 0, 1));
            }
            lastMove = { x: x, y: y, t: now };
        };

        const isControl = function (el) {
            return !!(el && el.closest && el.closest('a, button, input, select, textarea, label, [contenteditable]'));
        };

        if (isMotion && isFine) {
            if (CONFIG.follow) {
                on(window, 'pointermove', function (event) {
                    if (event.pointerType === 'touch') return;
                    const p = localPoint(event.clientX, event.clientY);
                    if (!p) return;
                    pointerSeen = true;
                    feedSpeed(p.x, p.y);
                    noteInput();
                    if (entering) {
                        pendingAim = p;
                        return;
                    }
                    aimTo(p.x, p.y, false);
                    wake();
                }, { passive: true });
            }

            on(window, 'pointerdown', function (event) {
                if (event.pointerType === 'touch' || event.button !== 0) return;
                if (isControl(event.target) || !localPoint(event.clientX, event.clientY)) return;
                noteInput();
                focus(true);
            });
            const release = function () { if (S.focus > 0 || gsap.isTweening(S)) focus(false); };
            on(window, 'pointerup', release);
            on(window, 'pointercancel', release);
            on(window, 'blur', release);
        }

        if (isTouch) {
            let touchStart = null;
            on(host, 'touchstart', function (event) {
                const t = event.touches[0];
                if (!t) return;
                touchStart = { x: t.clientX, y: t.clientY, time: performance.now(), moved: false };
                noteInput();
            }, { passive: true });
            on(host, 'touchmove', function (event) {
                const t = event.touches[0];
                if (!t || !touchStart) return;
                if (Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > 10) touchStart.moved = true;
                if (!CONFIG.follow) return;
                const p = localPoint(t.clientX, t.clientY);
                if (!p || entering) return;
                noteInput();
                aimTo(p.x, p.y, false);
                wake();
            }, { passive: true });
            on(host, 'touchend', function (event) {
                if (!touchStart) return;
                const quick = performance.now() - touchStart.time < 320;
                const tapped = !touchStart.moved && quick && !isControl(event.target);
                const t = event.changedTouches[0];
                touchStart = null;
                if (!tapped || entering) return;
                if (CONFIG.follow && t) {
                    const p = localPoint(t.clientX, t.clientY);
                    if (p) aimTo(p.x, p.y, false);
                }
                pulse();
            }, { passive: true });
        }

        /* Keyboard: an opted-in focusable ancestor (data-spotlight-keys).
           Arrows jump the key spot a step; hold Space or Enter to focus. */
        const keysEl = root.closest('[data-spotlight-keys]');
        if (keysEl) {
            on(keysEl, 'keydown', function (event) {
                if (event.target !== keysEl) return;
                const stepX = geo.w * 0.08;
                const stepY = geo.h * 0.08;
                const moves = { ArrowLeft: [-stepX, 0], ArrowRight: [stepX, 0], ArrowUp: [0, -stepY], ArrowDown: [0, stepY] };
                if (moves[event.key] && CONFIG.follow) {
                    event.preventDefault();
                    const offset = names.length === 2 ? geo.poolW * 0.06 : 0;
                    aimTo(S.kx + offset + moves[event.key][0], S.ky + moves[event.key][1], true);
                    if (!isMotion) { S.gx = S.kx + offset * 2; S.gy = S.ky; render(); }
                    noteInput();
                    wake();
                } else if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    if (!event.repeat) { noteInput(); focus(true); }
                } else if (event.key === 'Escape') {
                    aimHome(!isMotion);
                    if (!isMotion) { Object.assign(S, { kx: geo.home.kx, ky: geo.home.ky, gx: geo.home.gx, gy: geo.home.gy }); render(); }
                    wake();
                }
            });
            on(keysEl, 'keyup', function (event) {
                if (event.target !== keysEl) return;
                if (event.key === ' ' || event.key === 'Enter') focus(false);
            });
            on(keysEl, 'blur', function () { if (S.focus > 0) focus(false); });
        }

        /* ---------------------------------------------------------------
           Size, visibility, context loss
           --------------------------------------------------------------- */
        const relayout = function () {
            if (destroyed) return;
            measure();
            if (!pointerSeen || !isMotion) {
                aimHome(true);
                S.kx = geo.home.kx; S.ky = geo.home.ky; S.gx = geo.home.gx; S.gy = geo.home.gy;
            }
            render();
            wake();
        };

        if (typeof ResizeObserver !== 'undefined') {
            let first = true;
            const ro = new ResizeObserver(function () {
                if (first) { first = false; return; }
                relayout();
            });
            ro.observe(root);
            if (target) ro.observe(target);
            observers.push(ro);
        }
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { if (root.isConnected && !destroyed) relayout(); });
        }

        if (typeof IntersectionObserver !== 'undefined') {
            const io = new IntersectionObserver(function (entries) {
                visible = entries[entries.length - 1].isIntersecting;
                if (visible) wake(); else stopLoop();
            }, { threshold: 0 });
            io.observe(root);
            observers.push(io);
        }
        on(document, 'visibilitychange', function () {
            if (document.hidden) stopLoop(); else wake();
        });

        /* A lost context (GPU reset, too many tabs) pauses drawing; three
           rebuilds its programs on restore and the next frame catches up. */
        on(canvas, 'webglcontextlost', function (event) {
            event.preventDefault();
            contextLost = true;
            stopLoop();
        });
        on(canvas, 'webglcontextrestored', function () {
            contextLost = false;
            render();
            wake();
        });

        /* ---------------------------------------------------------------
           Start
           --------------------------------------------------------------- */
        measure();
        aimHome(true);
        S.kx = geo.home.kx; S.ky = geo.home.ky; S.gx = geo.home.gx; S.gy = geo.home.gy;

        if (isMotion && CONFIG.entrance) {
            playEntrance();
            render();
        } else {
            /* Reduced motion (or no entrance): the landed frame, drawn now.
               Under reduced motion it is the only frame ever drawn, apart
               from redraws on resize or a keyboard aim. */
            S.on = 1;
            render();
            root.classList.add('is-landed');
            if (isMotion) idleCall.restart(true);
            wake();
        }
        root.classList.add('is-live');

        return {
            aim: function (x, y) {
                if (x === undefined || x === null) {
                    aimHome(!isMotion);
                    if (!isMotion) Object.assign(S, { kx: geo.home.kx, ky: geo.home.ky, gx: geo.home.gx, gy: geo.home.gy });
                } else {
                    const px = SPOTLIGHT_NUM(x, 0.5) * geo.w;
                    const py = SPOTLIGHT_NUM(y, 0.6) * geo.h;
                    pointerSeen = true;
                    if (isMotion) {
                        aimTo(px, py, false);
                    } else {
                        S.kx = px; S.ky = py; S.gx = px; S.gy = py;
                    }
                    noteInput();
                }
                if (isMotion) wake(); else render();
            },
            focus: focus,
            replay: function () {
                if (!isMotion) return;
                pointerSeen = false;
                measure();
                playEntrance();
            },
            pause: function () {
                paused = true;
                stopLoop();
                if (entrance) entrance.pause();
                idleCall.pause();
            },
            play: function () {
                if (!paused) return;
                paused = false;
                if (entrance) entrance.resume();
                else if (isMotion) idleCall.restart(true);
                wake();
            },
            destroy: function () {
                stopLoop();
                destroyed = true;
                if (entrance) entrance.kill();
                idleCall.kill();
                gsap.killTweensOf([S, E]);
                listeners.forEach(function (off) { off(); });
                observers.forEach(function (o) { o.disconnect(); });

                /* Release the GPU by hand: dropped references do not free
                   it, and a page may only hold a handful of contexts. */
                geometry.dispose();
                material.dispose();
                renderer.dispose();
                renderer.forceContextLoss();
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);

                root.classList.remove('is-live', 'is-landed');
                if (target && !targetWasLit) target.classList.remove('spotlight-lit');
                /* Put back the exact inline styles the page had. */
                touched.forEach(function (el, i) {
                    if (!savedStyles[i]) el.removeAttribute('style');
                    else el.setAttribute('style', savedStyles[i]);
                });
            }
        };
    };

    const ctx = gsap.context(function spotlightContext(rootContext) {
        const mm = gsap.matchMedia();

        mm.add({
            isFine: '(pointer: fine) and (prefers-reduced-motion: no-preference)',
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function spotlightMedia(context) {
            /* No three.js or no WebGL: the CSS rendition is the product.
               The head probe hid it on the promise of a canvas; take the
               promise back. */
            if (typeof THREE === 'undefined' || !SPOTLIGHT_HAS_WEBGL()) {
                document.documentElement.classList.remove('gl');
                return;
            }
            const created = [];
            document.querySelectorAll('[data-spotlight]').forEach(function (root) {
                const instance = createSpotlight(root, context.conditions, context);
                if (instance) created.push(instance);
            });
            instances = created;
            if (!created.length) document.documentElement.classList.remove('gl');

            return function cleanup() {
                created.forEach(function (instance) { instance.destroy(); });
                if (instances === created) instances = [];
            };
        });

        /* revert(), never kill(): kill() skips the cleanup above, which is
           where the WebGL context is released. */
        const handleUnload = function () { rootContext.revert(); };
        window.addEventListener('beforeunload', handleUnload);
        return function cleanupPage() {
            window.removeEventListener('beforeunload', handleUnload);
            /* After a revert the CSS rendition is what the layer shows. */
            document.documentElement.classList.remove('gl');
            if (window.gsapContext === rootContext) {
                if (previousContext === undefined) delete window.gsapContext;
                else window.gsapContext = previousContext;
            }
            if (window.SpotlightBackground === api) {
                if (previousApi === undefined) delete window.SpotlightBackground;
                else window.SpotlightBackground = previousApi;
            }
        };
    });

    /* One namespace for every [data-spotlight] layer on the page. */
    const api = {
        aim: function (x, y) { instances.forEach(function (i) { i.aim(x, y); }); },
        focus: function (onState) { instances.forEach(function (i) { i.focus(!!onState); }); },
        replay: function () { instances.forEach(function (i) { i.replay(); }); },
        pause: function () { instances.forEach(function (i) { i.pause(); }); },
        play: function () { instances.forEach(function (i) { i.play(); }); },
        revert: function () { ctx.revert(); }
    };
    window.SpotlightBackground = api;
    window.gsapContext = ctx;
});
