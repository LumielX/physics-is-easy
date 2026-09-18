import { describe, expect, it } from 'vitest';

import { positionAt, velocityAt, freeFall, timeToFall, stoppingDistance } from '@/lib/physics-engine/kinematics';
import { incline, atwood, maxStaticFriction } from '@/lib/physics-engine/dynamics';
import { kineticEnergy, gravitationalPE, speedFromHeight, power } from '@/lib/physics-engine/energy';
import { collision1D, perfectlyInelastic, recoilSpeed } from '@/lib/physics-engine/momentum';
import { projectile, anglesForRange, maxRange } from '@/lib/physics-engine/projectile';
import { centripetalAccel, orbitalPeriod, bankedCurve, escapeSpeed } from '@/lib/physics-engine/circular';
import { torque, beamReactions, centreOfGravity, tippingAngleDeg } from '@/lib/physics-engine/statics';
import { springPeriod, pendulumPeriod, pendulumPeriodExact, shmSpeedAt, omegaSpring } from '@/lib/physics-engine/shm';
import { waveSpeed, stringWaveSpeed, harmonicFrequency, beatFrequency } from '@/lib/physics-engine/waves';
import { decibels, doppler, soundSpeedAt, closedPipeHarmonics } from '@/lib/physics-engine/sound';
import { snell, criticalAngle, imageFormation, fringeSpacing } from '@/lib/physics-engine/optics';
import { coulombForce, solveCircuit, parallelResistance, capacitorEnergy } from '@/lib/physics-engine/electricity';
import { lorentzForce, cyclotronRadius, transformer, wireField } from '@/lib/physics-engine/magnetism';
import { gasPressure, mixtureTemperature, rmsSpeed, carnotEfficiency } from '@/lib/physics-engine/thermal';
import { floatation, gaugePressure, hydraulicForce, effluxSpeed } from '@/lib/physics-engine/fluids';
import { photoelectric, bohrEnergy, transitionWavelengthNm, remainingNuclei, bindingEnergy } from '@/lib/physics-engine/modern';
import { solveQuadratic, round } from '@/lib/physics-engine/math';
import { countSigFigs, kmhToMs, withSIPrefix } from '@/lib/physics-engine/units';

/**
 * These tests are the guarantee behind the claim that every simulator
 * "calculates from real physics". Each expected value is one that can be
 * worked out by hand from the textbook formulas — if a refactor breaks the
 * physics, these go red before anything reaches a learner.
 */

describe('math helpers', () => {
  it('solves quadratics including the numerically awkward case', () => {
    expect(solveQuadratic(1, -3, 2)).toEqual([1, 2]);
    expect(solveQuadratic(1, 2, 1)).toEqual([-1]);
    expect(solveQuadratic(1, 0, 1)).toEqual([]);
  });

  it('rounds without producing negative zero', () => {
    expect(Object.is(round(-0.0001, 2), 0)).toBe(true);
  });
});

describe('kinematics', () => {
  it('reproduces the standard constant-acceleration results', () => {
    // v = v0 + at: 0 + 2(6) = 12
    expect(velocityAt(0, 2, 6)).toBe(12);
    // x = v0t + ½at²: 0 + ½(2)(36) = 36
    expect(positionAt(0, 0, 2, 6)).toBe(36);
  });

  it('gives the textbook free-fall values for a 19.6 m/s throw', () => {
    const r = freeFall(19.6, 9.8);
    expect(r.timeToApex).toBeCloseTo(2, 6);
    expect(r.maxHeight).toBeCloseTo(19.6, 6);
    expect(r.totalTime).toBeCloseTo(4, 6);
  });

  it('computes fall time and stopping distance', () => {
    expect(timeToFall(45, 10)).toBeCloseTo(3, 6);
    // 20 m/s braking at 4 m/s² stops in 50 m
    expect(stoppingDistance(20, 4)).toBeCloseTo(50, 6);
  });
});

