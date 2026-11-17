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
const dspName = "bubble";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
bubble.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
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

// Spirit level: lay the phone flat. Level -> slow bubbles, tilted -> faster bubbles.
const LEVEL_TOLERANCE = 3;   // degrees of tilt still counted as level
const MAX_TILT = 30;         // degrees of tilt for the fastest bubbles
const SLOW_MS = 1500;        // time between bubbles when level
const FAST_MS = 100;         // time between bubbles at MAX_TILT or more
let tilt = 0;                // current tilt away from level, in degrees

function accelerationChange(accx, accy, accz) {
}

function rotationChange(rotx, roty, rotz) {
    tilt = Math.sqrt(rotx * rotx + roty * roty);
}

function bubbleInterval() {
    if (tilt <= LEVEL_TOLERANCE) return SLOW_MS;
    const amount = Math.min((tilt - LEVEL_TOLERANCE) / (MAX_TILT - LEVEL_TOLERANCE), 1);
    return SLOW_MS + (FAST_MS - SLOW_MS) * amount;
}

// Keep dropping bubbles; the wait until the next one depends on the tilt.
function bubbleLoop() {
    playAudio();
    setTimeout(bubbleLoop, bubbleInterval());
}
bubbleLoop();

function mousePressed() {
    playAudio()
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
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
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
    if (audioContext.state === 'suspended') {
        return;
    }
    // Vary the pitch a little so the bubbles sound natural
    dspNode.setParamValue("/bubble/bubble/freq", 500 + Math.random() * 400)
    dspNode.setParamValue("/bubble/drop", 1)
    setTimeout(() => { dspNode.setParamValue("/bubble/drop", 0) }, 20);
}

//==========================================================================================
// END
//==========================================================================================