class KnotSource {
  constructor(app, secondary=null) {
    this.app = app;
    this.secondary = secondary;
  }

  get knotTag() {
    return {
      source: {
        app: this.app,
        secondary: this.secondary
      }
    };
  }
}