describe('dynamics', () => {
  it('keeps a block static below the friction limit and moving above it', () => {
    // 4 kg, μs = 0.5 → limit 19.6 N. A 30° slope pulls 19.6 N, right at the edge.
    const gentle = incline(10, 15, 0.5, 0.3, 0, 9.8);
    expect(gentle.static).toBe(true);
    expect(gentle.accel).toBe(0);

    const steep = incline(5, 30, 0.2, 0.2, 0, 10);
    expect(steep.static).toBe(false);
    // a = g(sinθ − μcosθ) = 10(0.5 − 0.2·0.866) = 3.27
    expect(steep.accel).toBeCloseTo(3.268, 2);
  });

  it('reports the critical angle as arctan(μs)', () => {
    const r = incline(3, 10, 0.7, 0.5, 0, 9.8);
    expect(r.criticalAngleDeg).toBeCloseTo(34.99, 1);
  });

  it('solves the Atwood machine', () => {
    // (5−3)(10)/8 = 2.5 m/s², T = 2(3)(5)(10)/8 = 37.5 N
    const r = atwood(3, 5, 10);
    expect(r.accel).toBeCloseTo(2.5, 6);
    expect(r.tension).toBeCloseTo(37.5, 6);
  });

  it('computes the static friction ceiling', () => {
    expect(maxStaticFriction(0.4, 100)).toBeCloseTo(40, 6);
  });
});

describe('work and energy', () => {
  it('uses the ½mv² and mgh definitions', () => {
    expect(kineticEnergy(2, 10)).toBe(100);
    expect(gravitationalPE(2, 5, 10)).toBe(100);
  });

  it('gives v = √(2gh) independent of mass', () => {
    expect(speedFromHeight(5, 10)).toBeCloseTo(10, 6);
  });

  it('computes power as work over time', () => {
    expect(power(6000, 20)).toBe(300);
  });
});

describe('momentum and collisions', () => {
  it('conserves momentum in a perfectly inelastic collision', () => {
    const r = perfectlyInelastic(2, 6, 4, 0);
    expect(r.v).toBeCloseTo(2, 6);
    expect(r.energyLost).toBeCloseTo(24, 6);
  });

  it('makes equal masses swap velocities in an elastic collision', () => {
    const r = collision1D(3, 5, 3, 0, 1);
    expect(r.v1).toBeCloseTo(0, 6);
    expect(r.v2).toBeCloseTo(5, 6);
    // kinetic energy is conserved when e = 1
    expect(r.keAfter).toBeCloseTo(r.keBefore, 6);
  });

  it('conserves momentum for every restitution value', () => {
    for (const e of [0, 0.3, 0.7, 1]) {
      const r = collision1D(2, 5, 3, -2, e);
      const before = 2 * 5 + 3 * -2;
      const after = 2 * r.v1 + 3 * r.v2;
      expect(after).toBeCloseTo(before, 9);
    }
  });

  it('computes recoil speed', () => {
    expect(recoilSpeed(800, 5, 320)).toBeCloseTo(2, 6);
  });
});

describe('projectile motion', () => {
  it('matches the classic 50 m/s at 37° problem', () => {
    const r = projectile({ speed: 50, angleDeg: 36.87, height: 0, g: 10 });
    expect(r.timeOfFlight).toBeCloseTo(6, 1);
    expect(r.maxHeight).toBeCloseTo(45, 0);
    expect(r.range).toBeCloseTo(240, 0);
  });

  it('gives equal range for complementary angles', () => {
    const a = projectile({ speed: 25, angleDeg: 30, g: 9.8 }).range;
    const b = projectile({ speed: 25, angleDeg: 60, g: 9.8 }).range;
    expect(a).toBeCloseTo(b, 6);
  });

  it('maximises range at 45°', () => {
    expect(maxRange(20, 10)).toBeCloseTo(40, 6);
    const angles = anglesForRange(20, 40, 10);
    expect(angles).not.toBeNull();
    expect(angles![0]).toBeCloseTo(45, 4);
  });

  it('handles a horizontal launch from a cliff', () => {
    const r = projectile({ speed: 20, angleDeg: 0, height: 45, g: 10 });
    expect(r.timeOfFlight).toBeCloseTo(3, 6);
    expect(r.range).toBeCloseTo(60, 6);
  });
});

