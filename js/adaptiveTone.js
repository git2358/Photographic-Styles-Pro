export function buildAdaptiveCurve(strength) {
    return function(x) {
        let s = strength * 0.5;
        return x + s * (x - x*x);
    };
}
