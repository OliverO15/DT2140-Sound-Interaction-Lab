//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
const panner = audioContext.createStereoPanner();
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "engine";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
  window[dspName] = instance;
} else {
  const exp = {};
  exp[dspName] = instance;
  module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with bells if you use bells.wasm
engine.createDSP(audioContext, 1024).then((node) => {
  dspNode = node;
  // Route the sound through a stereo panner so we can move it left/right
  dspNode.connect(panner);
  panner.connect(audioContext.destination);
  console.log("params: ", dspNode.getParams());
  const jsonString = dspNode.getJSON();
  jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
  dspNodeParams = jsonParams;
  // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
  // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
  // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
  // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
});

//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function accelerationChange(accx, accy, accz) {
  //   playAudio();
}

// Boat throttle: tilt around X like a throttle lever.
//   X = 90 or more  -> engine stopped
//   X = 0           -> 80% throttle
//   X = -45 or less -> 100% throttle (full speed)
// Values in between are scaled linearly.
const X_STOP = 90;
const X_FULL = -45;
const CRUISE = 0.8;     // throttle at X = 0
const MAX_SPEED = 0.6;  // engine "maxSpeed" at 100% throttle (0-1)
const MAX_VOLUME = 0.8; // engine volume at 100% throttle (0-1)
const SMOOTHING = 0.1;  // 0-1, lower = smoother/slower response
let throttle = 0;       // smoothed throttle, 0-1

// Steering: tilt around Y pans the engine left/right.
//   Y = -45 or less -> fully left, Y = 0 -> centre, Y = 45 or more -> fully right
const Y_FULL = 45;
let pan = 0;            // smoothed pan, -1 (left) to 1 (right)
let engineOn = false;

function throttleFromX(x) {
  if (x >= X_STOP) return 0;
  if (x >= 0) return CRUISE * (X_STOP - x) / X_STOP;
  return CRUISE + (1 - CRUISE) * Math.min(x / X_FULL, 1);
}

function rotationChange(rotx, roty, rotz) {
  if (!dspNode || audioContext.state === "suspended") {
    return;
  }
  throttle += (throttleFromX(rotx) - throttle) * SMOOTHING;
  setThrottle(throttle);

  const targetPan = Math.max(-1, Math.min(1, roty / Y_FULL));
  pan += (targetPan - pan) * SMOOTHING;
  panner.pan.value = pan;
}

function mousePressed() {
  // Use this for debugging from the desktop!
}

function deviceMoved() {
  movetimer = millis();
  statusLabels[2].style("color", "pink");
}

function deviceTurned() {
  threshVals[1] = turnAxis;
}
function deviceShaken() {
  shaketimer = millis();
  statusLabels[0].style("color", "pink");
}

function getMinMaxParam(address) {
  const exampleMinMaxParam = findByAddress(dspNodeParams, address);
  // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
  const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
  console.log("Min value:", exampleMinValue, "Max value:", exampleMaxValue);
  return [exampleMinValue, exampleMaxValue];
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio() {
  // Not used for the boat: the sound is controlled continuously in rotationChange().
}

function setThrottle(t) {
  const shouldRun = t > 0.02;
  if (shouldRun !== engineOn) {
    engineOn = shouldRun;
    dspNode.setParamValue("/engine/runtime", 1); // seconds to spin up / down
    dspNode.setParamValue("/engine/gate", engineOn ? 1 : 0);
  }
  if (engineOn) {
    dspNode.setParamValue("/engine/maxSpeed", t * MAX_SPEED);
    dspNode.setParamValue("/engine/volume", t * MAX_VOLUME);
  }
}

//==========================================================================================
// END
//==========================================================================================
