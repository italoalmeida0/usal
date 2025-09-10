const Playground = (() => {
  const state = {
    editor: null,
    centralHTML: '<div>Hello USAL!</div>',
    updatePromise: null,
    updateQueue: [],
    config: {
      animationType: '',
      splitType: '',
      textEffect: '',
      countTarget: '',
      duration: '1000',
      delay: '0',
      threshold: '10',
      splitDelay: '50',
      splitDelayStagger: '',
      easing: '',
      blur: '',
      once: false,
      fontFamily: '',
      fontWeight: '',
      fontSize: '',
      tuning1: '',
      tuning2: '',
      tuning3: '',
      timeline: '',
      loop: false,
      loopType: 'mirror',
      forwards: false,
    },
  };

  const presets = {
    hero: {
      html: '<h1 data-usal="fade-d duration-1000 blur">Welcome to USAL</h1>',
      animationType: 'fade-d',
      duration: '1000',
      blur: 'blur',
    },
    cards: {
      html: `<div class="cards" style="display: flex" data-usal="split-item fade-u split-delay-100 duration-800">
    <div class="card">
        <h3>Card 1</h3>
        <p>Description text</p>
    </div>
    <div class="card">
        <h3>Card 2</h3>
        <p>Description text</p>
    </div>
    <div class="card">
        <h3>Card 3</h3>
        <p>Description text</p>
    </div>
</div>`,
      splitType: 'split-item',
      animationType: 'fade-u',
      splitDelay: '100',
      duration: '800',
    },
    counter: {
      html: '<p data-usal="count-[21 000 000.00] duration-5000" style="font-family: \'Montserrat\', sans-serif">In 2025, we will earn US$21 000 000.00 in the first quarter alone.</p>',
      countTarget: '21 000 000.00',
      duration: '5000',
      fontFamily: "'Montserrat', sans-serif",
    },
    shimmer: {
      html: '<h1 data-usal="split-letter text-shimmer duration-2000 split-delay-50" style="font-family: \'Montserrat\', sans-serif; font-weight: 700">SHIMMER EFFECT</h1>',
      textEffect: 'text-shimmer',
      splitType: 'split-letter',
      duration: '2000',
      splitDelay: '50',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '700',
    },
    fluid: {
      html: '<h1 data-usal="split-letter text-fluid duration-2000 split-delay-50" style="font-family: \'Montserrat\', sans-serif; font-weight: 100">Fluid Weight Animation</h1>',
      textEffect: 'text-fluid',
      splitType: 'split-letter',
      duration: '2000',
      splitDelay: '50',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '100',
    },
    paragraph: {
      html: '<p data-usal="split-word fade-u split-delay-50 duration-800">Modern web development is all about creating smooth, engaging user experiences that delight visitors.</p>',
      splitType: 'split-word',
      animationType: 'fade-u',
      splitDelay: '50',
      duration: '800',
    },
    tuning: {
      html: '<h1 data-usal="zoomin-30-50-80 duration-1500">Tuned Animation</h1>',
      animationType: 'zoomin',
      tuning1: '30',
      tuning2: '50',
      tuning3: '80',
      duration: '1500',
    },
    timeline: {
      html: `<div style="
    width: 100px;
    height: 100px;
    background: #bebebe12;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 18px;
    border: 1px solid;
    box-shadow: 0 10px 30px rgb(91 91 91 / 50%);
  " data-usal="line-[p+150 ry+0 | 20 ry+1440 | 50 ry+2160 | 80 ry+2340 | 95 ry+2430 rx+30 | ry+2440 rx+90] duration-5000 forwards">BANG!</div>`,
      timeline:
        'p+150 ry+0 | 20 ry+1440 | 50 ry+2160 | 80 ry+2340 | 95 ry+2430 rx+30 | ry+2440 rx+90',
      duration: '5000',
      forwards: true,
    },
    loop: {
      html: '<div class="pulse" data-usal="fade loop duration-1000">Continuous Loop</div>',
      animationType: 'fade',
      loop: true,
      loopType: 'mirror',
      duration: '1000',
    },
    stagger: {
      html: `<ul data-usal="split-item zoomin split-delay-100-center duration-800">
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
    <li>Fourth item</li>
    <li>Fifth item</li>
</ul>`,
      splitType: 'split-item',
      animationType: 'zoomin',
      splitDelay: '100',
      splitDelayStagger: 'center',
      duration: '800',
    },
  };

  async function requestUpdate(source) {
    if (state.updatePromise) {
      state.updateQueue.push(source);
      return state.updatePromise;
    }

    state.updatePromise = processUpdate(source)
      .then(() => {
        if (state.updateQueue.length > 0) {
          const next = state.updateQueue.shift();
          state.updatePromise = null;
          return requestUpdate(next);
        }
      })
      .catch((error) => {
        console.error('Update error:', error);
      })
      .finally(() => {
        state.updatePromise = null;
      });

    return state.updatePromise;
  }

  async function processUpdate(source) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        try {
          if (source === 'editor') {
            state.centralHTML = state.editor.getValue();
            parseHTMLToConfig();
            syncControlsFromConfig();
          } else if (source === 'controls') {
            readControlsToConfig();
            updateCentralHTML();
            syncEditorFromHTML();
          } else if (source === 'preset' || source === 'init' || source === 'reset') {
            parseHTMLToConfig();
            syncEditorFromHTML();
            syncControlsFromConfig();
          }

          updateGeneratedCode();
          renderPreview();

          resolve();
        } catch (error) {
          console.error('Error in processUpdate:', error);
          resolve();
        }
      });
    });
  }

  function init() {
    initEditor();
    attachEventListeners();
    loadFromURL();
    requestUpdate('init');
  }

  function initEditor() {
    state.editor = CodeMirror(document.getElementById('editor'), {
      value: state.centralHTML,
      mode: 'xml',
      theme: 'yonce',
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentWithTabs: false,
    });
    let programmaticChange = false;

    state.editor.on(
      'change',
      debounce(() => {
        // <-- Adicionar este listener
        if (programmaticChange) return;
        requestUpdate('editor');
      }, 500)
    );

    state.editor.setValueSilently = function (value) {
      programmaticChange = true;
      this.setValue(value);
      setTimeout(() => {
        programmaticChange = false;
      }, 10);
    };
  }

  function attachEventListeners() {
    Object.keys(state.config).forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        const eventType = element.type === 'checkbox' ? 'change' : 'input';

        element.addEventListener(
          eventType,
          debounce(() => {
            requestUpdate('controls');
          }, 300)
        );
      }
    });

    document.getElementById('resetBtn')?.addEventListener('click', reset);
    document.getElementById('shareBtn')?.addEventListener('click', share);
    document.getElementById('copyBtn')?.addEventListener('click', copyCode);

    document.getElementById('easing')?.addEventListener('change', (e) => {
      const customField = document.getElementById('easingCustom');
      if (e.target.value === 'custom') {
        customField.style.display = 'block';
      } else {
        customField.style.display = 'none';
      }
    });

    document.getElementById('easingCustom')?.addEventListener(
      'input',
      debounce(() => {
        requestUpdate('controls');
      }, 300)
    );

    document.getElementById('animationType')?.addEventListener('change', (e) => {
      const timelineSection = document.getElementById('customTimelineSection');
      if (e.target.value === 'custom-timeline') {
        timelineSection.style.display = 'block';
      } else {
        timelineSection.style.display = 'none';
      }
    });

    document.getElementById('splitType')?.addEventListener('change', (e) => {
      const staggerSection = document.getElementById('splitDelayStaggerSection');
      if (staggerSection) {
        staggerSection.style.display = e.target.value ? 'block' : 'none';
      }
    });

    document.getElementById('loop')?.addEventListener('change', (e) => {
      const loopTypeSection = document.getElementById('loopTypeSection');
      if (loopTypeSection) {
        loopTypeSection.style.display = e.target.checked ? 'block' : 'none';
      }
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });
  }

  function parseHTMLToConfig() {
    const match = state.centralHTML.match(/data-usal="([^"]*)"/);

    if (!match) {
      Object.keys(state.config).forEach((key) => {
        if (typeof state.config[key] === 'boolean') {
          state.config[key] = false;
        } else {
          state.config[key] = '';
        }
      });
      state.config.duration = '1000';
      state.config.delay = '0';
      state.config.threshold = '10';
      state.config.splitDelay = '50';
      state.config.loopType = 'mirror';
      return;
    }

    const dataUsal = match[1];
    parseDataUsalToConfig(dataUsal);

    const styleMatch = state.centralHTML.match(/style="([^"]*)"/);
    if (styleMatch) {
      const styles = styleMatch[1];

      const fontFamilyMatch = styles.match(/font-family:\s*([^;]+)/);
      if (fontFamilyMatch) {
        state.config.fontFamily = fontFamilyMatch[1].trim();
      }

      const fontWeightMatch = styles.match(/font-weight:\s*([^;]+)/);
      if (fontWeightMatch) {
        state.config.fontWeight = fontWeightMatch[1].trim();
      }

      const fontSizeMatch = styles.match(/font-size:\s*(\d+)px/);
      if (fontSizeMatch) {
        state.config.fontSize = fontSizeMatch[1];
      }
    }
  }

  function parseDataUsalToConfig(dataUsal) {
    if (!dataUsal) return;

    const tokens = dataUsal.trim().split(/\s+/).filter(Boolean);
    const newConfig = { ...state.config };

    Object.keys(newConfig).forEach((key) => {
      if (typeof newConfig[key] === 'boolean') {
        newConfig[key] = false;
      } else if (!['duration', 'delay', 'threshold', 'splitDelay'].includes(key)) {
        newConfig[key] = '';
      }
    });
    newConfig.loopType = 'mirror';

    let hasSplitAnimation = false;

    for (const token of tokens) {
      if (token.startsWith('split-')) {
        const splitPart = token.replace('split-', '');

        if (['word', 'letter', 'item'].includes(splitPart)) {
          newConfig.splitType = token;
        } else if (splitPart.startsWith('delay-')) {
          const delayParts = splitPart.replace('delay-', '').split('-');
          newConfig.splitDelay = delayParts[0];
          if (delayParts[1] && ['linear', 'center', 'edges', 'random'].includes(delayParts[1])) {
            newConfig.splitDelayStagger = delayParts[1];
          }
        } else if (splitPart.match(/^(fade|zoomin|zoomout|flip)/)) {
          hasSplitAnimation = true;
          const parts = splitPart.split('-');
          const baseAnim = parts[0];
          let direction = '';
          let tuningStartIndex = 1;

          if (parts[1] && /^[udlr]{1,2}$/.test(parts[1])) {
            direction = '-' + parts[1];
            tuningStartIndex = 2;
          }

          newConfig.animationType = baseAnim + direction;

          const numbers = parts.slice(tuningStartIndex).filter((p) => /^\d+$/.test(p));
          if (numbers[0]) newConfig.tuning1 = numbers[0];
          if (numbers[1]) newConfig.tuning2 = numbers[1];
          if (numbers[2]) newConfig.tuning3 = numbers[2];
        }
        continue;
      }

      if (
        !hasSplitAnimation &&
        token.match(/^(fade|zoomin|zoomout|flip)(-[udlr]{1,2})?(-\d+)?(-\d+)?(-\d+)?$/)
      ) {
        const parts = token.split('-');
        const baseAnim = parts[0];
        let direction = '';
        let tuningStartIndex = 1;

        if (parts[1] && /^[udlr]{1,2}$/.test(parts[1])) {
          direction = '-' + parts[1];
          tuningStartIndex = 2;
        }

        newConfig.animationType = baseAnim + direction;

        const numbers = parts.slice(tuningStartIndex).filter((p) => /^\d+$/.test(p));
        if (numbers[0]) newConfig.tuning1 = numbers[0];
        if (numbers[1]) newConfig.tuning2 = numbers[1];
        if (numbers[2]) newConfig.tuning3 = numbers[2];
        continue;
      }

      if (token.startsWith('line-[') && token.endsWith(']')) {
        newConfig.timeline = token.slice(6, -1);
        newConfig.animationType = 'custom-timeline';
        continue;
      }

      if (token === 'loop') {
        newConfig.loop = true;
        newConfig.loopType = 'mirror';
        continue;
      }

      if (token === 'loop-mirror') {
        newConfig.loop = true;
        newConfig.loopType = 'mirror';
        continue;
      }

      if (token === 'loop-jump') {
        newConfig.loop = true;
        newConfig.loopType = 'jump';
        continue;
      }

      if (token === 'forwards') {
        newConfig.forwards = true;
        continue;
      }

      if (token === 'text-shimmer' || token === 'text-fluid') {
        newConfig.textEffect = token;
        continue;
      }

      if (token.startsWith('count-[') && token.endsWith(']')) {
        newConfig.countTarget = token.slice(7, -1);
        continue;
      }

      if (token.startsWith('duration-')) {
        newConfig.duration = token.replace('duration-', '');
        continue;
      }

      if (token.startsWith('delay-')) {
        const delayValue = token.replace('delay-', '');
        const delayParts = delayValue.split('-');
        newConfig.delay = delayParts[0];
        continue;
      }

      if (token.startsWith('threshold-')) {
        newConfig.threshold = token.replace('threshold-', '');
        continue;
      }

      if (token.startsWith('easing-[') && token.endsWith(']')) {
        newConfig.easing = token;
        const easingValue = token.slice(8, -1);
        const easingCustomEl = document.getElementById('easingCustom');
        const easingEl = document.getElementById('easing');
        if (easingCustomEl) easingCustomEl.value = easingValue;
        if (easingEl) easingEl.value = 'custom';
        continue;
      }

      if (
        ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'].includes(
          token
        )
      ) {
        newConfig.easing = token;
        continue;
      }

      if (token === 'blur') {
        newConfig.blur = 'blur';
        continue;
      }

      if (token.match(/^blur-(\d+(\.\d+)?)$/)) {
        newConfig.blur = token;
        continue;
      }

      if (token === 'once') {
        newConfig.once = true;
      }
    }

    state.config = newConfig;
  }

  function readControlsToConfig() {
    Object.keys(state.config).forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          state.config[key] = element.checked;
        } else {
          state.config[key] = element.value;
        }
      }
    });

    const easingSelect = document.getElementById('easing');
    if (easingSelect?.value === 'custom') {
      const customValue = document.getElementById('easingCustom')?.value;
      if (customValue) {
        state.config.easing = `easing-[${customValue}]`;
      }
    } else if (easingSelect?.value) {
      state.config.easing = easingSelect.value;
    }

    const loopTypeSelect = document.getElementById('loopType');
    if (loopTypeSelect) {
      state.config.loopType = loopTypeSelect.value || 'mirror';
    }

    const splitDelayStaggerSelect = document.getElementById('splitDelayStagger');
    if (splitDelayStaggerSelect) {
      state.config.splitDelayStagger = splitDelayStaggerSelect.value || '';
    }
  }

  function updateCentralHTML() {
    const dataUsal = generateDataUsal();
    const newStyles = generateStyles();

    let html = state.centralHTML;

    html = html.replace(/\s*data-usal="[^"]*"/g, '');

    const existingStyleMatch = html.match(/style="([^"]*)"/);
    let finalStyles = '';

    if (existingStyleMatch) {
      const existingStyles = existingStyleMatch[1];

      const styleObj = {};
      existingStyles.split(';').forEach((style) => {
        const [prop, value] = style.split(':').map((s) => s?.trim());
        if (prop && value) {
          styleObj[prop] = value;
        }
      });

      if (state.config.fontFamily) {
        styleObj['font-family'] = state.config.fontFamily;
      } else {
        delete styleObj['font-family'];
      }

      if (state.config.fontWeight) {
        styleObj['font-weight'] = state.config.fontWeight;
      } else {
        delete styleObj['font-weight'];
      }

      if (state.config.fontSize) {
        styleObj['font-size'] = `${state.config.fontSize}px`;
      } else {
        delete styleObj['font-size'];
      }

      finalStyles = Object.entries(styleObj)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');

      html = html.replace(/\s*style="[^"]*"/g, '');
    } else if (newStyles) {
      finalStyles = newStyles;
    }

    const attrs = [];
    if (dataUsal) attrs.push(`data-usal="${dataUsal}"`);
    if (finalStyles) attrs.push(`style="${finalStyles}"`);

    if (attrs.length > 0) {
      const hasTag = /<[a-zA-Z][^>]*>/.test(html);

      if (hasTag) {
        html = html.replace(/(<[a-zA-Z][^>]*?)(\/?>)/, `$1 ${attrs.join(' ')}$2`);
      } else {
        html = `<div ${attrs.join(' ')}>${html}</div>`;
      }
    }

    state.centralHTML = html;
  }
  function syncEditorFromHTML() {
    const cursor = state.editor.getCursor();
    const scrollInfo = state.editor.getScrollInfo();

    if (state.editor.getValue() !== state.centralHTML) {
      state.editor.setValueSilently(state.centralHTML);
      state.editor.setValue(state.centralHTML);
      state.editor.setCursor(cursor);
      state.editor.scrollTo(scrollInfo.left, scrollInfo.top);
    }
  }

  function syncControlsFromConfig() {
    Object.keys(state.config).forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = state.config[key];
        } else {
          element.value = state.config[key];
        }
      }
    });

    const easingSelect = document.getElementById('easing');
    const customField = document.getElementById('easingCustom');
    if (state.config.easing?.startsWith('easing-[')) {
      easingSelect.value = 'custom';
      customField.value = state.config.easing.slice(8, -1);
      customField.style.display = 'block';
    } else {
      customField.style.display = 'none';
    }

    const timelineSection = document.getElementById('customTimelineSection');
    if (state.config.animationType === 'custom-timeline' || state.config.timeline) {
      timelineSection.style.display = 'block';
    } else {
      timelineSection.style.display = 'none';
    }

    const staggerSection = document.getElementById('splitDelayStaggerSection');
    if (staggerSection) {
      staggerSection.style.display = state.config.splitType ? 'block' : 'none';
    }

    const loopTypeSection = document.getElementById('loopTypeSection');
    if (loopTypeSection) {
      loopTypeSection.style.display = state.config.loop ? 'block' : 'none';
    }
  }

  function generateDataUsal() {
    const parts = [];
    const { config } = state;

    if (config.splitType) {
      parts.push(config.splitType);

      if (config.animationType && config.animationType !== 'custom-timeline') {
        let splitAnimation = `split-${config.animationType}`;

        if (config.tuning1 || config.tuning2 || config.tuning3) {
          const tuningParts = [];
          if (config.tuning1) tuningParts.push(config.tuning1);
          if (config.tuning2) tuningParts.push(config.tuning2);
          if (config.tuning3) tuningParts.push(config.tuning3);

          if (tuningParts.length > 0) {
            splitAnimation = `${splitAnimation}-${tuningParts.join('-')}`;
          }
        }

        parts.push(splitAnimation);
      }

      if (config.splitDelay || config.splitDelayStagger) {
        let splitDelayStr = `split-delay-${config.splitDelay || '50'}`;
        if (config.splitDelayStagger) {
          splitDelayStr += `-${config.splitDelayStagger}`;
        }
        parts.push(splitDelayStr);
      }
    } else if (config.animationType && config.animationType !== 'custom-timeline') {
      let animation = config.animationType;

      if (config.tuning1 || config.tuning2 || config.tuning3) {
        const tuningParts = [];
        if (config.tuning1) tuningParts.push(config.tuning1);
        if (config.tuning2) tuningParts.push(config.tuning2);
        if (config.tuning3) tuningParts.push(config.tuning3);

        if (tuningParts.length > 0) {
          animation = `${animation}-${tuningParts.join('-')}`;
        }
      }

      parts.push(animation);
    }

    if (config.timeline) {
      parts.push(`line-[${config.timeline}]`);
    }

    if (config.textEffect) {
      parts.push(config.textEffect);
    }

    if (config.countTarget) {
      parts.push(`count-[${config.countTarget}]`);
    }

    if (config.duration && config.duration !== '1000') {
      parts.push(`duration-${config.duration}`);
    }

    if (config.delay && config.delay !== '0') {
      parts.push(`delay-${config.delay}`);
    }

    if (config.threshold && config.threshold !== '10') {
      parts.push(`threshold-${config.threshold}`);
    }

    if (config.easing) {
      if (config.easing.startsWith('easing-[')) {
        parts.push(config.easing);
      } else if (!['', 'ease-out'].includes(config.easing)) {
        parts.push(config.easing);
      }
    }

    if (config.blur) {
      parts.push(config.blur);
    }

    if (config.once) {
      parts.push('once');
    }

    if (config.loop) {
      if (config.loopType === 'jump') {
        parts.push('loop-jump');
      } else {
        parts.push('loop');
      }
    }

    if (config.forwards) {
      parts.push('forwards');
    }

    return parts.join(' ');
  }

  function generateStyles() {
    const styles = [];

    if (state.config.fontFamily) {
      styles.push(`font-family: ${state.config.fontFamily}`);
    }

    if (state.config.fontWeight) {
      styles.push(`font-weight: ${state.config.fontWeight}`);
    }

    if (state.config.fontSize) {
      styles.push(`font-size: ${state.config.fontSize}px`);
    }

    return styles.join('; ');
  }

  function updateGeneratedCode() {
    const dataUsal = generateDataUsal();
    const codeElement = document.getElementById('generatedCode');
    if (codeElement) {
      codeElement.textContent = dataUsal ? `data-usal="${dataUsal}"` : 'No animation configured';
    }
  }

  function renderPreview() {
    const preview = document.getElementById('preview');

    const oldContent = preview.innerHTML;

    const temp = document.createElement('div');
    temp.innerHTML = DOMPurify.sanitize(state.centralHTML);

    const newContent = temp.innerHTML;
    if (oldContent === newContent) return;

    preview.innerHTML = '';
    while (temp.firstChild) {
      preview.appendChild(temp.firstChild);
    }

    applyTypography();
  }

  function applyTypography() {
    const preview = document.getElementById('preview');
    const { fontFamily, fontWeight, fontSize } = state.config;

    preview.style.fontFamily = fontFamily || '';
    preview.style.fontWeight = fontWeight || '';
    preview.style.fontSize = fontSize ? `${fontSize}px` : '';
  }

  function reset() {
    state.centralHTML = '<div>Hello USAL!</div>';

    Object.keys(state.config).forEach((key) => {
      if (typeof state.config[key] === 'boolean') {
        state.config[key] = false;
      } else {
        state.config[key] = '';
      }
    });

    state.config.duration = '1000';
    state.config.delay = '0';
    state.config.threshold = '10';
    state.config.splitDelay = '50';
    state.config.loopType = 'mirror';

    requestUpdate('reset');
  }

  function loadPreset(name) {
    const preset = presets[name];
    if (!preset) return;

    state.centralHTML = preset.html;

    Object.keys(preset).forEach((key) => {
      if (key !== 'html' && key in state.config) {
        state.config[key] = preset[key];
      }
    });

    requestUpdate('preset');
  }

  function share() {
    const config = {
      html: state.centralHTML,
      ...state.config,
    };

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}#${compressed}`;

    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('shareBtn');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  }

  function copyCode() {
    const code = document.getElementById('generatedCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('copyBtn');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  }

  const configSchema = joi.object({
    html: joi.string().max(50000),
    animationType: joi
      .string()
      .pattern(/^[a-zA-Z-]*$/)
      .allow(''),
    splitType: joi
      .string()
      .pattern(/^[a-zA-Z-]*$/)
      .allow(''),
    textEffect: joi
      .string()
      .pattern(/^[a-zA-Z-]*$/)
      .allow(''),
    countTarget: joi
      .string()
      .pattern(/^[0-9.,\s]*$/)
      .allow(''),
    fontFamily: joi
      .string()
      .pattern(/^('[^']+',\s*[a-zA-Z-]+)?$/)
      .allow(''),
    duration: joi.string().pattern(/^\d*$/).allow(''),
    delay: joi.string().pattern(/^\d*$/).allow(''),
    threshold: joi.string().pattern(/^\d*$/).allow(''),
    splitDelay: joi.string().pattern(/^\d*$/).allow(''),
    splitDelayStagger: joi
      .string()
      .pattern(/^[a-z]*$/i)
      .allow(''),
    fontWeight: joi.string().pattern(/^\d*$/).allow(''),
    fontSize: joi.string().pattern(/^\d*$/).allow(''),
    easing: joi.string().allow(''),
    blur: joi
      .string()
      .pattern(/^(blur(-\d+(\.\d+)?)?)?$/)
      .allow(''),
    once: joi.boolean(),
    tuning1: joi.string().pattern(/^\d*$/).allow(''),
    tuning2: joi.string().pattern(/^\d*$/).allow(''),
    tuning3: joi.string().pattern(/^\d*$/).allow(''),
    timeline: joi
      .string()
      .pattern(/^[a-z0-9\s+\-.|]*$/i)
      .allow(''),
    loop: joi.boolean(),
    loopType: joi
      .string()
      .pattern(/^(mirror|jump)$/)
      .allow(''),
    forwards: joi.boolean(),
  });

  function validateAndSanitize(config) {
    const { error, value } = configSchema.validate(config, {
      stripUnknown: true,
    });

    if (error) {
      throw new Error('Invalid configuration');
    }

    if (value.html) {
      value.html = DOMPurify.sanitize(value.html, {
        ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'ul', 'li'],
        ALLOWED_ATTR: ['class', 'id', 'data-usal', 'style'],
      });
    }

    return value;
  }

  function loadFromURL() {
    if (!window.location.hash) return;

    try {
      const compressed = window.location.hash.slice(1);
      const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
      const rawConfig = JSON.parse(decompressed);

      const safeConfig = validateAndSanitize(rawConfig);

      if (safeConfig.html) {
        state.centralHTML = safeConfig.html;
      }

      Object.keys(safeConfig).forEach((key) => {
        if (key !== 'html' && key in state.config) {
          state.config[key] = safeConfig[key];
        }
      });

      requestUpdate('init');
    } catch (e) {
      console.error('Failed to load configuration:', e.message);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  return {
    init,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Playground.init();
});
