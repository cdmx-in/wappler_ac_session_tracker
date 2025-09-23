dmx.Component('session-tracker', {
  initialData: {
    remaining: null,
    trackEvents: []
  },

  attributes: {
    id: { type: String },
    enable_keydown: { type: Boolean, default: false },
    enable_click: { type: Boolean, default: false },
    enable_scroll: { type: Boolean, default: false },
    enable_input: { type: Boolean, default: false },
    max_idle_time: { type: Number, default: 300 },
    idle_warn_time: { type: Number, default: 240 },
    debounce_time: { type: Number, default: 5 },
    cookie_name: { type: String, default: 'ss_exp' },

  },

  methods: {
    reset: function () {
      this._setCookie();
      this.trackEvents.forEach(evt => evt.add());
      dmx.nextTick(function () {
        this.dispatchEvent("reset");
      }, this);
      this._startTimers(this);
    },
    clear: function () {
      this._clearCookie();
    },
    destroy: function () {
      this._destroy();
    }
  },

  events: {
    timeout: Event,
    notify: Event,
    reset: Event
  },

  init() {
    this.trackEvents = [];
    this._debounceTimer = null;
    this._timeoutTimer = null;
    this._notifyTimer = null;
    this.warningTimeout = null;
    this.sessionTimeout = null;
    this.notifyInterval = null;

    // Setup inactivity timer
    this._setCookie();
    this.setupInactivityTimer();

  },

  _setCookie() {
    const expiresAt = new Date(Date.now() + this.props.max_idle_time * 1000).toUTCString();
    document.cookie = `${this.props.cookie_name}=${Date.now() + this.props.max_idle_time * 1000}; expires=${expiresAt}; path=/; SameSite=Lax`;
  },

  _destroy() {
    this._clearTimers(this);
    this._clearInterval(this);
    this.trackEvents.forEach(evt => evt.remove());
  },

  _clearCookie() {
    document.cookie = `${this.props.cookie_name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  },

  _debouncedReset() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      dmx.nextTick(function () {
        this.dispatchEvent("reset");
      }, this);
    }, this.props.debounce_time * 1000);
  },

  setupInactivityTimer() {
    // Activity handler (reset timer on real activity)
    const resetOnActivity = (e) => {
      // Ignore pure mouse movements
      if (e.type === "mousemove") return;

      this._setCookie();
      this._debouncedReset();

      // Reset inactivity cycle
      this._startTimers(this);
    }

    const handleKeydown = (e) => {
      // Ignore pure modifier keys
      if (["Shift", "Alt", "Control", "Meta"].includes(e.key)) return;
      resetOnActivity(e);
    }

    if (this.props.enable_keydown) {
      this.trackEvents.push(
        {
          'add': () => window.addEventListener('keydown', handleKeydown, true),
          'remove': () => window.removeEventListener('keydown', handleKeydown, true)
        });
    }

    if (this.props.enable_click) {
      this.trackEvents.push(
        {
          'add': () => window.addEventListener('click', resetOnActivity, true),
          'remove': () => window.removeEventListener('click', resetOnActivity, true)
        });
    }

    if (this.props.enable_scroll) {
      this.trackEvents.push(
        {
          'add': () => window.addEventListener('scroll', resetOnActivity, { capture: true, passive: true }),
          'remove': () => window.removeEventListener('scroll', resetOnActivity, { capture: true, passive: true })
        });
    }

    if (this.props.enable_input) {
      this.trackEvents.push(
        {
          'add': () => window.addEventListener('input', resetOnActivity, true),
          'remove': () => window.removeEventListener('input', resetOnActivity, true)
        });
    }

    // this.set("trackEvents", this.trackEvents);

    this.trackEvents.forEach(evt => evt.add());

    // Start initial cycle
    this._startTimers(this);
  },

  _clearTimers(context) {
    clearTimeout(context.warningTimeout);
    clearTimeout(context.sessionTimeout);
  },

  _setInterval: function (context) {
    context._clearInterval(context);

    context.notifyInterval = setInterval(() => {
      const countdown = context.data.remaining;
      const maxIdleTime = context.props.max_idle_time;
      const idleWarnTime = context.props.idle_warn_time;
      const cookies = document.cookie.split(';').map(c => c.trim());
      const expiryCookie = cookies.find(c => c.startsWith(`${context.props.cookie_name}=`));
      const remainingTime = parseInt(maxIdleTime - idleWarnTime);
      if (!expiryCookie) {
        context.set("remaining", null);
        context._clearInterval(context);
        return;
      }
      const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;

      if (expiresIn > remainingTime) {
        // User has reset during countdown
        context.set("remaining", null);
        context._clearInterval(context);
        context._startTimers(context);
        return;
      }


      if (countdown > 0) {
        context.set("remaining", parseInt(expiresIn));
      } else {
        context._clearInterval(context);
      }
    }, 1000);

  },

  _clearInterval: function (context) {
    clearInterval(context.notifyInterval);
  },

  _startTimers: function (context) {

    const maxIdleTime = context.props.max_idle_time;
    const idleWarnTime = context.props.idle_warn_time;

    if (idleWarnTime >= maxIdleTime) {
      console.warn("idle_warn_time should be less than max_idle_time");
      return;
    }

    const cookies = document.cookie.split(';').map(c => c.trim());
    const expiryCookie = cookies.find(c => c.startsWith(`${context.props.cookie_name}=`));
    const remainingTime = parseInt(maxIdleTime - idleWarnTime);

    let warningTimeoutTime = idleWarnTime * 1000;
    let timeoutTime = maxIdleTime * 1000;

    if (expiryCookie) {
      context._clearTimers(context);

      const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
      if (expiresIn <= remainingTime) {
        dmx.nextTick(function () {
          const cookies = document.cookie.split(';').map(c => c.trim());
          const expiryCookie = cookies.find(c => c.startsWith(`${this.props.cookie_name}=`));
          const remainingTime = parseInt(maxIdleTime - idleWarnTime);
          if (expiryCookie) {
            const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
            if (expiresIn <= remainingTime) {
              this.set("remaining", remainingTime);
              this._setInterval(this);
              this.dispatchEvent("notify");
            } else {
              this._startTimers(this);
            }
          }
        }, context);

        timeoutTime = expiresIn * 1000;

      } else {
        const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
        warningTimeoutTime = (expiresIn - remainingTime) * 1000;
        timeoutTime = expiresIn * 1000;
        // Show confirm at idle_warn_time
        context.warningTimeout = setTimeout(() => {
          dmx.nextTick(function () {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const expiryCookie = cookies.find(c => c.startsWith(`${this.props.cookie_name}=`));
            const remainingTime = parseInt(maxIdleTime - idleWarnTime);
            if (expiryCookie) {
              const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
              if (expiresIn <= remainingTime) {
                this.set("remaining", remainingTime);
                this._setInterval(this);
                this.trackEvents.forEach(evt => evt.remove());
                this.dispatchEvent("notify");
              } else {
                this._startTimers(this);
              }
            }
          }, context);
        }, warningTimeoutTime);
      }

      // Hard redirect at 60s if confirm ignored
      context.sessionTimeout = setTimeout(() => {
        dmx.nextTick(function () {
          this.trackEvents.forEach(evt => evt.remove());
          this.dispatchEvent("timeout");
        }, context);
      }, timeoutTime);
    }

  },

  performUpdate: function (updatedProps) {
    if (updatedProps.has('max_idle_time') || updatedProps.has('idle_warn_time')) {
      this._startTimers();
    }
  }
});
