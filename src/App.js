import React, {Component} from 'react'

import './App.css'

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

    this.recorder = null

    this.handleStreamReady = this.handleStreamReady.bind(this)
    this.handleStopRecording = this.handleStopRecording.bind(this)
    this.startRecording = this.startRecording.bind(this)
  }

  handleStreamReady () {
    this.recorder.start()
    setTimeout(() => {
      this.recorder.stop()
    }, RECORD_TIME)
  }

  handleStopRecording (event) {
    const dataBlob = new Blob([event.detail], {type: 'audio/ogg'})

    const formData = new FormData()
    formData.append('data', dataBlob)

    fetch('/api/identify', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((json) => this.setState({lyrics: json.result}))

    const fileReader = new FileReader()
    fileReader.addEventListener('load', () => {
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

  render () {
    const {src, lyrics} = this.state

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

        {lyrics != null && (
          <div style={{whiteSpace: 'pre'}}>
            {lyrics.lyrics.replace(/googletag\.cmd\.push\(function\(\) \{ googletag.display\("[^"]+"\); \}\);/, '')}
          </div>
        )}
      </div>
    )
  }
}

export default App