describe('circular motion and gravitation', () => {
  it('computes centripetal acceleration', () => {
    expect(centripetalAccel(4, 0.5)).toBeCloseTo(32, 6);
  });

  it('gives a geostationary period at the known radius', () => {
    const T = orbitalPeriod(5.9722e24, 4.2164e7);
    // A sidereal day is 86164 s
    expect(T).toBeGreaterThan(86000);
    expect(T).toBeLessThan(86400);
  });

  it('computes escape speed from Earth as ~11.2 km/s', () => {
    expect(escapeSpeed(5.9722e24, 6.371e6) / 1000).toBeCloseTo(11.18, 1);
  });

  it('gives a sensible banked-curve speed', () => {
    const r = bankedCurve(50, 30, 0, 10);
    // v = √(rg tanθ) = √(50·10·0.5774) = 17.0
    expect(r.idealSpeed).toBeCloseTo(17.0, 1);
  });
});

describe('statics', () => {
  it('computes torque with the sine factor', () => {
    expect(torque(0.5, 40, 30)).toBeCloseTo(10, 6);
    expect(torque(0.3, 25, 90)).toBeCloseTo(7.5, 6);
  });

  it('solves beam reactions that sum to the total weight', () => {
    const r = beamReactions(4, 20, 0, 4, [{ x: 1, mass: 60 }], 10);
    expect(r.reactionA).toBeCloseTo(550, 6);
    expect(r.reactionB).toBeCloseTo(250, 6);
    expect(r.reactionA + r.reactionB).toBeCloseTo(800, 6);
  });

  it('finds the centre of gravity of a three-mass system', () => {
    const x = centreOfGravity([
      { mass: 2, x: 0 },
      { mass: 3, x: 2 },
      { mass: 5, x: 6 },
    ]);
    expect(x).toBeCloseTo(3.6, 6);
  });

  it('computes the tipping angle', () => {
    expect(tippingAngleDeg(0.4, 0.8)).toBeCloseTo(26.57, 1);
  });
});

describe('simple harmonic motion', () => {
  it('quadruples mass to double the period', () => {
    const t1 = springPeriod(1, 20);
    const t4 = springPeriod(4, 20);
    expect(t4 / t1).toBeCloseTo(2, 6);
  });

  it('gives a 1 m pendulum a period near 2 s', () => {
    expect(pendulumPeriod(1, 9.8)).toBeCloseTo(2.006, 2);
  });

  it('shows the small-angle formula drifting at large amplitude', () => {
    const small = pendulumPeriodExact(1, 5, 9.8) / pendulumPeriod(1, 9.8);
    const large = pendulumPeriodExact(1, 60, 9.8) / pendulumPeriod(1, 9.8);
    expect(small).toBeCloseTo(1.0005, 3);
    expect(large).toBeGreaterThan(1.06);
  });

  it('gives zero speed at maximum displacement', () => {
    const omega = omegaSpring(20, 1);
    expect(shmSpeedAt(0.25, omega, 0.25)).toBeCloseTo(0, 9);
    expect(shmSpeedAt(0.25, omega, 0)).toBeCloseTo(0.25 * omega, 9);
  });
});

describe('waves and sound', () => {
  it('applies v = fλ', () => {
    expect(waveSpeed(50, 0.4)).toBeCloseTo(20, 6);
  });

  it('computes wave speed on a string', () => {
    expect(stringWaveSpeed(40, 0.025)).toBeCloseTo(40, 6);
  });

  it('spaces harmonics as integer multiples', () => {
    const f1 = harmonicFrequency(1, 120, 2);
    const f3 = harmonicFrequency(3, 120, 2);
    expect(f1).toBeCloseTo(30, 6);
    expect(f3).toBeCloseTo(90, 6);
  });

  it('computes beats', () => {
    expect(beatFrequency(440, 443)).toBeCloseTo(3, 6);
  });

  it('gives 343 m/s for sound at 20 °C', () => {
    expect(soundSpeedAt(20)).toBeCloseTo(343, 0);
  });

  it('adds 10 dB for a tenfold intensity increase', () => {
    const a = decibels(1e-6);
    const b = decibels(1e-5);
    expect(b - a).toBeCloseTo(10, 6);
  });

  it('raises pitch when the source approaches', () => {
    const approaching = doppler(800, 0, 30, 340);
    const receding = doppler(800, 0, -30, 340);
    expect(approaching).toBeCloseTo(877.4, 0);
    expect(receding).toBeCloseTo(735.1, 0);
    expect(approaching).toBeGreaterThan(800);
    expect(receding).toBeLessThan(800);
  });

  it('gives only odd harmonics for a closed pipe', () => {
    const h = closedPipeHarmonics(0.5, 3, 340);
    expect(h[0]).toBeCloseTo(170, 6);
    expect(h[1]).toBeCloseTo(510, 6);
    expect(h[2]).toBeCloseTo(850, 6);
  });
});

