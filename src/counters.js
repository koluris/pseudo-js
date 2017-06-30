pseudo.CstrCounters = (function() {
  var timer;

  // Exposed class functions/variables
  return {
    awake() {
      timer = [];
    },

    reset() {
      for (let i=0; i<3; i++) {
        timer[i] = {
          hi: 0
        };
      }
    },

    update() {
    }
  };
})();
