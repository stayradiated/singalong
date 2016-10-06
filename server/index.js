const express = require('express')
const Genius = require('node-genius')
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

const genius = new Genius(process.env.REACT_APP_GENIUS_KEY)
const lyricist = new Lyricist(process.env.REACT_APP_GENIUS_KEY)

function clean (query) {
  return query.trim().replace(/\([^\)]+\)/, '')
}

function searchGenius (query) {
  return new Promise((resolve, reject) => {
    return genius.search(query, (err, response) => {
      if (err) {
        reject(err)
      } else {
        const {hits} = JSON.parse(response).response
        if (hits.length === 0) {
          reject(new Error('Could not find any matches'))
        } else {
          resolve(hits[0].result)
        }
      }
    })
  })
}

function fetchSong (songId) {
  return new Promise((resolve, reject) => {
    return lyricist.song(songId, (err, response) => {
      if (err) {
        reject(err)
      } else {
        resolve(response)
      }
    })
  })
}

app.post('/api/identify', upload.single('data'), (req, res) => {
  const {file} = req

  const buffer = fs.readFileSync(file.path)

  acr.identify(buffer)
    .then((music) => {
      if (music == null) {
        res.send('Could not find a match!')
        return
      }

      searchGenius(`${music.artist} - ${music.title}`)
        .catch(() => `${clean(music.artist)} - ${clean(music.title)}`)
        .catch(() => searchGenius(music.title))
        .then((song) => fetchSong(song.id))
        .then((song) => {
          song.lyrics = song.lyrics
            .trim()
            .replace(/googletag\.cmd\.push\(function\(\) \{ googletag.display\("[^"]+"\); \}\);/, '')
          res.send(song)
        })
        .catch((err) => console.error(err))
    })
    .catch((err) => console.error(err))
})

app.listen(process.env.PORT || 5000)
