import React, {Component} from 'react'
import {Buffer} from 'buffer'

import './App.css'

import ACRCloud from './ACR'

const {Recorder} = window

const RECORD_TIME = 10 * 1000

class App extends Component {
  constructor () {
    super()

    this.state = {
      recorder: null,
      src: null,
      result: null,
    }

    this.acr = new ACRCloud({
      requrl: 'localhost:3000',
      data_type: 'audio',
      access_key: process.env.REACT_APP_ACR_KEY,
      access_secret: process.env.REACT_APP_ACR_SECRET,
    })

    this.recorder = null

    this.handleStreamReady = this.handleStreamReady.bind(this)
    this.handleStopRecording = this.handleStopRecording.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.identifyRecording = this.identifyRecording.bind(this)
  }

  handleStreamReady () {
    this.recorder.start()
    setTimeout(() => {
      this.recorder.stop()
    }, RECORD_TIME)
  }

  handleStopRecording (event) {
    const dataBlob = new Blob([event.detail], {type: 'audio/ogg'})
    const fileReader = new FileReader()
    fileReader.addEventListener('load', () => {
      this.identifyRecording(fileReader.result)
      this.setState({
        src: fileReader.result,
      })
    })
    fileReader.readAsDataURL(dataBlob)
  }

  startRecording () {
    this.recorder = new Recorder({
      encoderPath: process.env.PUBLIC_URL + '/encoderWorker.min.js',
    })

    this.recorder.addEventListener('streamReady', this.handleStreamReady)
    this.recorder.addEventListener('dataAvailable', this.handleStopRecording)

    this.recorder.initStream()
  }

  identifyRecording (src) {
    const buffer = new Buffer(
      src.replace(/^data:audio\/ogg;base64,/, ''), 'base64')

    this.acr.identify(buffer)
      .then((res) => {
        const json = JSON.parse(res.body)
        this.setState({result: json})
      })
      .catch((err) => console.error(err))
  }

  render () {
    const {src, result} = this.state

    let music
    if (result != null) {
      music = result.metadata.music[0]
    }

    return (
      <div className='App'>
        <div className='App-header'>
          <h2>Sing Along</h2>
        </div>

        <div>
          <button onClick={this.startRecording}>SHAZAM!</button>
        </div>

        <div>
          {src != null && <audio controls src={src} />}
        </div>

        {music != null && (
          <div>
            <div>Title: {music.title}</div>
            <div>Play Offset: {music.play_offset_ms  / 1000}s</div>
            <div>Artists: {music.artists.map((artist) => (
              <span>{artist.name},</span>
            ))}</div>
            <div>Album: {music.album.name}</div>
            Genres: {music.genres.map((genre) => (
              <span>{genre.name},</span>
            ))}
          </div>
        )}
      </div>
    )
  }
}

export default App
