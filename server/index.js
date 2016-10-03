const express = require('express')
const Lyricist = require('lyricist')
const multer = require('multer')
const fs = require('fs')

const upload = multer({dest: '/tmp/uploads'})

const ACRCloud = require('./acr')

const app = express()

const acr = new ACRCloud({
  requrl: 'us-west-2.api.acrcloud.com',
  data_type: 'audio',
  access_key: process.env.REACT_APP_ACR_KEY,
  access_secret: process.env.REACT_APP_ACR_SECRET,
})

const lyricist = new Lyricist(process.env.REACT_APP_GENIUS_KEY)

app.post('/api/identify', upload.single('data'), (req, res) => {
  const {file} = req

  const buffer = fs.readFileSync(file.path)

  acr.identify(buffer)
    .then((music) => {
      if (music == null) {
        res.send('Could not find a match!')
        return
      }

      console.log(music)

      lyricist.song({
        search: `${music.artist} - ${music.title}`,
      }, (err2, result) => {
        res.json({err2, result})
      })
    })
    .catch((err) => console.error(err))
})

app.listen(process.env.PORT || 5000)
