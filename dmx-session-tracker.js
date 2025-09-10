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
      this._startTimers(this);
    }
  },

  events: {
    timeout: Event,
    notify: Event
  },

  init() {
    this.trackEvents = [];

    // console.log("Props:", this.props);

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

    this.set("trackEvents", this.trackEvents);

    // if (this.trackEvents.length !== 0) {
    //   this.setupInactivityTimer();
    // }

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

      // Reset inactivity cycle
      this._startTimers(this);
    }

    console.log(this);

    // Attach activity listeners
    this.trackEvents.forEach(evt => {
      window.addEventListener(evt, resetOnActivity, true);
    });

    // Start initial cycle
    this._startTimers(this);
  },

  _clearTimers(context) {
    clearTimeout(context.warningTimeout);
    clearTimeout(context.redirectTimeout);
  },

  _startTimers: function (context) {
    context._clearTimers(context);

    // Show confirm at idle_warn_time
    context.warningTimeout = setTimeout(() => {
      dmx.nextTick(function () {
        this.dispatchEvent("notify");
      }, context);
      context.set("remaining", context.props.max_idle_time - context.props.idle_warn_time);
    }, context.props.idle_warn_time * 1000);

    // Hard redirect at 60s if confirm ignored
    context.redirectTimeout = setTimeout(() => {
      dmx.nextTick(function () {
        this.dispatchEvent("timeout");
      }, context);
    }, context.props.max_idle_time * 1000);
  },

  performUpdate: function (updatedProps) {
    if (updatedProps.has('max_idle_time') || updatedProps.has('idle_warn_time')) {
      this._startTimers();
    }
  }
});
