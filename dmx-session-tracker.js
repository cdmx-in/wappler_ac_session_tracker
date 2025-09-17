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
    idle_warn_time: { type: Number, default: 240 }
  },

  methods: {
    reset: function () {
      this._setCookie();
      dmx.nextTick(function () {
        this.dispatchEvent("reset");
      }, this);
      this._startTimers(this);
    }
  },

  events: {
    timeout: Event,
    notify: Event,
    reset: Event
  },

  init() {
    this.trackEvents = [];

    if (this.props.enable_keydown) {
      this.trackEvents.push('keydown');
    }

    if (this.props.enable_click) {
      this.trackEvents.push('click');
    }

    if (this.props.enable_scroll) {
      this.trackEvents.push('scroll');
    }

    if (this.props.enable_input) {
      this.trackEvents.push('input');
    }

    this._setCookie();

    this.set("trackEvents", this.trackEvents);
    this.setupInactivityTimer();

  },

  _setCookie() {
    const expiresAt = new Date(Date.now() + this.props.max_idle_time * 1000).toUTCString();
    document.cookie = `ss_exp=${Date.now() + this.props.max_idle_time * 1000}; expires=${expiresAt}; path=/; SameSite=Lax`;
  },

  destroy() {
    clearTimeout(this._timeoutTimer);
    clearTimeout(this._notifyTimer);
    ['click', 'keydown', 'scroll', 'input'].forEach(evt => window.removeEventListener(evt, this.activityHandler));
  },

  setupInactivityTimer() {
    // Activity handler (reset timer on real activity)
    const resetOnActivity = (e) => {
      // Ignore pure mouse movements
      if (e.type === "mousemove") return;

      this._setCookie();

      dmx.nextTick(function () {
        this.dispatchEvent("reset");
      }, this);

      // Reset inactivity cycle
      this._startTimers(this);
    }

    // Attach activity listeners
    this.trackEvents.forEach(evt => {
      window.addEventListener(evt, resetOnActivity, true);
    });

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
      if (countdown > 0) {
        context.set("remaining", countdown - 1);
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
    const expiryCookie = cookies.find(c => c.startsWith('ss_exp='));
    const remainingTime = maxIdleTime - idleWarnTime;

    let warningTimeoutTime = idleWarnTime * 1000;
    let timeoutTime = maxIdleTime * 1000;

    if (expiryCookie) {
      context._clearTimers(context);

      const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
      if (expiresIn <= remainingTime) {
        dmx.nextTick(function () {
          const cookies = document.cookie.split(';').map(c => c.trim());
          const expiryCookie = cookies.find(c => c.startsWith('ss_exp='));
          const remainingTime = maxIdleTime - idleWarnTime;
          const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
          if (expiresIn <= remainingTime) {
            this.set("remaining", remainingTime);
            this._setInterval(this);
            this.dispatchEvent("notify");
          } else {
            this._startTimers(this);
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
            const expiryCookie = cookies.find(c => c.startsWith('ss_exp='));
            const remainingTime = maxIdleTime - idleWarnTime;
            const expiresIn = (parseInt(expiryCookie.split('=')[1], 10) - Date.now()) / 1000;
            if (expiresIn <= remainingTime) {
              this.set("remaining", remainingTime);
              this._setInterval(this);
              this.dispatchEvent("notify");
            } else {
              this._startTimers(this);
            }
          }, context);
        }, warningTimeoutTime);
      }

      // Hard redirect at 60s if confirm ignored
      context.sessionTimeout = setTimeout(() => {
        dmx.nextTick(function () {
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
