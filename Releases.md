### 0.113.0 / 2021.10.25

- feat(collections/running_reduce): support `currentIndex` (#1431)
- feat(http/file_server): add color to log message (#1434)
- feat(http/file_server): add breadcrumbs navigation (#1433)
- feat(node): allow require with 'node:' prefix (#1438)
- feat(node/url): add `url.urlToHttpOptions(url)` (#1426)
- feat(testing): add assertIsError (#1376)
- fix(async): fix async/tee concurent .next calls error (#1425)
- fix(crypto): support length option in crypto.subtle.digest (#1386)
- fix(http/file_server): fix encoded url in dir html (#1442)
- fix(http/file_server): fix leak file resource (#1443)
- fix(node): match Node's os.arch values (#1440)
- fix(node): show warning when using import/export in CJS module (#1452)
- fix(node/events): make on and emit methods callable by non-EventEmitter
  objects (#1454)
- fix(node/util): improve util.format (#1181)
- fix(node/_tools): fix node test setup script (#1422)
- chore(node): update Node version from 16.11.1 to 16.12.0 (#1441)

### 0.112.0 / 2021.10.18

- feat(collections): add joinToString (#1223)
- feat(node): CJS-ESM integration (#1412)
- feat(node): add helpers for determining CJS/ESM loader (#1407)
- feat(node): barebones express compatibility (#1398)
- feat(node): define process.mainModule (#1400)
- feat(node/events): implement setMaxListeners (#1414)
- feat(node/http): request & response streams (#1403)
- feat(node/os): add devNull constant (#1397)
- feat(node/url): add `url.format(URL[, options])` (#1420)
- fix(datetime): fix dayOfYear for the southern hemisphere (#1384)
- fix(fs/expand_glob): don't parse root as glob (#1417)
- fix(node): 'Illegal invocation' in 'perf_hooks' module (#1410)
- fix(node): add 'module' to native modules polyfill (#1408)
- fix(node): declare 'global' types inline (#1409)
- fix(node): export util.format() (#1401)
- fix(node): require doesn't throw error (#1399)
- fix(node): use hardcoded versions (#1406)
- fix(std/io): fix readline when catch BufferFullError (#1377)
- fix(testing): improve assertObjectMatch (#1419)
- chore(node): upgrade Node.js version from 15.5.1 to 16.11.1 (#1405)

### 0.111.0 / 2021.10.12

- BREAKING(fs): deprecate exists and existsSync (#1364)
- BREAKING(hash): deprecate std/hash (#1350)
- BREAKING(io): reorganize modules (#813)
- feat: streams utilities (#1141)
- feat(node): Add dns and net modules (#1375)
- feat(node): first iteration of http (#1383)
- feat(node): update built-in modules in node/module.ts (#1378)
- feat(node/crypto): add randomFillSync an randomFill (#1340)
- feat(node/crypto): add randomInt (#1356)
- feat(node/http): Export STATUS_CODES and METHODS (#1357)
- feat(node/url): add support for UNC path (#1365)
- fix(async/delay): reject if signal is already aborted (#1363)
- fix(encoding/base64url): allow passing strings to `encode` (#1361)
- fix(node): typo from #1380 (#1381)
- fix(node/url): improve compatibility of fileURLToPath (#1342)
- perf(bytes): switch equals to simd for large byte arrays (#1349)

### 0.110.0 / 2021.10.04

- feat(node): add missing modules (#1337)
- feat(node): support `Buffer.readUIntLE` (#1326)
- feat(node/buffer): support `Buffer.readUIntBE` (#1321)
- feat(node/crypto): add `scrypt` and `scryptSync` (#1329)
- feat(node/crypto): add `timingSafeEqual` (#1333)
- feat(node/stream/web): export more APIs (#1338)
- feat(std/node): add back os.tmpdir() implementation (#1308)
- feat(std/node/crypto): Add `crypto.randomUUID` (#1332)

### 0.109.0 / 2021.09.28

- feat(std/node/stream): add partial support for `stream/web` (#1297)
- fix(node/_tools): use denoflate to decompress Node test folder (#1299)
- fix(node/events): make `EventEmitter.call` compatible with es5 (#1315)
- fix(std/node/module): treat .mjs files as ESM (#1301)
- perf(crypto): reduce one mircotask (#1307)

### 0.108.0 / 2021.09.21

- fix: use `strict-ts44.tsconfig.json` on release tests (#1278)
- fix(collections): improve handling of arrays containing undefined (#1282)
- feat(testing/asserts): add `assertThrows()` overload to receive error (#1219)
- feat(std/node): add `ParsedUrlQuery` to `querystring` (#1229)
- feat(collections): use function overloading (#1286)
- chore(node/events): remove unnecessary `@ts-ignore` comments (#1280)
- docs(collections): add browser-compatibility comment (#1285)
- docs(encoding): add hex docs (#1287)
- docs(collections): replace console.assert with assertEquals (#1293)

### 0.107.0 / 2021.09.14

- BREAKING(http): cookie headers as params (#1041)
- feat(collection): add findSingle (#1166)
- feat(collections): Add `associatewith` (#1213)
- feat(collections): add `runningReduce` (#1226)
- feat(collections): add `sample` API (#1212)
- feat(collections): add dropWhile (#1185)
- feat(collections): add maxWith (#1170)
- feat(collections): add minWith (#1169)
- feat(collections): add reduceGroups (#1187)
- feat(collections): add slidingWindows (#1191)
- feat(io/streams): propagate cancel in readableStreamFromIterable() (#1274)
- fix(collections/includesValue): prevent enumerable prototype check (#1225)
- fix(testing/asserts): export Constructor type (#1208)
- fix(tests/yaml): expect !!js/function parse/stringify to throw (#1276)
- fix: update to latest signal API changes
- security(encoding/yaml): disable functions (#1275)

### 0.106.0 / 2021.08.23

- feat(async): add abort signal to delay (#1130)
- feat(collection): find_last_index to return undefined on no index found
  (#1072)
- feat(node/buffer): add missing exports (#1140)
- feat(node/buffer): export atob and btoa (#1147)
- fix(node/perf-hooks): add PerformanceEntry to default export (#1152)
- fix(testing): `assertEquals` now considers constructors equal if one is
  nullable and the other is Object (#1159)
- perf(collections): permutations optimisation (#1132)

### 0.105.0 / 2021.08.16

- docs(collections): fix typo in collections docs (#1127)
- feat(collections): compile time guarantee on pure functions (#1119)
- fix: type check examples in README files (#1121)
- fix(collections): intersect does not handle duplicate values in head properly
  (#1131)
- fix(crypto): make crypto bench depend on sibling version of testing module
  (#1135)
- refactor(bytes): rename `contains` to `includes` with optional argument
  `fromIndex` (#1133)

### 0.104.0 / 2021.08.10

- feat: Add `collections` module (#993, #1075, #1103, #1062, #1062, #1109,
  #1108, #1071, #1069, #1104, #1097, #1110, #1116)
- feat(crypto): add std/crypto wrapping and extending runtime WebCrypto (#1025)
- feat(http/file_server): return code 304 based on If-Modified-Since Header
  (#1078)
- feat(node): add remaining Node.js builtin aliases (#1085)
- feat(node): add shim for perf_hooks (#1088)
- feat(node): assert/strict alias (#1084)
- feat(node): fs/promises implementation (#1083)
- feat(testing): add `assertRejects`, deprecate `assertThrowsAsync` (#1101)
- fix(async): make it so exception of `deadline` can be caught (#1105)
- fix(http/file_server): fix flaky 'file_server sets Date header correctly' test
  case (#1095)
- fix(node): assert/strict, fs/promises, perf_hooks modules could not be
  required (#1107)
- fix(node/events): optimize listener management (#1113)
- fix(testing): change `assertThrows` and `assertThrowsAsync` return type to
  `void` and `Promise<void>` (#1052)

### 0.103.0 / 2021.07.26

- feat(async): add status to deferred promises (#1047)
- feat(http): add range request and etag support to `file_server.ts` (#1028)
- fix(async/deferred): rename .status -> .state (#1055)
- fix(encoding/base64url): throw TypeError in case of invalid base64url string
  (#1040)
- fix(encoding/toml): fix inline table and nested array (#1042)
- fix(encoding/yaml): fix `parseAll` type definition by using overloads (#1048)
- fix(testing): `assertThrowsAsync` always reporting `Error` instead of actual
  error class (#1051)
- fix(testing/asserts): cater for different class constructor functions (#1000)

### 0.102.0 / 2021.07.19

- feat: Add std/collections (#993)
- fix(encoding/toml): fix comment line starting with whitespaces (#1017)
- fix(encoding/toml): parse keys correctly (#1019)
- fix(hash): fix handling of non-byte-sized TypedArray views (#1012)
- fix(testing): Don't merge diff when it's not spaces even if it's surrounded by
  word-diff (#1032)

### 0.101.0 / 2021.07.13

- BREAKING(encoding/hex): remove encodedLen, encodeToString, decodedLen,
  decodeString, errInvalidByte, errLength (#733)
- BREAKING(mime/multipart): return array for multiple values with same form name
  (#722)
- BREAKING(std/uuid): rework v4 and v5 module (#971)
- feat(async): add `deadline` to async module (#1022)
- feat(async): add debounce method to async module (#1006)
- feat(encoding/toml): fix bad string format. Improve coverage (#991)
- feat(hash): add BLAKE3 hash support (#994)
- feat(http): Add Cookie domain validation (#1009)
- feat(http): Allow passing path and domain attributes while removing cookies
  (#1005)
- feat(io): add `copy` function (#1016)
- feat(io/streams): add autoClose option to writableStreamFromWriter (#964)
- feat(std/node): add writeBuffer of internal binding fs module (#888)
- fix: improve type safety for browser-compatible modules (#995)
- fix(encoding/toml): serializes mixed array (#1001)
- fix(encoding/toml): throws parse error when toml uses invalid whitespaces
  (#1013)
- fix(http): `setCookie` with `maxAge` of `0` (#992)
- fix(http/server): Swallow NotConnected errors from listener.accept() (#761)
- fix(io/bufio): fix handling of trailing new line (#990)
- fix(node/module): More descriptive error in "createRequire" (#997)
- fix(path): Add question mark as a glob indicator (#1024)
- fix(testing): use return type of never for `fail` (#1002)

### 0.100.0 / 2021.06.29

- feat(testing/asserts): improved strings diff (#948)
- feat(testing/asserts): use assertion signature for "assertExists" (#969)
- fix(node/events): align EventEmitter#addListener with native node tests (#976)
- fix(path): fix type error in glob.ts with noImplicitAny: false config (#977)

### 0.99.0 / 2021.06.15

- feat(mime): make createPart of MultipartWriter public (#960)
- feat(node/util): add inherits (#958)
- fix(node/events): fix EventEmitter#removeAllListeners (#968)
- fix(node/process): make process.env enumerable (#957)
- fix(node/util): fix util.inherits (#959)

### 0.98.0 / 2021.06.08

- feat(async): add async/tee (#919)
- feat(async/mux): take AsyncIterable as source iterator (#923)
- feat(io/bufio): add encoding options to `readLines` and `readStringDelim`
  (#921)
- feat(node/perf_hooks): add perf_hooks module (#945)
- fix(encoding/binary): allow getNBytes to read until EOF (#932)
- fix(encoding/binary): respect non 0 byte offsets (#826)
- fix(node/events): fix EventEmitter#once to pass native node tests (#935)
- fix(node/events): fix getMaxListeners and setMaxListeners to pass native node
  tests (#928)
- fix(node/fs): fix type error in fs.watch impl (#947)
- fix(testing/asserts): fix handling of Weak* objects (#951)

### 0.97.0 / 2021.05.17

- fix(io/buffer): make Buffer compatible with Deploy (#912)
- fix(io/bufio): readDelim returns wrong result if delim strides over chunks
  (#877)
- fix(node/events): accept only functions as listener arguments (#916)
- fix(testing): support array values in assertObjectMatch (#906)

### 0.96.0 / 2021.05.11

- feat(fs/walk): show path in walk error (#875)
- feat(http): allow custom response code (#855)
- feat(io): add readRange, readRangeSync (#884)
- feat(mime/multipart): add options to readForm (#895)
- feat(node): add console module (#892)
- feat(node/assert): add rejects and doesNotReject (#894)
- feat(std/node): add implementation of os.homedir() (#873)
- fix(http/file_server): keep url and name consistent (#908)
- fix(io): Improve readDelims() performance (#867)
- fix(io/streams): don't use a byte ReadableStream (#891)
- fix(node/assert): enable test-assert-fail.js and align assert.fail to it
  (#874)
- fix(node/child_process): Try to fix flaky tests (#876)
- fix(node/stream): make `Stream` the default export (#901)

### 0.95.0 / 2021.04.23

- feat(node): add basic support for child_process.spawn (#785)
- feat(path/glob): add caseInsensitive option (#854)
- fix(node/fs): actually export everything (#862)

### 0.94.0 / 2021.04.20

- feat(node/fs): add fstat and fstatSync (#847)
- feat(streams): add readableStreamFromReader (#852)
- fix(path): reduce circular dependency (#858)
- fix(testing): equals does not differentiate undefined/absent keys (#849)

### 0.93.0 / 2021.04.13

- feat: add iter and iterSync to io/util (#843)
- feat(node/fs): add fdatasync and fdatasyncSync (#841)
- feat(node/fs): add fsync and fsyncSync (#840)
- feat(node/fs): add ftruncate and ftruncateSync (#829)
- feat(node/fs): add futimes and futimesSync (#830)
- fix(testing): Function signature of assertObjectEquals() does not accept
  interfaces (#763)

### 0.92.0 / 2021.04.02

- feat: make bufio compatible to Deno Deploy (#831)
- feat: add symlink adn symlinkSync to node/fs (#825)
- feat: add format and improve deprecate in node/util (#693)
- feat: add io/buffer and io/util module (#808) …
- fix: handle upstream type changes (#834)
- refactor: `Promise<void>` return types are unnecessary boilerplate in
  encoding. (#818)
- chore: remove unused import in http (#817)

### 0.91.0 / 2021.03.21

- chore(codecov): ignore coverage of examples (#798)
- feat(encoding/yaml): add support for JS types and user types (#789)
- feat(io/streams): Add readerFromIterable() (#752)
- feat(std/node): add utimes and utimesSync (#805)
- fix(multipart): support useDefineForClassFields (#807)
- fix(node): fix node/cli.ts (#797)
- fix(node): move `throw error` in fs.writeFile to pass `no-unsafe-finally`
  (#810)
- fix(path): enable and fix file URL tests (#804)
- refactor(node/fs): update fs import (#793)

### 0.90.0 / 2021.03.09

- fix(http): Create a single encoder instance (#790)
- feat(node): Add "module" polyfill (#783)
- feat(node): Add CLI for running Node.js script with std/node (#779)
- feat(node): Fix assert module, enable test cases (#769)

### 0.89.0 / 2021.03.02

- BREAKING(io/streams): Strengthen iterator to readable stream conversion (#735)
- build: collect and upload code coverage (#770)
- feat(node): add constants module (#747)
- feat(node): add crypto.createHash (#757)
- feat(node): add process.hrtime function (#751)
- feat(node): add truncate and truncateSync (#765)
- fix(node): export promisify & callbackify (#748)
- fix(node): fix export items of events (#758)
- fix(node): ignore shebang (#746)
- fix(node): native module needs to be extensible (#745)
- fix(node/process): make process.argv an array (#749)
- fix: fix type errors in canary test (#762)
- refactor: fix codes to pass `no-unused-vars` lint (#764)
- test(path): update test cases for canary (#775)

### 0.88.0 / 2021.02.19

- BREAKING(encoding): remove module utf8.ts (#728)
- chore: fix typo in contributing section (#709)
- docs(bytes): improve README.md (#737)
- feat(node): add native module polyfills: url, crypto (#729)
- feat(node): add tty module (#738)
- feat(node): support conditional exports (#726)
- fix(std/testing) : Handle Symbols correctly in deep equalities (#731)
- test(node): run external tests with --quiet (#732)

### 0.87.0 / 2021.02.12

- BREAKING(http/cookie): remove Cookies and SameSite type aliases (#720)
- docs(fmt): fix examples in fmt/colors.ts (#715)
- docs(io/ioutil): improve jsdoc (#706)
- fix(http/file_server): svg media type (#718)
- refactor(hash/md5): throw `TypeError` for wrong type (#698)
- test(node): enable native node tests (#695)

### 0.86.0 / 2021.02.05

- feat(http/file_server): support do not show dotfiles (#690)
- feat(http/file_server): show ../ if it makes sense & end dirs with / (#691)

Releases notes for previous releases can be found in
[`deno` repository](https://github.com/denoland/deno/releases).
