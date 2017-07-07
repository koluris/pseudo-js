pseudo.CstrCop2 = (function() {
  let cop2c = union(32*4);
  let cop2d = union(32*4);

  return {
    reset() {
      cop2c.ub.fill(0);
      cop2d.ub.fill(0);
    },

    execute(code) {
      console.dir('COP2 Execute '+hex(code&63));
    }
  };
})();