describe('optics', () => {
  it('bends light toward the normal entering a denser medium', () => {
    const theta = snell(1, 45, 1.33);
    expect(theta).not.toBeNull();
    expect(theta!).toBeCloseTo(32.12, 1);
    expect(theta!).toBeLessThan(45);
  });

  it('returns null on total internal reflection and finds the critical angle', () => {
    expect(snell(1.5, 60, 1.0)).toBeNull();
    expect(criticalAngle(1.33, 1)).toBeCloseTo(48.75, 1);
    expect(criticalAngle(1, 1.33)).toBeNull();
  });

  it('forms a real inverted image beyond 2f', () => {
    const r = imageFormation(10, 15, 3);
    expect(r.imageDistance).toBeCloseTo(30, 6);
    expect(r.magnification).toBeCloseTo(-2, 6);
    expect(r.real).toBe(true);
    expect(r.inverted).toBe(true);
  });

  it('forms a virtual upright image inside the focal length', () => {
    const r = imageFormation(12, 8, 4);
    expect(r.imageDistance).toBeCloseTo(-24, 6);
    expect(r.magnification).toBeCloseTo(3, 6);
    expect(r.real).toBe(false);
  });

  it('computes double-slit fringe spacing', () => {
    // λL/d = (500e-9)(2)/(0.2e-3) = 5 mm
    expect(fringeSpacing(500e-9, 0.2e-3, 2) * 1000).toBeCloseTo(5, 6);
  });
});

describe('electricity', () => {
  it('applies Coulomb\'s law', () => {
    // k(3µ)(5µ)/0.2² = 3.375 N
    expect(coulombForce(3e-6, 5e-6, 0.2)).toBeCloseTo(3.373, 2);
  });

  it('gives a parallel resistance below the smallest resistor', () => {
    const r = parallelResistance([4, 6, 12]);
    expect(r).toBeCloseTo(2, 6);
    expect(r).toBeLessThan(4);
  });

  it('solves a series circuit with internal resistance', () => {
    const r = solveCircuit(12, 0.5, [5.5], 'series');
    expect(r.current).toBeCloseTo(2, 6);
    expect(r.terminalVoltage).toBeCloseTo(11, 6);
    expect(r.lostVolts).toBeCloseTo(1, 6);
  });

  it('gives equal branch voltages in parallel', () => {
    const r = solveCircuit(12, 0, [6, 3], 'parallel');
    expect(r.totalResistance).toBeCloseTo(2, 6);
    expect(r.current).toBeCloseTo(6, 6);
    expect(r.branches[0].voltage).toBeCloseTo(r.branches[1].voltage, 6);
  });

  it('computes capacitor energy', () => {
    expect(capacitorEnergy(50e-6, 200)).toBeCloseTo(1, 6);
  });
});

describe('magnetism', () => {
  it('gives zero force when velocity is parallel to the field', () => {
    expect(lorentzForce(1.6e-19, 2e6, 0.5, 0)).toBeCloseTo(0, 12);
    expect(lorentzForce(1.6e-19, 2e6, 0.5, 90)).toBeCloseTo(1.6e-13, 15);
  });

  it('halves the cyclotron radius when the field doubles', () => {
    const r1 = cyclotronRadius(9.11e-31, 2e6, 1.6e-19, 0.5);
    const r2 = cyclotronRadius(9.11e-31, 2e6, 1.6e-19, 1.0);
    expect(r1 / r2).toBeCloseTo(2, 6);
  });

  it('conserves power through an ideal transformer', () => {
    const t = transformer(220, 500, 10000, 11000);
    expect(t.secondaryVoltage).toBeCloseTo(4400, 6);
    expect(t.stepUp).toBe(true);
  });

  it('computes the field around a straight wire', () => {
    // μ0 I / 2πr with I = 10, r = 0.05 → 4e-5 T
    expect(wireField(10, 0.05)).toBeCloseTo(4e-5, 8);
  });
});

