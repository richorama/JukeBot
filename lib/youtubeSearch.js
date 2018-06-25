var search = require('youtube-search');
var settings = require('../client_secret.json');

var opts = {
  maxResults: 10,
  key : settings.youtubeKey
};

module.exports = async function (term){
    return new Promise((resolve, reject) => {
        search(term, opts, function(err, results) {
            if(err) return reject(err);
            return resolve(results[0]);
        });
    });
}

/*

{ id: '6_te4S8JQ4A',
  link: 'https://www.youtube.com/watch?v=6_te4S8JQ4A',
  kind: 'youtube#video',
  publishedAt: '2016-07-01T14:08:40.000Z',
  channelId: 'UCr8oc-LOaApCXWLjL7vdsgw',
  channelTitle: 'UKF Drum & Bass',
  title: 'The Prototypes - Rocket Guns Blazin\'',
  description: 'Watch The Prototypes\' music video for the explosive new single \'Transmission\': http://ukf.me/prototransmission ○ Free download: http://gethyperecords.co/ ...',
  thumbnails:
   { default:
      { url: 'https://i.ytimg.com/vi/6_te4S8JQ4A/default.jpg',
        width: 120,
        height: 90 },
     medium:
      { url: 'https://i.ytimg.com/vi/6_te4S8JQ4A/mqdefault.jpg',
        width: 320,
        height: 180 },
     high:
      { url: 'https://i.ytimg.com/vi/6_te4S8JQ4A/hqdefault.jpg',
        width: 480,
        height: 360 } } }

*/