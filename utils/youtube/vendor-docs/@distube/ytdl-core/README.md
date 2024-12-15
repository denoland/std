# @distube/ytdl-core

DisTube fork of `ytdl-core`. This fork is dedicated to fixing bugs and adding
features that are not merged into the original repo as soon as possible.

<a href='https://ko-fi.com/skick' target='_blank'><img height='48' src='https://storage.ko-fi.com/cdn/kofi3.png' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Installation

```bash
npm install @distube/ytdl-core@latest
```

Make sure you're installing the latest version of `@distube/ytdl-core` to keep
up with the latest fixes.

## Usage

```js
const ytdl = require('@distube/ytdl-core')
// TypeScript: import ytdl from '@distube/ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from '@distube/ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('@distube/ytdl-core'); with neither of the above

// Download a video
ytdl('http://www.youtube.com/watch?v=aqz-KE-bpKQ').pipe(
  require('fs').createWriteStream('video.mp4'),
)

// Get video info
ytdl.getBasicInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ').then((info) => {
  console.log(info.videoDetails.title)
})

// Get video info with download formats
ytdl.getInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ').then((info) => {
  console.log(info.formats)
})
```

### Cookies Support

```js
const ytdl = require('@distube/ytdl-core')

// (Optional) Below are examples, NOT the recommended options
const cookies = [
  { name: 'cookie1', value: 'COOKIE1_HERE' },
  { name: 'cookie2', value: 'COOKIE2_HERE' },
]

// (Optional) http-cookie-agent / undici agent options
// Below are examples, NOT the recommended options
const agentOptions = {
  pipelining: 5,
  maxRedirections: 0,
  localAddress: '127.0.0.1',
}

// agent should be created once if you don't want to change your cookie
const agent = ytdl.createAgent(cookies, agentOptions)

ytdl.getBasicInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', { agent })
ytdl.getInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', { agent })
```

#### How to get cookies

