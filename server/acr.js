const crypto  = require('crypto')
const request = require('request')

class ACRCloud {
  constructor (conf) {
    this.requrl 						= conf.requrl || 'ap-southeast-1.api.acrcloud.com'
    this.http_method 				= conf.http_method || 'POST'
    this.http_uri 					= conf.http_uri || '/v1/identify'
    this.data_type					= conf.data_type || 'audio'
    this.signature_version 	= conf.signature_version || '2'
    this.timestamp					= Date.now()

    this.access_key 				= conf.access_key || ''
    this.access_secret			= conf.access_secret || ''
  }

  // Sign information to send
  createSignature () {
    console.log('creating signature')

    const stringToSign = [
      this.http_method,
      this.http_uri,
      this.access_key,
      this.data_type,
      this.signature_version,
      this.timestamp,
    ].join('\n')

    return crypto.createHmac('sha1', this.access_secret)
    .update(stringToSign)
    .digest('base64')
  }

  // Create POST data to send
  createPostData (buffer, signature) {
    console.log('creating post data')

    return {
      sample: buffer.toString('base64'),
      sample_bytes: buffer.length,
      access_key: this.access_key,
      data_type: this.data_type,
      signature,
      signature_version: this.signature_version,
      timestamp: this.timestamp,
    }
  }

  // Perform POST
  post (postData) {
    console.log('posting')

    return new Promise((resolve, reject) => {
      request.post(`http://${this.requrl}${this.http_uri}`, {
        form: postData,
      }, (err, res) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(this.parseResult(JSON.parse(res.body)))
        }
      })
    })
  }

  // Parse result from server
  parseResult (data) {
    if (
      data == null ||
      data.metadata == null ||
      data.metadata.music.length <= 0
    ) {
      return null
    }

    const music = data.metadata.music[0]

    return {
      id: music.acrid,
      playOffsetMs: parseInt(music.play_offset_ms, 10),
      durationMs: parseInt(music.duration_ms, 10),
      releaseDate: music.release_date,
      title: music.title,
      album: music.album.name,
      label: music.label,
      artist: music.artists.map((artist) => artist.name).join(', '),
      genres: music.genres && music.genres.map((genre) => genre.name).join(', '),
    }
  }

  // Identify base64 encoded audio file
  identify (buffer) {
    console.log('identifying')

    this.timestamp = Date.now()

    const signature = this.createSignature()
    const postData = this.createPostData(buffer, signature)
    return this.post(postData)
  }
}

module.exports = ACRCloud
