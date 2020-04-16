const DeepSpeech = require('deepspeech');
const fs = require('fs');
const Sox = require('sox-stream');
const MemoryStream = require('memory-stream');
const Duplex = require('stream').Duplex;
const Wav = require('node-wav');
const Lame = require("node-lame").Lame;

let modelPath = './deepspeech-0.6.1-models/output_graph.pbmm';
let lmPath = './deepspeech-0.6.1-models/lm.binary';
let triePath = './deepspeech-0.6.1-models/trie';

const BEAM_WIDTH = 1024;
let model = new DeepSpeech.Model(modelPath, BEAM_WIDTH);

let desiredSampleRate = model.sampleRate();

const LM_ALPHA = 0.75;
const LM_BETA = 1.85;

model.enableDecoderWithLM(lmPath, triePath, LM_ALPHA, LM_BETA);

let audioFile = process.argv[2] || './audio/greetings.wav';

if (!fs.existsSync(audioFile)) {
  console.log('file missing:', audioFile);
  process.exit();
}

if (audioFile.substring(audioFile.length - 3) === 'mp3') {
  console.log('mp3 given, decoding...')
  const decoder = new Lame({ output: "buffer" }).setFile(audioFile);
  decoder
    .decode()
    .then(() => {
      // Decoding finished
      const buffer = decoder.getBuffer();
      process_buffer(buffer);
    })
    .catch(error => {
      // Something went wrong
      console.log('Error:', error)
    });
} else {
  console.log('wav given, processing...')
  const buffer = fs.readFileSync(audioFile);
  process_buffer(buffer);
}

function process_buffer(buffer) {

  // Wav decode
  const result = Wav.decode(buffer);

  if (result.sampleRate < desiredSampleRate) {
    console.error('Warning: original sample rate (' + result.sampleRate + ') is lower than ' + desiredSampleRate + 'Hz. Up-sampling might produce erratic speech recognition.');
  }

  function bufferToStream(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  let audioStream = new MemoryStream();
  bufferToStream(buffer).
    pipe(Sox({
      global: {
        'no-dither': true,
      },
      output: {
        bits: 16,
        rate: desiredSampleRate,
        channels: 1,
        encoding: 'signed-integer',
        endian: 'little',
        compression: 0.0,
        type: 'raw'
      }
    })).
    pipe(audioStream);

  audioStream.on('finish', () => {
    let audioBuffer = audioStream.toBuffer();

    const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate);
    console.log('audio length', audioLength);

    let result = model.stt(audioBuffer.slice(0, audioBuffer.length / 2));
    fs.writeFile('result.txt', result, 'utf8', function() {
      console.log('Result written to: result.txt')
    });
    // console.log('result:', result);
  });
}