- Install [EditThisCookie](http://www.editthiscookie.com/) extension for your
  browser.
- Go to [YouTube](https://www.youtube.com/).
- Log in to your account. (You should use a new account for this purpose)
- Click on the extension icon and click "Export" icon.
- Your cookies will be added to your clipboard and paste it into your code.

> [!WARNING]
> Don't logout it by clicking logout button on youtube/google account manager,
> it will expire your cookies. You can delete your browser's cookies to log it
> out on your browser. Or use incognito mode to get your cookies then close it.

> [!WARNING]
> Paste all the cookies array from clipboard into `createAgent` function. Don't
> remove/edit any cookies if you don't know what you're doing.

> [!WARNING]
> Make sure your account, which logged in when you getting your cookies, use 1
> IP at the same time only. It will make your cookies alive longer.

```js
const ytdl = require('@distube/ytdl-core')
const agent = ytdl.createAgent([
  {
    domain: '.youtube.com',
    expirationDate: 1234567890,
    hostOnly: false,
    httpOnly: true,
    name: '---xxx---',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: false,
    value: '---xxx---',
  },
  {
    '...': '...',
  },
])
```

- Or you can paste your cookies array into a file and use `fs.readFileSync` to
  read it.

```js
const ytdl = require('@distube/ytdl-core')
const fs = require('fs')
const agent = ytdl.createAgent(JSON.parse(fs.readFileSync('cookies.json')))
```

### Proxy Support

```js
const ytdl = require('@distube/ytdl-core')

const agent = ytdl.createProxyAgent({ uri: 'my.proxy.server' })

ytdl.getBasicInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', { agent })
ytdl.getInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', { agent })
```

Use both proxy and cookies:

```js
const ytdl = require('@distube/ytdl-core')

const agent = ytdl.createProxyAgent({ uri: 'my.proxy.server' }, [{
  name: 'cookie',
  value: 'COOKIE_HERE',
}])

ytdl.getBasicInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', { agent })
ytdl.getInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', { agent })
```

### IP Rotation

_Built-in ip rotation (`getRandomIPv6`) won't be updated and will be removed in
the future, create your own ip rotation instead._

To implement IP rotation, you need to assign the desired IP address to the
`localAddress` property within `undici.Agent.Options`. Therefore, you'll need to
use a different `ytdl.Agent` for each IP address you want to use.

```js
const ytdl = require('@distube/ytdl-core')
const { getRandomIPv6 } = require('@distube/ytdl-core/lib/utils')

const agentForARandomIP = ytdl.createAgent(undefined, {
  localAddress: getRandomIPv6('2001:2::/48'),
})

ytdl.getBasicInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', {
  agent: agentForARandomIP,
})

const agentForAnotherRandomIP = ytdl.createAgent(undefined, {
  localAddress: getRandomIPv6('2001:2::/48'),
})

ytdl.getInfo('http://www.youtube.com/watch?v=aqz-KE-bpKQ', {
  agent: agentForAnotherRandomIP,
})
```

## API

You can find the API documentation in the
[original repo](https://github.com/fent/node-ytdl-core#api). Except a few
changes:

### `ytdl.getInfoOptions`

- `requestOptions` is now `undici`'s
  [`RequestOptions`](https://github.com/nodejs/undici#undicirequesturl-options-promise).
- `agent`:
  [`ytdl.Agent`](https://github.com/distubejs/ytdl-core/blob/master/typings/index.d.ts#L10-L14)
- `playerClients`: An array of player clients to use. Accepts `WEB`,
  `WEB_CREATOR`, `IOS`, and `ANDROID`. Defaults to `["WEB_CREATOR", "IOS"]`.

### `ytdl.createAgent([cookies]): ytdl.Agent`

`cookies`: an array of json cookies exported with
[EditThisCookie](http://www.editthiscookie.com/).

### `ytdl.createProxyAgent(proxy[, cookies]): ytdl.Agent`

`proxy`:
[`ProxyAgentOptions`](https://github.com/nodejs/undici/blob/main/docs/api/ProxyAgent.md#parameter-proxyagentoptions)
contains your proxy server information.

#### How to implement `ytdl.Agent` with your own Dispatcher

You can find the example
[here](https://github.com/distubejs/ytdl-core/blob/master/lib/cookie.js#L73-L86)

## Limitations

ytdl cannot download videos that fall into the following

- Regionally restricted (requires a [proxy](#proxy-support))
- Private (if you have access, requires [cookies](#cookies-support))
- Rentals (if you have access, requires [cookies](#cookies-support))
- YouTube Premium content (if you have access, requires
  [cookies](#cookies-support))
- Only [HLS Livestreams](https://en.wikipedia.org/wiki/HTTP_Live_Streaming) are
  currently supported. Other formats will get filtered out in ytdl.chooseFormats

Generated download links are valid for 6 hours, and may only be downloadable
from the same IP address.

## Rate Limiting

When doing too many requests YouTube might block. This will result in your
requests getting denied with HTTP-StatusCode 429. The following steps might help
you:

- Update `@distube/ytdl-core` to the latest version
- Use proxies (you can find an example [here](#proxy-support))
- Extend the Proxy Idea by rotating (IPv6-)Addresses
  - read
    [this](https://github.com/fent/node-ytdl-core#how-does-using-an-ipv6-block-help)
    for more information about this
- Use cookies (you can find an example [here](#cookies-support))
  - for this to take effect you have to FIRST wait for the current rate limit to
    expire
- Wait it out (it usually goes away within a few days)

## Update Checks

The issue of using an outdated version of ytdl-core became so prevalent, that
ytdl-core now checks for updates at run time, and every 12 hours. If it finds an
update, it will print a warning to the console advising you to update. Due to
the nature of this library, it is important to always use the latest version as
YouTube continues to update.

If you'd like to disable this update check, you can do so by providing the
`YTDL_NO_UPDATE` env variable.

```
env YTDL_NO_UPDATE=1 node myapp.js
```

## Related Projects

- [DisTube](https://github.com/skick1234/DisTube) - A Discord.js module to
  simplify your music commands and play songs with audio filters on Discord
  without any API key.
- [@distube/ytsr](https://github.com/distubejs/ytsr) - DisTube fork of
  [ytsr](https://github.com/TimeForANinja/node-ytsr).
- [@distube/ytpl](https://github.com/distubejs/ytpl) - DisTube fork of
  [ytpl](https://github.com/TimeForANinja/node-ytpl).
