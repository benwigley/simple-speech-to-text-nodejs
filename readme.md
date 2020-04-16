# Simple Node.js based "audio to text" command line tool for both wav and mp3 files

## Installation

You'll need some model data

```bash
wget https://github.com/mozilla/DeepSpeech/releases/download/v0.6.1/deepspeech-0.6.1-models.tar.gz
tar xvfz deepspeech-0.6.1-models.tar.gz
```

Optionally use audio samples if you don't have your own audio yet

```bash
wget https://github.com/mozilla/DeepSpeech/releases/download/v0.4.1/audio-0.4.1.tar.gz
tar xfvz audio-0.4.1.tar.gz
# Then move the audio files to the ./audio folder
```

Install dependencies

```bash
# For osx (not sure about other platforms)
brew install sox

npm install
```


## Usage

```bash
# First place an mp3 or wav file into the audio directory
node index.js audio/<my-file>.mp3
```
