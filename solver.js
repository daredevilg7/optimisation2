/* Methods from sections 1.3 and 1.5.2 of the supplied laboratory manual. */
(function (root) {
  "use strict";
  const objective = ([x, y]) => x - 1.4 * y + Math.exp(0.01 * x + 0.11 * y);
  function setup(o) {
    const start = o.start || [1, 0],
      epsilon = o.epsilon ?? 1e-4,
      step = o.step ?? 0.5,
      maxIterations = o.maxIterations ?? 120;
    if (
      !start.every(Number.isFinite) ||
      start.length !== 2 ||
      !Number.isFinite(epsilon) ||
      epsilon <= 0 ||
      !Number.isFinite(step) ||
      step <= 0 ||
      !Number.isInteger(maxIterations) ||
      maxIterations < 1 ||
      maxIterations > 2000
    )
      throw Error(
        "Проверьте исходную точку, точность, шаг и число итераций (1–2000).",
      );
    const evaluations = [];
    const fn = o.fn || objective;
    const f = (p, kind = "trial") => {
      const v = fn(p);
      evaluations.push({
        n: evaluations.length + 1,
        x: p[0],
        y: p[1],
        f: v,
        kind,
      });
      return v;
    };
    return { start: [...start], epsilon, step, maxIterations, evaluations, f };
  }
  function golden(phi, a, b, tol) {
    const r = (Math.sqrt(5) - 1) / 2;
    let c = b - r * (b - a),
      d = a + r * (b - a),
      fc = phi(c),
      fd = phi(d),
      n = 0;
    while (b - a > 2 * tol && n++ < 200) {
      if (fc < fd) {
        b = d;
        d = c;
        fd = fc;
        c = b - r * (b - a);
        fc = phi(c);
      } else {
        a = c;
        c = d;
        fc = fd;
        d = a + r * (b - a);
        fd = phi(d);
      }
    }
    return (a + b) / 2;
  }
  function gaussSeidel(o = {}) {
    const s = setup(o),
      { f, epsilon, step, evaluations } = s;
    let point = [...s.start],
      value = f(point, "start"),
      cycles = 0,
      status = "iteration_limit";
    const path = [{ x: point[0], y: point[1], f: value, calls: 1, k: 0 }];
    const lines = [];
    outer: for (let k = 0; k < s.maxIterations; k++) {
      const previous = [...point];
      for (let j = 0; j < 2; j++) {
        const origin = [...point],
          samples = [];
        const phi = (t) => {
          const p = [...origin];
          p[j] += t;
          const v = f(p, "line");
          samples.push({ t, f: v, x: p[0], y: p[1] });
          return v;
        };
        let sign = 1,
          b = step,
          fb = phi(b);
        if (fb >= value) {
          sign = -1;
          b = -step;
          fb = phi(b);
        }
        let a = -step,
          c = step,
          bracketed = fb >= value;
        if (!bracketed) {
          let prev = 0,
            current = b,
            currentF = fb;
          for (let e = 0; e < (o.maxExpansions ?? 12); e++) {
            const next = current * 2,
              nextF = phi(next);
            if (!Number.isFinite(nextF) || nextF >= currentF) {
              a = Math.min(prev, next);
              c = Math.max(prev, next);
              bracketed = true;
              break;
            }
            prev = current;
            current = next;
            currentF = nextF;
          }
        }
        lines.push({ coordinate: j + 1, origin, samples, bracketed });
        if (!bracketed) {
          status = "unbracketed";
          break outer;
        }
        const t = golden(phi, a, c, epsilon / 10);
        point = [...origin];
        point[j] += t;
        value = f(point, "accepted");
        path.push({
          x: point[0],
          y: point[1],
          f: value,
          calls: evaluations.length,
          k: k + 1,
          coordinate: j + 1,
        });
      }
      cycles = k + 1;
      if (
        Math.hypot(point[0] - previous[0], point[1] - previous[1]) <= epsilon
      ) {
        status = "converged";
        break;
      }
    }
    return {
      method: "gs",
      point,
      value,
      path,
      lines,
      evaluations,
      cycles,
      status,
      converged: status === "converged",
      functionCalls: evaluations.length,
      derivativeCalls: 0,
      epsilon,
    };
  }
  function hookeJeeves(o = {}) {
    const s = setup(o),
      { f, epsilon, evaluations } = s;
    let point = [...s.start],
      value = f(point, "start"),
      h = s.step,
      k = 0,
      reductions = 0,
      status = "iteration_limit";
    const path = [{ x: point[0], y: point[1], f: value, calls: 1, k: 0, h }];
    const sweeps = [];
    while (k < s.maxIterations) {
      let z = [...point],
        fz = value;
      for (let j = 0; j < 2; j++) {
        let p = [...z];
        p[j] += h;
        let v = f(p, "explore+");
        if (v < fz) {
          z = p;
          fz = v;
        } else {
          p = [...z];
          p[j] -= h;
          v = f(p, "explore-");
          if (v < fz) {
            z = p;
            fz = v;
          }
        }
      }
      k++;
      const improved = fz < value;
      sweeps.push({ k, h, improved, calls: evaluations.length });
      if (!improved) {
        h /= 2;
        reductions++;
        if (h <= epsilon) {
          status = "step_tolerance";
          break;
        }
        continue;
      }
      // Variant (a), section 1.5.2: lambda=1, so the explored point becomes the new base.
      point = z;
      value = fz;
      path.push({
        x: point[0],
        y: point[1],
        f: value,
        calls: evaluations.length,
        k,
        h,
      });
    }
    return {
      method: "hj",
      point,
      value,
      path,
      sweeps,
      evaluations,
      iterations: k,
      reductions,
      finalStep: h,
      status,
      converged: status === "step_tolerance",
      functionCalls: evaluations.length,
      derivativeCalls: 0,
      epsilon,
    };
  }
  const api = { objective, golden, gaussSeidel, hookeJeeves };
  if (typeof module !== "undefined") module.exports = api;
  else root.Lab = api;
})(typeof window !== "undefined" ? window : globalThis);
