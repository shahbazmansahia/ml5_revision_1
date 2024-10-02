// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Webcam Image Classification using MobileNet and p5.js
This example uses a callback pattern to create the classifier
=== */
let classifier;
let video;
const myVoice = new p5.Speech();
let data = {};
let detectHits = 0;
let stream_status = false;
let is_quick = false;
let is_sequential = false;
let logged_cards = new Set();
let cards_list = [];
let cards = [
  'eye', 'life', 'triangle', 'sun', 'mercury', 'venus', 'moon',
  'mars', 'jupiter', 'saturn', 'time', 'symmetry', 'infinity'
];

function setup() {
  createCanvas(600, 400);
  video = createCapture(VIDEO);
  video.position(50, 250);

  let buttonConfigs = [
    //{ label: 'Button 1', handler: run_cam_1, posY: 425 },
    { label: 'Log first 1000 detects and download log', handler: run_cam_3, posY: 450 },
    { label: '~ Tap into the spirit ~', handler: run_cam, posY: 475 },
    { label: '~ Sever Divine Connection ~', handler: stop_cam, posY: 500 },
    //{ label: 'Oh divine mother, tell me what you see!', handler: saveDataToFile, posY: 525 }
  ];

  buttonConfigs.forEach((btn, index) => {
    let button = createButton(btn.label);
    button.position(725, btn.posY);
    button.mousePressed(btn.handler);
  });

  describeButtons();
}

function describeButtons() {
  let descriptions = [
    'A gray button that runs turns on the camera feed for analyzing the first symbol it sees.',
    'A gray button that runs turns on the camera feed for analyzing the entire deck.',
    "A gray button that runs turns on the camera feed for analyzing the symbols seen by camera's video feed.",
    'A gray button that stops the camera feed and resets the data',
    'A gray button that downloads a file containing what the camera has seen so far...'
  ];

  descriptions.forEach(desc => describe(desc));
}

function run_cam_1() {
  console.log('STARTED: quick reading');
  is_quick = true;
  run_cam();
}

function run_cam_3() {
  console.log('STARTED: sequential reading');
  is_sequential = true;
  run_cam();
}

function run_cam() {
  stream_status = true;
  data = {};
  console.log('running camera!!!!');
  classifier = ml5.imageClassifier('MobileNet', video, modelReady);
}

function modelReady() {
  select('#status').html('Model Loaded');
  classifyVideo();
}

function startLoop() {
  const loopInterval = setInterval(() => {
    if (!stream_status) {
      clearInterval(loopInterval);
    } else {
      classifier.classify(gotResult);
    }
  }, 100); // Run every 100 ms (adjust the interval as needed)
}

function classifyVideo() {
  startLoop();
}

function wait(time) {
  const start = millis();
  let current;
  do {
    current = millis();
  } while (current < start + time);
}

function saveDataToFile() {
  console.log('DOWNLOADING DATA...');
  const dictAsStr = JSON.stringify(data);
  const blob = new Blob([dictAsStr], { type: 'text/plain' });

  const a = document.createElement('a');
  a.download = 'sessionStorageData.txt';
  a.href = window.URL.createObjectURL(blob);
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function get_detect_hits() {
  const currentValue = Object.values(data).reduce((a, b) => a+b, 0);
  detectHits = currentValue;
  return detectHits;
}

function card_logger(card_val) {
  logged_cards.add(card_val);
  console.log('Detected card: ', card_val);
}

function overlap_indicator(cards_list) {
  // function to check if any lists have overlapping
}

function getKeyByVal(obj, value) {
  return Object.keys(obj).find((key) => obj[key] === value);
}

function hijacker(results) {
  
  return results[0].label;
}

function list_printer(results) {
  for (i = 0; i < results.length; i) {
    console.log(results[i].label + ' - ' + results[i].confidence + '\n');
  }
}

function gotResult(err, results = []) {
  if (err) {
    console.error(err);
    return;
  }

  console.log('results type:', typeof results);
  
  console.log('Number of hits: ', get_detect_hits());
  
  let hijack = '';
  if (results.length > 0) {
    hijack = hijacker(results);
    select('#result').html(hijack);
    select('#probability').html(nf(results[0].confidence, 0, 2));

    if (is_quick && logged_cards.size < 101) {
      select('#logged_cards').html(Array.from(logged_cards).slice(0, 101));
      return;
    } else if (is_sequential && logged_cards.size === 1001) {
      select('#logged_cards').html(Array.from(logged_cards).slice(0, 1001));
      return;
    } else {
      select('#logged_cards').html(Array.from(logged_cards));
    }
  }

  if (results.length > 0) {
    if (data.hasOwnProperty(hijack)) {
      data[hijack]++;
    } else {
      data[hijack] = 1;
    }
  }

  if (stream_status && cards.includes(hijack)) {
    myVoice.speak(`I see ${hijack}`);
  }

  //if (cards.includes(hijack)) {
  //  logged_cards.add(hijack);
  //}
  if (logged_cards.size < 1001) {
    logged_cards.add(hijack);
  }

  logged_cards.forEach(value => {
    console.log('Logged cards:', value);
  });

  if (is_quick && get_detect_hits() === 100) {
    select('#logged_cards').html(Array.from(logged_cards).slice(0, 101));
    stop_cam();
    return;
  }
  if (is_sequential && get_detect_hits() === 1000) {
    select('#logged_cards').html(Array.from(logged_cards).slice(0, 1001));
    saveDataToFile();
    stop_cam();
    return;
  }

  classifyVideo();
}

function stop_cam() {
  console.log('CAMERA STOPPED!');
  stream_status = false;
  is_quick = false;
  is_sequential = false;
  logged_cards.clear();
  cards_list = [];
  detectHits = 0;
  myVoice.speak('');
}

function classifyVideo() {
  if (stream_status) {
    classifier.classify(gotResult);
  }
}
