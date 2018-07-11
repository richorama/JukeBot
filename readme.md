# JukeBot

A chatbot for Slack which downloads requested music from YouTube and queues it to play. Runs on the Raspberry Pi. 

## Installation

Ensure python, pip, node.js and git are installed.

Install the python package [youtube-dl](https://rg3.github.io/youtube-dl/):

```
sudo pip install --upgrade youtube_dl
```

Install mpg123 & ffmpeg:

```
sudo apt-get install mpg123 ffmpeg
```

Clone this repo:

```
git clone https://github.com/richorama/JukeBot.git
cd JukeBot
```

Install the dependencies:

```
npm install
```

Start the app up for registration mode:

```
node app register
```

This will open login web page which will allow you to regsiter your bot with [these instructions](https://botkit.ai/docs/provisioning/slack-events-api.html).

Create a Google API Key on their [API console](https://console.developers.google.com/apis/credentials).

Create a `client_secret.json` file with the google and slack credentials.

```js
{
    "youtubeKey":"KEY_FOR_YOUTUBE_API",
    "clientId": "SLACK_CLIENT_ID",
    "clientSecret" : "SLACK_CLIENT_SECRET",
    "port" : "8080"
}
```

Start the app up and play!

```
node app
```

## Talking to the bot

`play XXX` to play a tune

`current` to find out what is currently playing

`list` to list the tunes queued up

`skip` to move onto the next tune

`rewind` to rewind to the start of the current tune

`pause` / `resume` to pause the music

# License

MIT