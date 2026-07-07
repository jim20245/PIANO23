const { exec } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, 'motor.py');

function on(motorName) {
    exec(`python3 ${PYTHON_SCRIPT} ${motorName} on`);
    console.log(`${motorName} ON`);
    return { status: 'on', motor: motorName };
}

function off(motorName) {
    exec(`python3 ${PYTHON_SCRIPT} ${motorName} off`);
    console.log(`${motorName} OFF`);
    return { status: 'off', motor: motorName };
}

function pulse(motorName, duration = 500) {
    exec(`python3 ${PYTHON_SCRIPT} ${motorName} pulse`);
    console.log(`${motorName} 脉冲 ${duration}ms`);
    return { status: 'pulse', motor: motorName, duration };
}

function angle(motorName, value) {
    exec(`python3 ${PYTHON_SCRIPT} ${motorName} angle ${value}`);
    console.log(`${motorName} 转到 ${value} 度`);
    return { status: 'angle', motor: motorName, value: value };
}

const motors = {
    m1: 18,
    m2: 19,
    m3: 20,
    m4: 21
};

module.exports = { on, off, pulse, angle, motors };