describe('thermal physics', () => {
  it('applies PV = nRT', () => {
    // 2 mol at 300 K in 0.05 m³ → about one atmosphere.
    // The engine uses the exact CODATA R = 8.31446…, so the value sits a few
    // pascals above the 8.314-rounded figure quoted in textbooks.
    const p = gasPressure(2, 300, 0.05);
    expect(p).toBeCloseTo(99773.6, 0);
    expect(p / 101325).toBeCloseTo(0.985, 2);
  });

  it('finds the equilibrium temperature of a mixture', () => {
    const t = mixtureTemperature(1, 4186, 80, 1, 4186, 20);
    expect(t).toBeCloseTo(50, 6);
  });

  it('gives a faster rms speed for a lighter gas', () => {
    const helium = rmsSpeed(300, 0.004);
    const oxygen = rmsSpeed(300, 0.032);
    expect(helium).toBeGreaterThan(oxygen);
    expect(oxygen).toBeCloseTo(483.6, 0);
  });

  it('computes Carnot efficiency below 1', () => {
    const e = carnotEfficiency(600, 300);
    expect(e).toBeCloseTo(0.5, 6);
    expect(e).toBeLessThan(1);
  });
});

describe('fluids', () => {
  it('floats an object whose density is lower than the fluid', () => {
    const r = floatation(600, 1000, 0.01, 10);
    expect(r.floats).toBe(true);
    expect(r.submergedFraction).toBeCloseTo(0.6, 6);
    // when floating, buoyancy equals weight
    expect(r.buoyant).toBeCloseTo(r.weight, 6);
  });

  it('sinks an object denser than the fluid', () => {
    const r = floatation(2700, 1000, 0.01, 10);
    expect(r.floats).toBe(false);
    expect(r.submergedFraction).toBe(1);
  });

  it('computes gauge pressure with depth', () => {
    expect(gaugePressure(15, 1000, 10)).toBeCloseTo(150000, 6);
  });

  it('multiplies force in a hydraulic press', () => {
    expect(hydraulicForce(100, 5, 250)).toBeCloseTo(5000, 6);
  });

  it("matches Torricelli's theorem", () => {
    expect(effluxSpeed(1.8, 10)).toBeCloseTo(6, 6);
  });
});

describe('modern physics', () => {
  it('emits no electrons below the threshold', () => {
    const below = photoelectric(650, 2.3);
    expect(below.emitted).toBe(false);
    expect(below.kineticEv).toBe(0);

    const above = photoelectric(300, 2.5);
    expect(above.emitted).toBe(true);
    expect(above.kineticEv).toBeCloseTo(1.63, 2);
  });

  it('gives the Bohr energy levels of hydrogen', () => {
    expect(bohrEnergy(1)).toBeCloseTo(-13.6, 1);
    expect(bohrEnergy(2)).toBeCloseTo(-3.4, 1);
    expect(bohrEnergy(3)).toBeCloseTo(-1.51, 2);
  });

  it('produces the H-alpha line at 656 nm', () => {
    expect(transitionWavelengthNm(3, 2)).toBeCloseTo(656, 0);
    expect(transitionWavelengthNm(4, 2)).toBeCloseTo(486, 0);
    expect(transitionWavelengthNm(2, 1)).toBeCloseTo(121.5, 0);
  });

  it('halves the sample every half-life', () => {
    expect(remainingNuclei(800, 0, 8)).toBeCloseTo(800, 6);
    expect(remainingNuclei(800, 8, 8)).toBeCloseTo(400, 6);
    expect(remainingNuclei(800, 24, 8)).toBeCloseTo(100, 6);
  });

  it('computes the binding energy of helium-4 as ~28 MeV', () => {
    const e = bindingEnergy(2, 2, 4.002602);
    expect(e).toBeGreaterThan(27);
    expect(e).toBeLessThan(30);
  });
});

describe('units', () => {
  it('counts significant figures', () => {
    expect(countSigFigs('0.00420')).toBe(3);
    expect(countSigFigs('90.05')).toBe(4);
    expect(countSigFigs('2.500')).toBe(4);
  });

  it('converts km/h to m/s', () => {
    expect(kmhToMs(90)).toBeCloseTo(25, 6);
  });

  it('picks a sensible SI prefix', () => {
    expect(withSIPrefix(4700, 'Ω')).toBe('4.70 kΩ');
    expect(withSIPrefix(0.000025, 'F')).toBe('25.00 µF');
  });
});
