const Playground = (() => {
  const state = {
    editor: null,
    isUpdating: false,
    lastHTML: '',
    config: {
      animationType: '',
      splitType: '',
      textEffect: '',
      countTarget: '',
      duration: '1000',
      delay: '0',
      threshold: '10',
      splitDelay: '50',
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
      forwards: false,
    },
  };

  const presets = {
    hero: {
      html: '<h1>Welcome to USAL</h1>',
      animationType: 'fade-d',
      duration: '1000',
      blur: 'blur',
    },
    cards: {
      html: `<div class="cards" style="display: flex">
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
      html: '<p>In 2025, we will earn US$21 000 000.00 in the first quarter alone.</p>',
      countTarget: '21 000 000.00',
      duration: '5000',
      fontFamily: "'Montserrat', sans-serif",
    },
    shimmer: {
      html: '<h1>SHIMMER EFFECT</h1>',
      textEffect: 'text-shimmer',
      splitType: 'split-letter',
      duration: '2000',
      splitDelay: '50',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '700',
    },
    fluid: {
      html: '<h1>Fluid Weight Animation</h1>',
      textEffect: 'text-fluid',
      splitType: 'split-letter',
      duration: '2000',
      splitDelay: '50',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '100',
    },
    paragraph: {
      html: '<p>Modern web development is all about creating smooth, engaging user experiences that delight visitors.</p>',
      splitType: 'split-word',
      animationType: 'fade-u',
      splitDelay: '50',
      duration: '800',
    },
    tuning: {
      html: '<h1>Tuned Animation</h1>',
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
  ">BANG!</div>`,
      timeline:
        'p+150 ry+0 | 20 ry+1440 | 50 ry+2160 | 80 ry+2340 | 95 ry+2430 rx+30 | ry+2440 rx+90',
      duration: '5000',
      forwards: true,
    },
    loop: {
      html: '<div class="pulse">Continuous Loop</div>',
      animationType: 'fade',
      loop: true,
      duration: '1000',
    },
  };

  function init() {
    initEditor();
    attachEventListeners();
    loadFromURL();
    updateFromState();
  }

  function initEditor() {
    state.editor = CodeMirror(document.getElementById('editor'), {
      value: '<div>Hello USAL!</div>',
      mode: 'xml',
      theme: 'yonce',
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentWithTabs: false,
    });

    state.lastHTML = state.editor.getValue();

    state.editor.on(
      'change',
      debounce(() => {
        if (state.isUpdating) return;

        const newHTML = state.editor.getValue();
        if (newHTML !== state.lastHTML) {
          state.lastHTML = newHTML;
          const match = newHTML.match(/data-usal="([^"]*)"/);
          if (match) {
            parseDataUsalToConfig(match[1]);
          } else {
            parseDataUsalToConfig('');
          }
          updatePreview();
        }
      }, 500)
    );
  }

  function attachEventListeners() {
    Object.keys(state.config).forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        const eventType = element.type === 'checkbox' ? 'change' : 'input';

        element.addEventListener(
          eventType,
          debounce(() => {
            if (state.isUpdating) return;

            if (element.type === 'checkbox') {
              state.config[key] = element.checked;
            } else {
              state.config[key] = element.value;
            }

            updateFromState();
          }, 300)
        );
      }
    });

    document.getElementById('resetBtn')?.addEventListener('click', reset);
    document.getElementById('shareBtn')?.addEventListener('click', share);
    document.getElementById('copyBtn')?.addEventListener('click', copyCode);

    document.getElementById('easing').addEventListener('change', (e) => {
      const customField = document.getElementById('easingCustom');
      if (e.target.value === 'custom') {
        customField.style.display = 'block';
      } else {
        customField.style.display = 'none';
      }
    });

    document.getElementById('easingCustom').addEventListener(
      'input',
      debounce(() => {
        if (state.isUpdating) return;
        state.config.easing = document.getElementById('easingCustom').value;
        updateFromState();
      }, 300)
    );

    document.getElementById('animationType').addEventListener('change', (e) => {
      const timelineSection = document.getElementById('customTimelineSection');
      if (e.target.value === 'custom-timeline') {
        timelineSection.style.display = 'block';
      } else {
        timelineSection.style.display = 'none';
      }
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
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

    fontWeight: joi.string().pattern(/^\d*$/).allow(''),

    fontSize: joi.string().pattern(/^\d*$/).allow(''),

    easing: joi
      .string()
      .pattern(
        /^(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|cubic-bezier\([^)]+\)|steps\([^)]+\)|linear\([^)]+\))?$/
      )
      .allow(''),

    blur: joi
      .string()
      .pattern(/^(blur(-\d+)?)?$/)
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

  function parseDataUsalToConfig(dataUsal) {
    if (!dataUsal) return;

    const tokens = dataUsal.trim().split(/\s+/).filter(Boolean);
    const newConfig = { ...state.config };

    // Reset all
    newConfig.animationType = '';
    newConfig.splitType = '';
    newConfig.textEffect = '';
    newConfig.countTarget = '';
    newConfig.easing = '';
    newConfig.blur = '';
    newConfig.once = false;
    newConfig.loop = false;
    newConfig.forwards = false;
    newConfig.tuning1 = '';
    newConfig.tuning2 = '';
    newConfig.tuning3 = '';
    newConfig.timeline = '';

    for (const token of tokens) {
      // Parse animation with tuning
      if (token.match(/^(fade|zoomin|zoomout|flip)(-[udlr]{1,2})?(-\d+)?(-\d+)?(-\d+)?$/)) {
        const parts = token.split('-');
        newConfig.animationType = parts.slice(0, 2).join('-').replace(/--/, '-');

        // Extract tuning values
        const numbers = parts.slice(2).filter((p) => /^\d+$/.test(p));
        if (numbers[0]) newConfig.tuning1 = numbers[0];
        if (numbers[1]) newConfig.tuning2 = numbers[1];
        if (numbers[2]) newConfig.tuning3 = numbers[2];
        continue;
      }

      // Parse custom timeline
      if (token.startsWith('line-[') && token.endsWith(']')) {
        newConfig.timeline = token.slice(6, -1);
        continue;
      }

      // Parse loop
      if (token === 'loop') {
        newConfig.loop = true;
        continue;
      }

      // Parse forwards
      if (token === 'forwards') {
        newConfig.forwards = true;
        continue;
      }

      if (token.startsWith('split-')) {
        const splitPart = token.replace('split-', '');

        if (['word', 'letter', 'item'].includes(splitPart)) {
          newConfig.splitType = token;
        } else if (splitPart.startsWith('delay-')) {
          newConfig.splitDelay = splitPart.replace('delay-', '');
        } else if (splitPart.match(/^(fade|zoomin|zoomout|flip)(-[udlr]{1,2})?$/)) {
        }
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
        newConfig.delay = token.replace('delay-', '');
        continue;
      }

      if (token.startsWith('threshold-')) {
        newConfig.threshold = token.replace('threshold-', '');
        continue;
      }

      if (token.startsWith('easing-[') && token.endsWith(']')) {
        newConfig.easing = token;
        continue;
      }

      if (['linear', 'ease', 'ease-in', 'ease-out'].includes(token)) {
        newConfig.easing = token;
        continue;
      }

      if (token === 'blur') {
        newConfig.blur = 'blur';
        continue;
      }
      if (token.match(/^blur-\d+$/)) {
        newConfig.blur = token;
        continue;
      }

      if (token === 'once') {
        newConfig.once = true;
      }
    }

    Object.keys(newConfig).forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = newConfig[key];
        } else {
          element.value = newConfig[key];
        }
      }
    });

    state.config = newConfig;
  }

  function generateDataUsal() {
    const parts = [];
    const { config } = state;

    if (config.animationType) {
      let animation = config.animationType.replace('custom-timeline', '');

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

    if (config.splitType) {
      parts.push(config.splitType);

      if (config.animationType && config.splitType !== 'split-item') {
        parts.push(`split-${config.animationType}`);
      }

      if (config.splitDelay && config.splitDelay !== '50') {
        parts.push(`split-delay-${config.splitDelay}`);
      }
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

    const easing = document.getElementById('easing').value;
    if (easing === 'custom') {
      const customValue = document.getElementById('easingCustom').value;
      if (customValue) {
        parts.push(`easing-[${customValue}]`);
      }
    } else if (easing) {
      parts.push(easing);
    }

    if (config.blur) {
      parts.push(config.blur);
    }

    if (config.once) {
      parts.push('once');
    }

    if (config.loop) {
      parts.push('loop');
    }

    if (config.forwards) {
      parts.push('forwards');
    }

    return parts.join(' ');
  }

  function updateFromState() {
    if (state.isUpdating) return;

    state.isUpdating = true;

    try {
      const dataUsal = generateDataUsal();

      updateGeneratedCode(dataUsal);

      updateEditorDataUsal(dataUsal);

      renderPreview();
    } finally {
      state.isUpdating = false;
    }
  }

  function updateGeneratedCode(dataUsal) {
    const codeElement = document.getElementById('generatedCode');
    if (codeElement) {
      codeElement.textContent = dataUsal ? `data-usal="${dataUsal}"` : 'No animation configured';
    }
  }

  function updateEditorDataUsal(dataUsal) {
    const html = state.editor.getValue();

    // eslint-disable-next-line sonarjs/slow-regex
    const cleanHTML = html.replace(/\s*data-usal="[^"]*"/g, '');

    if (!dataUsal) {
      if (cleanHTML !== html) {
        state.lastHTML = cleanHTML;
        state.editor.setValue(cleanHTML);
      }
      return;
    }

    let updatedHtml;

    const hasTag = /<[a-zA-Z][^>]*>/.test(cleanHTML);

    if (hasTag) {
      updatedHtml = cleanHTML.replace(/(<[a-zA-Z][^>]*?)(\/?>)/, `$1 data-usal="${dataUsal}"$2`);
    } else {
      updatedHtml = `<div data-usal="${dataUsal}">${cleanHTML}</div>`;
    }

    if (updatedHtml !== html) {
      const cursor = state.editor.getCursor();
      const scrollInfo = state.editor.getScrollInfo();

      state.lastHTML = updatedHtml;
      state.editor.setValue(updatedHtml);
      state.editor.setCursor(cursor);
      state.editor.scrollTo(scrollInfo.left, scrollInfo.top);
    }
  }

  function renderPreview() {
    const preview = document.getElementById('preview');
    const html = state.editor.getValue();

    preview.innerHTML = '';

    const temp = document.createElement('div');
    temp.innerHTML = DOMPurify.sanitize(html);

    while (temp.firstChild) {
      preview.appendChild(temp.firstChild);
    }

    applyTypography();

    if (window.USAL) {
      window.USAL.restart();
    }
  }

  function updatePreview() {
    if (state.isUpdating) return;

    state.isUpdating = true;

    try {
      renderPreview();
    } finally {
      state.isUpdating = false;
    }
  }

  function applyTypography() {
    const preview = document.getElementById('preview');
    const { fontFamily, fontWeight, fontSize } = state.config;

    preview.style.fontFamily = fontFamily || '';
    preview.style.fontWeight = fontWeight || '';
    preview.style.fontSize = fontSize ? `${fontSize}px` : '';
  }

  function reset() {
    state.isUpdating = true;

    state.config = {
      animationType: '',
      splitType: '',
      textEffect: '',
      countTarget: '',
      duration: '1000',
      delay: '0',
      threshold: '10',
      splitDelay: '50',
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
      forwards: false,
    };

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

    state.lastHTML = '<div>Hello USAL!</div>';
    state.editor.setValue(state.lastHTML);

    state.isUpdating = false;

    updateFromState();
  }

  function loadPreset(name) {
    const preset = presets[name];
    if (!preset) return;

    state.isUpdating = true;

    reset();

    Object.keys(preset).forEach((key) => {
      if (key === 'html') {
        state.lastHTML = preset.html;
        state.editor.setValue(preset.html);
      } else if (key in state.config) {
        state.config[key] = preset[key];

        const element = document.getElementById(key);
        if (element) {
          if (element.type === 'checkbox') {
            element.checked = preset[key];
          } else {
            element.value = preset[key];
          }
        }
      }
    });

    state.isUpdating = false;

    updateFromState();
  }

  function share() {
    const config = {
      html: state.editor.getValue(),
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

  function loadFromURL() {
    if (!window.location.hash) return;

    try {
      const compressed = window.location.hash.slice(1);
      const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
      const rawConfig = JSON.parse(decompressed);

      const safeConfig = validateAndSanitize(rawConfig);

      state.isUpdating = true;

      if (safeConfig.html) {
        state.editor.setValue(safeConfig.html);
      }

      Object.keys(safeConfig).forEach((key) => {
        if (key !== 'html' && key in state.config) {
          state.config[key] = safeConfig[key];
          const el = document.getElementById(key);
          if (el) {
            el[el.type === 'checkbox' ? 'checked' : 'value'] = safeConfig[key];
          }
        }
      });

      state.isUpdating = false;
      updateFromState();
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
