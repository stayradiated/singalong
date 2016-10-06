import React, {Component} from 'react'

import './App.css'

const {Recorder} = window

const RECORD_TIME = 10 * 1000

class App extends Component {
  constructor () {
    super()

    this.state = {
      recording: false,
      recorder: null,
      src: null,
      result: null,
      countdown: RECORD_TIME / 1000,
    }

    this.recorder = null

    this.handleStreamReady = this.handleStreamReady.bind(this)
    this.handleStopRecording = this.handleStopRecording.bind(this)
    this.startRecording = this.startRecording.bind(this)
  }

  componentDidMount () {
    this.startRecording()
  }

  handleStreamReady () {
    this.recorder.start()
    setTimeout(() => {
      this.recorder.stop()
    }, RECORD_TIME)

    this.setState({countdown: RECORD_TIME / 1000})

    const timer = setInterval(() => {
      let {countdown} = this.state
      countdown -= 1
      this.setState({countdown})

      if (countdown == 0) {
        clearInterval(timer)
      }
    }, 1000)
  }

  handleStopRecording (event) {
    this.setState({recording: false})

    const dataBlob = new Blob([event.detail], {type: 'audio/ogg'})

    const formData = new FormData()
    formData.append('data', dataBlob)

    fetch('/api/identify', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((json) => this.setState({result: json}))
      .catch(() => null)
      .then(() => this.startRecording())

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

    this.setState({recording: true})
  }

  render () {
    const {recording, countdown, src, result} = this.state

    return (
      <div>
        <p>{countdown}</p>

        {result != null && (
          <div>
            <h5>{result.primary_artist.name} - {result.title}</h5>
            <div style={{whiteSpace: 'pre'}}>
              {result.lyrics}
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default App
