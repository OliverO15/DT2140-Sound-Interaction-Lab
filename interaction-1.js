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
  dspNode.connect(audioContext.destination);
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

// Start the engine when rotation Y goes quickly from 44 or below to 70 or above
const ROT_START = 44; // degrees
const ROT_END = 70; // degrees
const MAX_TIME_MS = 400; // how fast the turn must be
const ENGINE_ON_MS = 3000; // how long the engine runs
let lastLowTime = -Infinity;
let enginePlaying = false;

function rotationChange(rotx, roty, rotz) {
  const now = millis();
  if (roty <= ROT_START) {
    lastLowTime = now;
  } else if (
    roty >= ROT_END &&
    now - lastLowTime <= MAX_TIME_MS &&
    !enginePlaying
  ) {
    lastLowTime = -Infinity;
    playAudio();
  }
}

function mousePressed() {
  playAudio();
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
  if (!dspNode) {
    return;
  }
  if (audioContext.state === "suspended") {
    return;
  }
  // Edit here the addresses ("/thunder/rumble") depending on your WASM controls (you can see
  // them printed on the console of your browser when you load the page)
  // For example if you change to a bell sound, here you could use "/churchBell/gate" instead of
  // "/thunder/rumble".
  if (enginePlaying) {
    return;
  }
  enginePlaying = true;
  dspNode.setParamValue("/engine/runtime", 1.5); // seconds to spin up / down
  dspNode.setParamValue("/engine/gate", 1);
  setTimeout(() => {
    dspNode.setParamValue("/engine/gate", 0);
    enginePlaying = false;
  }, ENGINE_ON_MS);
}

//==========================================================================================
// END
//==========================================================================================
