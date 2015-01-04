'use strict';

// Motion constraint definition

// These are the ops; they return the delta when not met.
var mc = {
    greater: function(a, b) {
            if (a >= b) return 0;
            return b - a;
        },
    less: function(a, b) {
        if (a <= b) return 0;
        return b - a;
    },
    l: function(a, b) {
        if (a < b) return 0;
        return b - a;
    },
    g: function(a, b) {
        if (a > b) return 0;
        return b - a;
    },
    equal: function(a, b) { return b - a; },
    // This is an animation-only constraint. Need a better way to declare what these
    // are and why (maybe the animation detection needs to move to the MotionConstraint
    // rather than being in the op?).
    modulo: function(a, b, isFromAnimation, velocity) {
        if (!isFromAnimation) return 0;
        // This is bogus; we're just inventing some friction constant and assuming that
        // this is what the manipulator is using. We probably need the manipulator to
        // tell us the end point or local minima/maxima so that we can decide which
        // direction we're going to trigger in from that...
        // This is correct for pagers and things where the manipulator is actually using
        // this friction value, though.
        //
        var friction = new Friction(0.001);
        friction.set(a, velocity);
        var duration = 1;//friction.duration();
        var end = velocity ? friction.x(duration) : a;
        // Where is the end point closest to?
        var nearest = b * Math.round(end/b);
        return nearest - a;
    }
};

function MotionConstraint(variable, op, value, overdragCoefficient, physicsModel) {
    this.variable = variable;
    this.value = value;
    if (typeof op === 'string') {
        switch (op) {
        case '==': this.op = mc.equal; break;
        case '>=': this.op = mc.greater; break;
        case '<=': this.op = mc.less; break;
        case '<': this.op = mc.l; break;
        case '>': this.op = mc.g; break;
        case '%': this.op = mc.modulo; break;
        }
    } else {
        this.op = op;
    }
    this.overdragCoefficient = overdragCoefficient || 0.75;
    this.physicsModel = physicsModel;
}
MotionConstraint.prototype.delta = function() {
    return this.op(this.variable, this.value, false);
}
MotionConstraint.prototype.deltaFromAnimation = function(velocity) {
    return this.op(this.variable, this.value, true, velocity);
}
MotionConstraint.prototype.createMotion = function(startPosition) {
    var motion = this.physicsModel ? this.physicsModel() : new Spring(1, 200, 20);
    motion.snap(startPosition);
    return motion;
}
