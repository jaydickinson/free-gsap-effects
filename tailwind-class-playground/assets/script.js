/**
 * Tailwind Component Remixer
 *
 * Combines curated Tailwind class pools into fresh component recipes, then
 * animates the resulting geometry and visual styles as one transition.
 *
 * @plugins Flip
 * @techniques class-recipes, class-mutation, flip-layout, clipboard
 */

(function onReady(init) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(function initTailwindComponentRemixer() {
    if (typeof gsap === 'undefined' || typeof Flip === 'undefined') {
        document.documentElement.classList.remove('has-js');
        return;
    }

    gsap.registerPlugin(Flip);
    document.documentElement.classList.add('has-js');
    const previousContext = window.gsapContext;
    const previousThumbnail = window.__thumbnail;

    const ctx = gsap.context(function gsapContextCallback(rootContext) {
        const mm = gsap.matchMedia();
        const liveStates = new WeakMap();

        mm.add({
            isMotion: '(prefers-reduced-motion: no-preference)',
            isReduced: '(prefers-reduced-motion: reduce)'
        }, function matchMediaCallback(context) {
            const { isMotion } = context.conditions;
            const handlers = [];
            const cleanups = [];

            const on = function (element, type, callback) {
                if (!element) return;
                const listener = context.add(null, callback);
                element.addEventListener(type, listener);
                handlers.push(function () { element.removeEventListener(type, listener); });
            };

            document.querySelectorAll('[data-tailwind-playground]').forEach(function initRemixer(container) {
                const choices = Array.from(container.querySelectorAll('[data-tw-choice]'));
                const nodes = Array.from(container.querySelectorAll('[data-tw-node]'));
                const copyButton = container.querySelector('[data-tw-copy]');
                const copyLabel = container.querySelector('[data-copy-label]');
                const remixButton = container.querySelector('[data-tw-remix]');
                const status = container.querySelector('[data-tw-status]');
                const recipeStatus = container.querySelector('[data-tw-recipe-status]');
                const codeOutput = container.querySelector('[data-tw-code-output]');
                const activeCount = container.querySelector('[data-active-count]');
                const originalClasses = new Map(nodes.map(function (node) { return [node.dataset.twNode, node.className]; }));
                const originalPressed = new Map(choices.map(function (choice) { return [choice, choice.getAttribute('aria-pressed')]; }));
                let lastRemixSignature = '';
                let activeFlip = null;
                let activeStyleTweens = [];
                let transitionBusy = false;
                let pendingMutation = null;
                let transitionEnd = null;
                let copyReset = null;
                let mounted = true;
                const colorCanvas = document.createElement('canvas');
                colorCanvas.width = 1;
                colorCanvas.height = 1;
                const colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });

                const normalizedColor = function (value) {
                    if (!colorContext) return value;
                    colorContext.clearRect(0, 0, 1, 1);
                    colorContext.fillStyle = 'rgba(0, 0, 0, 0)';
                    colorContext.fillStyle = value;
                    colorContext.fillRect(0, 0, 1, 1);
                    const channels = colorContext.getImageData(0, 0, 1, 1).data;
                    return 'rgba(' + channels[0] + ', ' + channels[1] + ', ' + channels[2] + ', ' + (channels[3] / 255) + ')';
                };

                const parseRecipe = function (value) {
                    const recipe = new Map();
                    String(value || '').split(';').forEach(function (assignment) {
                        const divider = assignment.indexOf('|');
                        if (divider < 1) return;
                        const name = assignment.slice(0, divider).trim();
                        const classes = assignment.slice(divider + 1).trim().split(/\s+/).filter(Boolean);
                        recipe.set(name, classes);
                    });
                    return recipe;
                };

                const nodeByName = function (name) {
                    return container.querySelector('[data-tw-node="' + name + '"]');
                };

                const normalizeClasses = function (value) {
                    return Array.from(new Set(String(value || '').trim().split(/\s+/).filter(Boolean))).join(' ');
                };

                const randomIndex = function (length) {
                    if (window.crypto && window.crypto.getRandomValues) {
                        const value = new Uint32Array(1);
                        window.crypto.getRandomValues(value);
                        return value[0] % length;
                    }
                    return Math.floor(Math.random() * length);
                };

                const randomItem = function (items) { return items[randomIndex(items.length)]; };
                const artHost = container.querySelector('[data-tw-art]');
                const originalArt = artHost.outerHTML;
                let currentArt = originalArt;
                let artFamily = 'Orbits';
                let paletteIndex = 0;
                let artTween = null;
                const palettes = [
                    { ground: '#24205b', line: '#a5b4fc', solid: '#c7d2fe', accent: '#fb923c', light: 'text-indigo-800', dark: 'text-indigo-200', button: 'bg-indigo-700 text-white' },
                    { ground: '#103e3a', line: '#5eead4', solid: '#99f6e4', accent: '#fcd34d', light: 'text-teal-800', dark: 'text-teal-200', button: 'bg-teal-800 text-white' },
                    { ground: '#531c36', line: '#f9a8d4', solid: '#fbcfe8', accent: '#fda4af', light: 'text-pink-800', dark: 'text-pink-200', button: 'bg-pink-800 text-white' },
                    { ground: '#153d61', line: '#7dd3fc', solid: '#bae6fd', accent: '#fbbf24', light: 'text-sky-800', dark: 'text-sky-200', button: 'bg-sky-800 text-white' },
                    { ground: '#423126', line: '#fcd34d', solid: '#fde68a', accent: '#a3e635', light: 'text-amber-900', dark: 'text-amber-200', button: 'bg-amber-900 text-white' },
                    { ground: '#2e3340', line: '#cbd5e1', solid: '#f1f5f9', accent: '#a3e635', light: 'text-slate-800', dark: 'text-slate-200', button: 'bg-slate-800 text-white' }
                ];
                const artFamilies = ['Orbits', 'Contours', 'Waves', 'Constellation', 'Tiles', 'Weave'];
                const generateArt = function (family, palette) {
                    const n = function (min, max) { return min + randomIndex(max - min + 1); };
                    let drawing = '';
                    const circle = function (x, y, r, fill) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"/>'; };
                    if (family === 'Orbits') {
                        drawing = '<g fill="none" stroke="' + palette.line + '" stroke-width="1.5" transform="rotate(' + n(-40, 40) + ' 200 200)">';
                        for (let i = 0; i < 6; i++) drawing += '<ellipse cx="200" cy="200" rx="' + (55 + i * 25) + '" ry="170"/>';
                        for (let i = 0; i < 4; i++) drawing += '<ellipse cx="200" cy="200" rx="175" ry="' + (35 + i * 40) + '"/>';
                        drawing += '</g>' + circle(200, 200, n(26, 52), palette.solid) + circle(n(265, 320), n(75, 145), n(10, 18), palette.accent);
                    } else if (family === 'Contours') {
                        const phase = n(0, 60) / 10;
                        const cx = n(145, 235), cy = n(155, 235);
                        for (let ring = 13; ring > 0; ring--) {
                            let points = '';
                            for (let step = 0; step <= 100; step++) {
                                const angle = step / 100 * Math.PI * 2;
                                const radius = ring * 18 + Math.sin(angle * 3 + phase) * ring * 2.4 + Math.cos(angle * 5) * 6;
                                points += (cx + Math.cos(angle) * radius).toFixed(1) + ',' + (cy + Math.sin(angle) * radius * 0.84).toFixed(1) + ' ';
                            }
                            drawing += '<polygon points="' + points + '" fill="' + (ring === 1 ? palette.accent : 'none') + '" stroke="' + palette.line + '" stroke-width="1.5"/>';
                        }
                    } else if (family === 'Waves') {
                        const bend = n(-90, 90);
                        for (let i = 0; i < 12; i++) {
                            const y = i * 38 - 60;
                            drawing += '<path d="M-30 ' + y + ' C100 ' + (y + 200 + bend) + ' 280 ' + (y - 120) + ' 430 ' + (y + 90) + '" fill="none" stroke="' + (i % 4 === 0 ? palette.accent : palette.line) + '" stroke-width="' + (i % 4 === 0 ? 13 : 2) + '"/>';
                        }
                    } else if (family === 'Constellation') {
                        const points = Array.from({ length: 16 }, function () { return [n(30, 370), n(30, 370)]; });
                        points.forEach(function (point, i) {
                            points.slice(i + 1).forEach(function (other) {
                                if (Math.hypot(point[0] - other[0], point[1] - other[1]) < 145) drawing += '<path d="M' + point.join(' ') + ' L' + other.join(' ') + '" stroke="' + palette.line + '" stroke-width="1" opacity="0.5"/>';
                            });
                            drawing += circle(point[0], point[1], i % 5 === 0 ? 9 : 3, i % 5 === 0 ? palette.accent : palette.solid);
                            if (i % 5 === 0) drawing += '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="20" fill="none" stroke="' + palette.line + '" opacity="0.5"/>';
                        });
                    } else if (family === 'Tiles') {
                        const size = randomItem([80, 100]);
                        for (let y = 0; y < 400; y += size) for (let x = 0; x < 400; x += size) {
                            drawing += '<g transform="translate(' + x + ' ' + y + ') rotate(' + (n(0, 3) * 90) + ' ' + size / 2 + ' ' + size / 2 + ')"><path d="M0 0 H' + size + ' A' + size + ' ' + size + ' 0 0 1 0 ' + size + ' Z" fill="' + (n(0, 3) === 0 ? palette.accent : palette.line) + '"/><path d="M0 ' + size / 2 + ' A' + size / 2 + ' ' + size / 2 + ' 0 0 0 ' + size / 2 + ' 0" fill="none" stroke="' + palette.ground + '" stroke-width="2"/></g>';
                        }
                    } else {
                        const spacing = n(23, 35);
                        drawing = '<g transform="rotate(' + randomItem([-30, 30, 45]) + ' 200 200)">';
                        for (let i = -200; i <= 600; i += spacing) drawing += '<path d="M' + i + ' -200 V600" stroke="' + palette.line + '" stroke-width="' + Math.round(spacing * 0.45) + '"/>';
                        for (let y = -200; y <= 600; y += spacing * 2) {
                            drawing += '<path d="M-200 ' + y + ' H600" stroke="' + palette.ground + '" stroke-width="' + spacing * 0.6 + '"/>';
                            drawing += '<path d="M-200 ' + y + ' H600" stroke="' + palette.accent + '" stroke-width="' + spacing * 0.3 + '"/>';
                        }
                        drawing += '</g>';
                    }
                    return '<svg data-tw-art data-art-family="' + family + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 h-full w-full" role="img" aria-label="' + family + ': a generative network illustration"><rect width="400" height="400" fill="' + palette.ground + '"/>' + drawing + '</svg>';
                };
                const clearOutgoingArt = function () {
                    container.querySelectorAll('[data-tw-art-outgoing]').forEach(function (node) { node.remove(); });
                };
                const renderArt = function (animate) {
                    if (artTween) { artTween.progress(1).kill(); artTween = null; }
                    clearOutgoingArt();
                    const old = container.querySelector('[data-tw-art]');
                    if (!animate || !isMotion) {
                        old.outerHTML = currentArt;
                        return;
                    }
                    // Keep the opaque outgoing illustration beneath the incoming SVG.
                    // Fading both layers would expose the media background mid-transition.
                    old.removeAttribute('data-tw-art');
                    old.setAttribute('data-tw-art-outgoing', '');
                    old.setAttribute('aria-hidden', 'true');
                    old.insertAdjacentHTML('afterend', currentArt);
                    const fresh = container.querySelector('[data-tw-art]');
                    artTween = gsap.fromTo(fresh, { opacity: 0 }, {
                        opacity: 1, duration: 0.58, ease: 'power2.inOut',
                        clearProps: 'opacity',
                        onComplete: function () { clearOutgoingArt(); artTween = null; }
                    });
                };
                const adaptContrast = function () {
                    const surface = currentChoice('surface');
                    const dark = surface && ['Midnight', 'Ink'].includes(surface.textContent.trim());
                    const palette = palettes[paletteIndex];
                    const tones = /\btext-(?:slate|indigo|rose|emerald|amber|cyan|teal|pink|sky|zinc)-\d+\b|\btext-white\b/g;
                    ['title', 'description', 'eyebrow'].forEach(function (name) {
                        const source = customOverrides.get(name) || composedClasses(name);
                        customOverrides.set(name, normalizeClasses(source.replace(tones, '') + ' ' + (name === 'title' ? (dark ? palette.dark : palette.light) : (dark ? 'text-slate-300' : 'text-slate-600'))));
                    });
                    const source = customOverrides.get('action') || composedClasses('action');
                    customOverrides.set('action', normalizeClasses(source.replace(tones, '').replace(/\bbg-[a-z]+-\d+\b|\bbg-white\b/g, '') + ' ' + palette.button));
                };
                const structuralNodes = ['card', 'media', 'body'].map(nodeByName).filter(Boolean);
                const animatedStyles = [
                    { js: 'backgroundColor', css: 'background-color', color: true },
                    { js: 'color', css: 'color', color: true },
                    { js: 'borderColor', css: 'border-color', color: true },
                    { js: 'borderRadius', css: 'border-radius' },
                    { js: 'boxShadow', css: 'box-shadow' }
                ];
                const originalInlineStyles = new Map(nodes.map(function (node) {
                    return [node, animatedStyles.map(function (property) {
                        return {
                            css: property.css,
                            value: node.style.getPropertyValue(property.css),
                            priority: node.style.getPropertyPriority(property.css)
                        };
                    })];
                }));
                const activeRecipes = new Map();
                const recipeClassesByNode = new Map();
                const customOverrides = new Map();

                choices.forEach(function (choice) {
                    if (choice.getAttribute('aria-pressed') === 'true') activeRecipes.set(choice.dataset.twGroup, choice);
                    parseRecipe(choice.dataset.twApply).forEach(function (classes, name) {
                        if (!recipeClassesByNode.has(name)) recipeClassesByNode.set(name, new Set());
                        classes.forEach(function (className) { recipeClassesByNode.get(name).add(className); });
                    });
                });

                const baseClasses = new Map(Array.from(originalClasses.entries()).map(function (entry) {
                    const owned = recipeClassesByNode.get(entry[0]) || new Set();
                    const classes = entry[1].split(/\s+/).filter(function (className) { return className && !owned.has(className); });
                    return [entry[0], classes];
                }));

                const groupNodeNames = function (group) {
                    const names = new Set();
                    choices.filter(function (choice) { return choice.dataset.twGroup === group; }).forEach(function (choice) {
                        parseRecipe(choice.dataset.twApply).forEach(function (_classes, name) { names.add(name); });
                    });
                    return names;
                };

                const composedClasses = function (name) {
                    if (customOverrides.has(name)) return customOverrides.get(name);
                    const classes = new Set(baseClasses.get(name) || []);
                    activeRecipes.forEach(function (choice) {
                        const recipe = parseRecipe(choice.dataset.twApply);
                        (recipe.get(name) || []).forEach(function (className) { classes.add(className); });
                    });
                    return Array.from(classes).join(' ');
                };

                const renderNodes = function (names) {
                    (names ? Array.from(names) : Array.from(originalClasses.keys())).forEach(function (name) {
                        const node = nodeByName(name);
                        if (node) node.className = composedClasses(name);
                    });
                };

                const currentChoice = function (group) {
                    return choices.find(function (choice) {
                        return choice.dataset.twGroup === group && choice.getAttribute('aria-pressed') === 'true';
                    });
                };

                const activeSummary = function () {
                    const labels = ['layout', 'surface', 'shape'].map(function (group) {
                        const choice = currentChoice(group);
                        return choice ? choice.textContent.trim() : 'Custom';
                    });
                    return labels[0] + ' layout, ' + labels[1].toLowerCase() + ' surface, ' + labels[2].toLowerCase() + ' corners. ' + artFamily + ' artwork.';
                };

                const updateActiveCount = function () {
                    if (!activeCount) return;
                    activeCount.textContent = activeRecipes.size + ' groups' + (customOverrides.size ? ' · remixed' : '');
                };

                const updateCodeOutput = function () {
                    if (!codeOutput) return;
                    const fragment = document.createDocumentFragment();
                    nodes.forEach(function (node, index) {
                        const nameSpan = document.createElement('span');
                        const classesSpan = document.createElement('span');
                        nameSpan.className = 'recipe-name';
                        classesSpan.className = 'recipe-classes';
                        nameSpan.textContent = node.dataset.twNode.padEnd(12, ' ');
                        classesSpan.textContent = node.className;
                        fragment.append(nameSpan, classesSpan);
                        if (index < nodes.length - 1) fragment.append(document.createTextNode('\n'));
                    });
                    codeOutput.replaceChildren(fragment);
                };

                const cancelPendingMutation = function () {
                    if (transitionEnd) transitionEnd.kill();
                    transitionEnd = null;
                    transitionBusy = false;
                    pendingMutation = null;
                };

                const restoreAnimatedStyles = function (node) {
                    (originalInlineStyles.get(node) || []).forEach(function (property) {
                        if (property.value) node.style.setProperty(property.css, property.value, property.priority);
                        else node.style.removeProperty(property.css);
                    });
                };

                const finishActiveTransition = function () {
                    if (activeFlip) {
                        const flip = activeFlip;
                        activeFlip = null;
                        flip.progress(1);
                        flip.kill();
                    }
                    activeStyleTweens.splice(0).forEach(function (tween) {
                        tween.progress(1);
                        tween.kill();
                    });
                    nodes.forEach(restoreAnimatedStyles);
                };

                const captureStructure = function () {
                    finishActiveTransition();
                    if (!isMotion) return null;
                    const styles = new Map(nodes.map(function (node) {
                        const computed = getComputedStyle(node);
                        return [node, animatedStyles.reduce(function (state, property) {
                            state[property.js] = property.color ? normalizedColor(computed[property.js]) : computed[property.js];
                            return state;
                        }, {})];
                    }));
                    return { flip: Flip.getState(structuralNodes), styles: styles };
                };

                const animateMutation = function (previewState) {
                    if (!isMotion || !previewState) return;
                    finishActiveTransition();
                    activeFlip = Flip.from(previewState.flip, {
                        duration: 0.58,
                        ease: 'power2.inOut',
                        absolute: false,
                        nested: true,
                        prune: true,
                        scale: true,
                        onComplete: function () { activeFlip = null; }
                    });
                    previewState.styles.forEach(function (fromStyles, node) {
                        const computed = getComputedStyle(node);
                        const toStyles = animatedStyles.reduce(function (state, property) {
                            state[property.js] = property.color ? normalizedColor(computed[property.js]) : computed[property.js];
                            return state;
                        }, {});
                        const changed = animatedStyles.some(function (property) {
                            return fromStyles[property.js] !== toStyles[property.js];
                        });
                        if (!changed) return;
                        const tween = gsap.fromTo(node, fromStyles, Object.assign({}, toStyles, {
                            duration: 0.58,
                            ease: 'power2.inOut',
                            overwrite: 'auto',
                            onComplete: function () {
                                restoreAnimatedStyles(node);
                                activeStyleTweens = activeStyleTweens.filter(function (item) { return item !== tween; });
                            }
                        }));
                        activeStyleTweens.push(tween);
                    });
                };

                const settleThenAnimate = function (previewState) {
                    if (!isMotion || !previewState) return;
                    // Utilities are compiled locally: apply Flip's inverse transforms
                    // before the browser can paint the newly mutated layout.
                    transitionBusy = true;
                    animateMutation(previewState);
                    transitionEnd = gsap.delayedCall(0.6, context.add(null, function () {
                        transitionEnd = null;
                        transitionBusy = false;
                        const next = pendingMutation;
                        pendingMutation = null;
                        if (next) next();
                    }));
                };

                const setGroupChoice = function (group, label) {
                    const choice = choices.find(function (candidate) {
                        return candidate.dataset.twGroup === group && candidate.textContent.trim() === label;
                    });
                    if (!choice) return;
                    activeRecipes.set(group, choice);
                    choices.filter(function (candidate) { return candidate.dataset.twGroup === group; }).forEach(function (candidate) {
                        candidate.setAttribute('aria-pressed', String(candidate === choice));
                    });
                };

                const mutateChoice = function (choice) {
                    const group = choice.dataset.twGroup;
                    const affectedNames = groupNodeNames(group);
                    if (activeRecipes.get(group) === choice) return false;
                    setGroupChoice(group, choice.textContent.trim());
                    affectedNames.forEach(function (name) { customOverrides.delete(name); });
                    if (group === 'surface') {
                        adaptContrast();
                        ['title', 'description', 'eyebrow', 'action'].forEach(function (name) { affectedNames.add(name); });
                    }
                    renderNodes(affectedNames);
                    return true;
                };

                const applyChoice = function (choice, announce) {
                    if (transitionBusy) {
                        pendingMutation = function () { applyChoice(choice, announce); };
                        return;
                    }
                    const previewState = captureStructure();
                    if (!mutateChoice(choice)) return;
                    updateActiveCount();
                    updateCodeOutput();
                    if (recipeStatus) recipeStatus.textContent = artFamily + ' · Recipe control applied';
                    settleThenAnimate(previewState);
                    if (announce) status.textContent = activeSummary();
                };

                const buildRandomRecipe = function () {
                    const selected = {
                        layout: randomItem(['Stack', 'Split', 'Reverse']),
                        surface: randomItem(['Paper', 'Midnight', 'Mist', 'Ink']),
                        shape: randomItem(['Sharp', 'Round', 'Soft'])
                    };
                    const typePool = [
                        'text-xl sm:text-2xl font-semibold tracking-tight',
                        'text-2xl sm:text-3xl font-black tracking-tighter',
                        'text-2xl sm:text-3xl font-black italic tracking-tighter',
                        'text-lg sm:text-2xl font-bold uppercase tracking-tight',
                        'text-xl sm:text-3xl font-medium tracking-normal',
                        'font-serif text-2xl sm:text-3xl font-medium tracking-tight',
                        'font-mono text-lg sm:text-xl font-semibold tracking-tight'
                    ];
                    const measures = ['text-sm leading-5 sm:leading-6', 'max-w-sm text-sm leading-6', 'text-sm leading-6', 'max-w-xs text-xs leading-5'];
                    const actions = ['rounded-full', 'rounded-none', 'rounded-lg', 'rounded-md'];
                    const nextFamily = randomItem(artFamilies.filter(function (family) { return family !== artFamily; }));
                    const nextPalette = randomIndex(palettes.length);
                    const recipe = {
                        choices: selected,
                        overrides: {
                            title: 'mt-2 leading-tight ' + randomItem(typePool),
                            description: randomItem(measures),
                            action: 'inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold ' + randomItem(actions)
                        },
                        artFamily: nextFamily,
                        paletteIndex: nextPalette,
                        art: generateArt(nextFamily, palettes[nextPalette])
                    };
                    lastRemixSignature = JSON.stringify(recipe.choices) + nextFamily + nextPalette;
                    return recipe;
                };

                const applyRecipe = function (recipe, animate, label) {
                    if (!animate) {
                        cancelPendingMutation();
                        finishActiveTransition();
                    }
                    const previewState = animate ? captureStructure() : null;
                    customOverrides.clear();
                    Object.entries(recipe.choices).forEach(function (entry) { setGroupChoice(entry[0], entry[1]); });
                    renderNodes();
                    Object.entries(recipe.overrides).forEach(function (entry) {
                        customOverrides.set(entry[0], normalizeClasses(entry[1]));
                    });
                    paletteIndex = recipe.paletteIndex === undefined ? paletteIndex : recipe.paletteIndex;
                    artFamily = recipe.artFamily || artFamily;
                    currentArt = recipe.art || currentArt;
                    adaptContrast();
                    renderNodes();
                    renderArt(animate);
                    updateActiveCount();
                    updateCodeOutput();
                    if (recipeStatus) recipeStatus.textContent = artFamily + ' · ' + label;
                    settleThenAnimate(previewState);
                    status.textContent = 'Random remix: ' + activeSummary();
                };

                const markup = function () {
                    const card = nodeByName('card');
                    const clone = card.cloneNode(true);
                    clone.querySelectorAll('[data-tw-art-outgoing]').forEach(function (node) { node.remove(); });
                    [clone].concat(Array.from(clone.querySelectorAll('*'))).forEach(function (node) {
                        node.removeAttribute('data-tw-node');
                        node.removeAttribute('data-tw-art');
                        node.removeAttribute('data-art-family');
                        node.removeAttribute('data-flip-id');
                        node.removeAttribute('style');
                    });
                    return clone.outerHTML;
                };

                const copyMarkup = function () {
                    const showResult = function (label) {
                        if (!mounted) return;
                        copyLabel.textContent = label;
                        if (copyReset) copyReset.kill();
                        copyReset = gsap.delayedCall(1.4, function () {
                            copyLabel.textContent = 'Copy markup';
                            copyReset = null;
                        });
                    };
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(markup()).then(function () { showResult('Copied'); }).catch(function () { showResult('Copy failed'); });
                    } else {
                        const textarea = document.createElement('textarea');
                        textarea.value = markup();
                        textarea.setAttribute('readonly', '');
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        const copied = document.execCommand('copy');
                        textarea.remove();
                        showResult(copied ? 'Copied' : 'Copy failed');
                    }
                };

                choices.forEach(function (choice) {
                    on(choice, 'click', function () { applyChoice(choice, true); });
                    on(choice, 'keydown', function (event) {
                        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                        const groupChoices = choices.filter(function (candidate) { return candidate.dataset.twGroup === choice.dataset.twGroup; });
                        const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
                        const index = groupChoices.indexOf(choice);
                        const next = groupChoices[(index + direction + groupChoices.length) % groupChoices.length];
                        event.preventDefault();
                        next.focus();
                        applyChoice(next, true);
                    });
                });

                on(copyButton, 'click', copyMarkup);
                const remix = function () {
                    if (transitionBusy) {
                        // Coalesce rapid clicks to the latest request instead of snapping
                        // the current animation to its destination before every click.
                        pendingMutation = remix;
                        return;
                    }
                    applyRecipe(buildRandomRecipe(), true, 'Fresh random combination');
                };
                on(remixButton, 'click', remix);

                const preservedState = liveStates.get(container);
                if (preservedState) {
                    activeRecipes.clear();
                    preservedState.activeRecipes.forEach(function (label, group) { setGroupChoice(group, label); });
                    customOverrides.clear();
                    preservedState.customOverrides.forEach(function (classes, name) { customOverrides.set(name, classes); });
                    lastRemixSignature = preservedState.lastRemixSignature;
                    artFamily = preservedState.artFamily;
                    paletteIndex = preservedState.paletteIndex;
                    currentArt = preservedState.currentArt;
                    renderNodes();
                    renderArt(false);
                    recipeStatus.textContent = artFamily + ' · Fresh random combination';
                    status.textContent = activeSummary();
                }
                updateActiveCount();
                updateCodeOutput();

                window.__thumbnail = function () {
                    applyRecipe({
                        choices: { layout: 'Stack', surface: 'Midnight', shape: 'Soft' },
                        art: originalArt, artFamily: 'Orbits', paletteIndex: 0,
                        overrides: {
                            title: 'mt-2 text-3xl sm:text-4xl font-black tracking-tighter text-white',
                            description: 'text-sm leading-5 sm:leading-6 text-slate-300',
                            action: 'inline-flex items-center rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950'
                        }
                    }, false, 'Thumbnail recipe');
                };

                cleanups.push(function () {
                    mounted = false;
                    cancelPendingMutation();
                    finishActiveTransition();
                    if (copyReset) copyReset.kill();
                    liveStates.set(container, {
                        activeRecipes: new Map(Array.from(activeRecipes.entries()).map(function (entry) {
                            return [entry[0], entry[1].textContent.trim()];
                        })),
                        customOverrides: new Map(customOverrides),
                        artFamily: artFamily, paletteIndex: paletteIndex, currentArt: currentArt,
                        lastRemixSignature: lastRemixSignature
                    });
                    if (artTween) { artTween.progress(1).kill(); artTween = null; }
                    clearOutgoingArt();
                    container.querySelector('[data-tw-art]').outerHTML = originalArt;
                    customOverrides.clear();
                    originalClasses.forEach(function (className, name) {
                        const node = nodeByName(name);
                        if (node) node.className = className;
                    });
                    originalPressed.forEach(function (pressed, choice) { choice.setAttribute('aria-pressed', pressed); });
                    updateActiveCount();
                    updateCodeOutput();
                    copyLabel.textContent = 'Copy markup';
                    if (recipeStatus) recipeStatus.textContent = 'Choose a recipe or generate a remix';
                    status.textContent = 'Split layout, paper surface, soft corners.';
                    if (previousThumbnail === undefined) delete window.__thumbnail;
                    else window.__thumbnail = previousThumbnail;
                });
            });

            return function cleanup() {
                handlers.forEach(function (remove) { remove(); });
                cleanups.forEach(function (cleanup) { cleanup(); });
            };
        });

        const handleUnload = function () { rootContext.revert(); };
        window.addEventListener('beforeunload', handleUnload);
        return function cleanupPage() {
            window.removeEventListener('beforeunload', handleUnload);
            if (window.gsapContext === rootContext) {
                document.documentElement.classList.remove('has-js');
                if (previousContext === undefined) delete window.gsapContext;
                else window.gsapContext = previousContext;
            }
        };
    });

    window.gsapContext = ctx;
});
