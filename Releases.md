### 2025.10.07

#### @std/assert 1.0.15 (patch)

- feat(assert/unstable): truncate big diffs (#6835)
- fix(assert): add support for checking ArrayBuffer equality (#6821)

#### @std/async 1.0.15 (patch)

- feat(async/unstable): add `ensureLastCall` option for `throttle` (#6800)
- fix(async/unstable): fix handling of async predicate in waitFor (#6839)
- fix(async): convert setTimeout return values to Number (fixing type error when
  used with Node.js) (#6833)
- fix(async): pass numeric value of `delay` timer to `unrefTimer` when
  `persistent=false` (#6822)

#### @std/cli 1.0.23 (patch)

- fix(cli): improve Node compatibility by removing top-level Deno API usage
  (#6837)
- fix(cli): ensure unknown() is not called for collect args (parseArgs) (#6813)

#### @std/html 1.0.5 (patch)

- feat(html/unstable): add escapeJs and escapeCss functions (#6782)

#### @std/http 1.0.21 (patch)

- fix(http,random,streams,tar,webgpu): update types for Deno 2.5 (#6817)

#### @std/internal 1.0.11 (patch)

- chore(internal): support truncating of big diffs (#6835)

#### @std/random 0.1.3 (patch)

- fix(http,random,streams,tar,webgpu): update types for Deno 2.5 (#6817)

#### @std/semver 1.0.6 (patch)

- fix(semver): allow users to set prerelease number during increment (#6825)

#### @std/streams 1.0.13 (patch)

- fix(http,random,streams,tar,webgpu): update types for Deno 2.5 (#6817)

#### @std/tar 0.1.9 (patch)

- fix(http,random,streams,tar,webgpu): update types for Deno 2.5 (#6817)

#### @std/testing 1.0.16 (patch)

- feat(testing/unstable): add `it.todo` `test.todo` and `describe.todo` API
  (#6712)

#### @std/toml 1.0.11 (patch)

- test(toml): test with the official toml-test suite (#6798)

#### @std/webgpu 0.224.9 (patch)

- fix(http,random,streams,tar,webgpu): update types for Deno 2.5 (#6817)

#### @std/yaml 1.0.10 (patch)

- feat(yaml/unstable): allow to add custom types for parse and stringify (#6841)

### 2025.09.04

#### @std/cli 1.0.22 (patch)

- fix(cli/unstable): update typing of ProgressBarStream for TS 5.9 (#6811)

#### @std/net 1.0.6 (patch)

- feat(net/unstable): add matchSubnets on @std/net (#6786)

#### @std/streams 1.0.12 (patch)

- deprecation(streams/unstable): AbortStream (#6799)

#### @std/tar 0.1.8 (patch)

- refactor(tar): clean up TarStream (#6783)
- test(tar): improve TarStream's tests (#6793)

#### @std/toml 1.0.10 (patch)

- fix(toml): nested table arrays (#6794)

### 2025.08.13

#### @std/assert 1.0.14 (patch)

- chore(assert,expect): bump assert and expect versions (#6791)

#### @std/collections 1.1.3 (patch)

- test(collections): fix mapValues mutation test so it actually tests mutation
  (#6780)

#### @std/expect 1.0.17 (patch)

- chore(assert,expect): bump assert and expect versions (#6791)

#### @std/net 1.0.5 (patch)

- feat(net/unstable): add ip utilities (#6765)

#### @std/path 1.1.2 (patch)

- fix(path): improve regex in `isGlob` (#6764)

#### @std/streams 1.0.11 (patch)

- refactor(streams/unstable): toByteStream to make use of autoAllocateChunkSize
  (#6781)

#### @std/text 1.0.16 (patch)

- feat(text/unstable): add `trimBy` functions (#6778)

#### @std/toml 1.0.9 (patch)

- fix(toml): prevent prototype pollution by table key

### 2025.07.29

#### @std/async 1.0.14 (patch)

- fix(async): allow delay timeout of arbitrary length (#6775)

#### @std/tar 0.1.7 (patch)

- fix(tar): receiving empty buffers (#6777)

### 2025.07.22

#### @std/cli 1.0.21 (patch)

- BREAKING(cli/unstable): rename `fmt` of `ProgressBarOption` to `formatter`
  (#6707)
- feat(cli/unstable): introduce Ansi module (#6756)
- feat(cli/unstable): add search to promptSelect and promptMultipleSelect
  (#6741)
- feat(cli/unstable): valued prompt items (#6742)
- feat(cli/unstable): add `visibleLines` and `indicator` options to
  `promptMultipleSelect`, and show `...` above the options when appropriate
  (#6699)
- refactor(cli/unstable): dedupe logic between promptSelect and
  promptMultipleSelect (#6769)
- refactor(cli/unstable): rename `title` to `label` for valued prompt items
  (#6751)

#### @std/data-structures 1.0.9 (patch)

- feat(data-structures/unstable): 2d array (#6754)

#### @std/http 1.0.20 (patch)

- fix(http): respect colors and other `Deno.inspect` options when logging
  `UserAgent`s (#6763)

#### @std/internal 1.0.10 (patch)

- fix(internal): fix inspect fallbacks for formatting diffs (#6747)

#### @std/testing 1.0.15 (patch)

- feat(testing/unstable): add `stubProperty` function (#6761)
- fix(testing): align types for fake timeout/interval signatures (#6767)

#### @std/yaml 1.0.9 (patch)

- refactor(yaml): remove `version` property, separate directive handling (#6657)

### 2025.07.01

#### @std/collections 1.1.2 (patch)

- chore(collections): add browser compatibility declaration to `unstable-cycle`
  module (#6720)

#### @std/fs 1.0.19 (patch)

- fix(fs,internal,path): unify `isWindows` implementations (#6744)

#### @std/http 1.0.19 (patch)

- perf(http): increase performance of HTML rendering (#6727)

#### @std/internal 1.0.9 (patch)

- fix(fs,internal,path): unify `isWindows` implementations (#6744)

#### @std/path 1.1.1 (patch)

- fix(fs,internal,path): unify `isWindows` implementations (#6744)

#### @std/text 1.0.15 (patch)

- feat(text/unstable): add `longestCommonPrefix` (#6734)
- feat(text/unstable): add `toTitleCase()` and `toSentenceCase()` (#6701)
- fix(text/unstable): `dedent()` correct blank line handling (#6738)

### 2025.06.12

#### @std/cli 1.0.20 (patch)

- fix(cli/unstable): `Spinner` print on `start()` (#6706)
- refactor(cli/unstable): move unit related stuff to separate file (#6693)

#### @std/http 1.0.18 (patch)

- feat(http/unstable): add `cleanUrls` option to `serveDir` (#6231)

#### @std/streams 1.0.10 (patch)

- feat(streams/unstable): add `AbortStream` (#6708)
- refactor(streams): throw `RangeError` within `Buffer` methods (#6714)

#### @std/testing 1.0.14 (patch)

- test(testing): ignore doc test of snapshot docs (#6718)

#### @std/toml 1.0.8 (patch)

- fix(toml): february edge cases in datetime (#6704)
- fix(toml): leading zeroes in float (#6703)
- refactor(toml): use RegExp groups for month validation (#6705)

#### @std/uuid 1.0.9 (patch)

- fix(uuid): support for UUID v7 validation (#6709)

#### @std/yaml 1.0.8 (patch)

- feat(yaml/unstable): export `unstable_stringify.ts` (#6702)
- refactor(yaml): move `composeNode()` params in an object (#6658)

### 2025.05.30

#### @std/cli 1.0.19 (patch)

- fix(cli/unstable): clamp `ratio` (#6690)
- refactor(cli/unstable): use `Date.now()` internally and use `FakeTime` for
  testing (#6686)
- refactor(cli/unstable): refactor `print()` (#6687)

#### @std/fs 1.0.18 (patch)

- chore(fs/unstable): ignore some rename and renameSync tests on windows (#6695)

#### @std/random 0.1.2 (patch)

- fix(random/unstable): fixed results for some seeds (#6689)

### 2025.05.27

#### @std/cli 1.0.18 (patch)

- BREAKING(cli/unstable): make `ProgressBarFormatter.styledTime` a getter
  (#6677)
- BREAKING(cli/unstable): change custom formatter rule (#6678)
- BREAKING(cli/unstable): make `ProgressBar` `value` and `max` properties
  public, remove add method (#6430)
- BREAKING(cli/unstable): make `ProgressBar` `writable` optional (#6409)
- BREAKING(cli/unstable): rename `ProgressBar` `end()` method to `stop()`
  (#6406)
- fix(cli/unstable): fix resource leak of ProgressBar (#6675)
- refactor(cli/unstable): string based `ProgressBar` tests (#6679)
- refactor(cli/unstable): print initial `ProgressBar` (#6676)
- refactor(cli/unstable): generalize units (#6680)

#### @std/collections 1.1.1 (patch)

- feat(collections/unstable): add non-exact binary search function (#6628)

#### @std/datetime 0.225.5 (patch)

- refactor(datetime): simplify month difference (#6662)

#### @std/dotenv 0.225.5 (patch)

- fix(dotenv): prevent prototype pollution during parsing (#6661)

#### @std/http 1.0.17 (patch)

- refactor(http): format file server HTML (#6659)
- chore(http): remove unused `_mock_conn.ts` (#6654)

#### @std/internal 1.0.8 (patch)

- fix(internal): support AssertionState cleanup in node and bun (#6655)

#### @std/path 1.1.0 (minor)

- feat(path): add support of URL input for basename, dirname, extname, join, and
  normalize (#6651)

#### @std/random 0.1.1 (patch)

- feat(random/unstable): allow generating seeded random bytes and 53-bit-entropy
  floats in [0, 1) (add `getRandomValuesSeeded` and `nextFloat64`) (#6626)

#### @std/testing 1.0.13 (patch)

- feat(testing/unstable): add `assertInlineSnapshot()` (#6530)

#### @std/text 1.0.14 (patch)

- fix(text/unstable): make dedent match reference for multiline substitutions
  (#6667)

#### @std/toml 1.0.7 (patch)

- fix(toml): leading zero errors (#6681)
- refactor(toml): move `_parser.ts` tests to separate file (#6653)
- refactor(toml): rewrite `deepAssignWithTable` (#6580)

#### @std/uuid 1.0.8 (patch)

- docs(uuid): update module docs to mention UUIDv7 (#6683)

#### @std/yaml 1.0.7 (patch)

- feat(yaml/unstable): support `quoteStyle` (#6666)

### 2025.05.13

#### @std/async 1.0.13 (patch)

- fix(async): `abortable` should prevent uncaught error when promise is rejected
  (#6312)

#### @std/bytes 1.0.6 (patch)

- fix(bytes): allow to concat() readonly arrays of bytes arrays (#6639)

#### @std/collections 1.1.0 (minor)

- feat(collections): stabilize `Iterable` input for `chunk`, `dropLastWhile`,
  `dropWhile`, `intersect`, `sample`, `slidingWindows`, `sortBy`,
  `takeLastWhile`, `takeWhile`, and `withoutAll` (#6644)
- feat(collections/unstable): add cycle iterator utility (#6386)

#### @std/crypto 1.0.5 (patch)

- chore(crypto): update `crypto/_wasm` and `wasmbuild` task (#6611)

#### @std/data-structures 1.0.8 (patch)

- feat(data-structures/unstable): add `BinarySearchTree` methods `ceiling`,
  `floor`, `higher`, `lower` (#6544)

#### @std/dotenv 0.225.4 (patch)

- feat(dotenv): add URL as envPath type (#6621)

#### @std/expect 1.0.16 (patch)

- fix(expect,testing,internal): throw if `expect.hasAssertion` and
  `expect.assertions` are not checked (#6646)

#### @std/fmt 1.0.8 (patch)

- docs(fmt): clarify runtime compatibility (#6648)

#### @std/html 1.0.4 (patch)

- fix(html/unstable): add missing range
  (`unstable_is_valid_custom_element_name`) (#6634)

#### @std/http 1.0.16 (patch)

- fix(http): don't set the Date header in file_server.ts responses (use the
  default Date header value) (#6610)

#### @std/internal 1.0.7 (patch)

- fix(expect,testing,internal): throw if `expect.hasAssertion` and
  `expect.assertions` are not checked (#6646)

#### @std/testing 1.0.12 (patch)

- fix(expect,testing,internal): throw if `expect.hasAssertion` and
  `expect.assertions` are not checked (#6646)

#### @std/toml 1.0.6 (patch)

- fix(toml): should use lowercase value for nan (#6638)

### 2025.04.24

#### @std/assert 1.0.13 (patch)

- refactor(assert,cbor,collections,fs,toml,uuid): align error messages to the
  style guide, add `error-message` Deno Style Guide linter plugin (#6553)

#### @std/cbor 0.1.8 (patch)

- refactor(assert,cbor,collections,fs,toml,uuid): align error messages to the
  style guide, add `error-message` Deno Style Guide linter plugin (#6553)

#### @std/cli 1.0.17 (patch)

- feat(cli/unstable): add `visibleLines` and `indicator` options. `promptSelect`
  simulates scrolling when the list is larger than `visibleLines` (#6523)
- docs(cli/unstable): fix Spinner example typo (#6595)

#### @std/collections 1.0.11 (patch)

- refactor(assert,cbor,collections,fs,toml,uuid): align error messages to the
  style guide, add `error-message` Deno Style Guide linter plugin (#6553)

#### @std/csv 1.0.6 (patch)

- docs(csv): add many more examples to `mod.ts` (#6571)

#### @std/data-structures 1.0.7 (patch)

- feat(data-structures/unstable): BidirectionalMap constructor accept iterables
  of key-value pairs (#6598)
- fix(data-structures/unstable): BidirectionalMap differentiate extant
  `undefined` from missing values (#6606)

#### @std/encoding 1.0.10 (patch)

- BREAKING(encoding/unstable): base64/32 functions to match
  proposal-arraybuffer-base64 API (#6608)
- docs(encoding): add many more examples to `mod.ts` (#6570)
- docs(encoding): fix links in calcSize function docs (#6557)

#### @std/fmt 1.0.7 (patch)

- test(fmt): reduce unnecessary output during test run (#6596)

#### @std/fs 1.0.17 (patch)

- feat(fs/unstable): add create and createSync (#6600)
- feat(fs/unstable): add open, openSync, and FsFile class (#6524)
- refactor(assert,cbor,collections,fs,toml,uuid): align error messages to the
  style guide, add `error-message` Deno Style Guide linter plugin (#6553)

#### @std/http 1.0.15 (patch)

- chore(http): do not request to example.com in doc testing (#6576)

#### @std/ini 1.0.0-rc.8 (prerelease)

- fix(ini): fix quoted value bug (#6572)
- refactor(ini): remove `IniMap` (#6515)

#### @std/json 1.0.2 (patch)

- docs(json): update link to NDJSON (#6560)

#### @std/jsonc 1.0.2 (patch)

- test(jsonc): move `node-jsonc-parser` out of separate `testdata` folder
  (#6618)

#### @std/path 1.0.9 (patch)

- docs(path): add many more examples to `mod.ts` (#6569)

#### @std/text 1.0.13 (patch)

- BREAKING(text/unstable): fix dedent export path (#6573)

#### @std/toml 1.0.5 (patch)

- fix(toml): fix empty inline table bug (#6587)
- fix(toml): fix handling of leading and trailing underscores in number literals
  (#6605)
- fix(toml): fix empty string handling (#6585)
- perf(toml): add `Scanner` `match()` method, capturing numbers and bare key
  patterns using sticky regexp (#6538)
- refactor(toml): split `symbol` parser (#6563)
- refactor(assert,cbor,collections,fs,toml,uuid): align error messages to the
  style guide, add `error-message` Deno Style Guide linter plugin (#6553)
- refactor(toml): fix object check in 'merge' util (#6582)
- refactor(toml): cleanup `parserFactory()` (#6567)
- refactor(toml): add `Scanner` `skipWhitespaces()` method (#6564)
- refactor(toml): rewrite `unflat()` (#6555)
- test(toml): move `stringify()` tests to `stringify_test.ts` (#6586)

#### @std/uuid 1.0.7 (patch)

- refactor(assert,cbor,collections,fs,toml,uuid): align error messages to the
  style guide, add `error-message` Deno Style Guide linter plugin (#6553)

#### @std/yaml 1.0.6 (patch)

- refactor(yaml): declare-on-use variables (#6594)
- refactor(yaml): add `skipWhitespaces()` method (#6603)
- refactor(yaml): add `skipComment()` method (#6588)
- refactor(yaml): remove `throwError()` util method (#6593)

### 2025.04.08

#### @std/cli 1.0.16 (patch)

- refactor(cli/unstable): add `ProgressBar` `Unit` type (#6506)
- chore(cli,http): fix typechecking errors (#6521)

#### @std/datetime 0.225.4 (patch)

- fix(datetime): fix formatting of `fractionalSecond`, fix parsing of `yy` and
  `yyyy`, test each part type in dateTimeFormatter.format (#6516)

#### @std/encoding 1.0.9 (patch)

- BREAKING(encoding/unstable): replace `encodeRaw` with `encodeInto` & remove
  `decodeRaw` (#6513)
- feat(encoding/unstable): add Uint8Array support to decodeBase64, 32, and hex
  (#6508)

#### @std/expect 1.0.15 (patch)

- fix(expect): include diff when `expect.toMatchObject` throws (#6525)

#### @std/fs 1.0.16 (patch)

- feat(fs/unstable): add chown and chownSync (#6552)
- feat(fs/unstable): add readDirSync (#6381)

#### @std/http 1.0.14 (patch)

- fix(http): use relative urls in file server dirlisting (#6537)
- chore(cli,http): fix typechecking errors (#6521)

#### @std/ini 1.0.0-rc.7 (prerelease)

- fix(ini): replace `isRecord()` with `isPlainObject()` (#6517)
- refactor(ini): simplify `parse()` (#6512)
- refactor(ini): simplify `stringify()` (#6514)
- refactor(ini): remove `IniMap.prototype.#cleanFormatting()` (#6511)
- test(ini): refactor ini tests (#6549)
- test(ini): add line break and whitespace tests (#6519)

#### @std/semver 1.0.5 (patch)

- chore(semver): remove `MIN` constant (#6526)

#### @std/testing 1.0.11 (patch)

- refactor(testing): add instructions to update snapshots (#6543)

#### @std/toml 1.0.4 (patch)

- refactor(toml): improve `integer()` function (#6533)
- refactor(toml): add `Scanner` `startsWith()` method (#6532)
- refactor(toml): improve `Scanner` `next()` method (#6534)

### 2025.03.25

#### @std/assert 1.0.12 (patch)

- fix(assert,expect,internal,testing): improve handling of escaped chars in
  diff_str (#6485)

#### @std/async 1.0.12 (patch)

- test(async): fix flaky waitFor test (#6467)
- test(async): use FakeTime in pooledMap testing (#6468)

#### @std/cache 0.2.0 (minor)

- BREAKING(cache/unstable): configurable cache ejection of thrown or rejected
  values, change cache type (#6417) (#6419)

#### @std/cbor 0.1.7 (patch)

- feat(cbor): add support for bignums (#6458)
- fix(cbor): bug in preallocating space for string encoding (#6459)

#### @std/cli 1.0.15 (patch)

- BREAKING(cli/unstable): remove trailing whitespaces from
  `ProgressBarFormatter` properties (#6502)
- refactor(cli/unstable): make `ProgressBar.#print()` better readable (#6503)
- refactor(cli/unstable): replace `ProgressBar` `#options` property with actual
  properties (#6497)

#### @std/encoding 1.0.8 (patch)

- BREAKING(encoding/unstable): merge Base32Hex(Encoder|Decoder)Stream to
  Base32(Encoder|Decoder)Stream (#6452)
- BREAKING(encoding/unstable): merge base32 variations, add format option to
  encodeBase32 and decodeBase32 (#6471)
- BREAKING(encoding/unstable): merge Base64Url(Encoder|Decoder)Stream to
  Base64(Encoder|Decoder)Stream (#6451)
- feat(encoding/unstable): add options argument to hex streaming & performance
  (#6453)
- feat(encoding/unstable): add encode/decodeRawHex and rewrite underlying code
  (#6480)
- feat(encoding/unstable): add format option to encodeBase64 and decodeBase64
  (#6457)
- fix(encoding): decoding base64 with invalid bytes >= 128 (#6477)
- fix(encoding/unstable): encodeBase32 missing default option for format (#6476)
- perf(encoding): improve hex encode/decode performance (#6499)
- perf(encoding): improve base32 encode/decode performance (#6479)
- perf(encoding): improve base64 encode/decode performance (#6461)
- refactor(encoding): align error messages (#6504)
- chore(encoding): extract streaming textEncoder/Decoder (#6505)
- chore(encoding): remove reductant JSDoc in base64 stream (#6478)

#### @std/expect 1.0.14 (patch)

- fix(assert,expect,internal,testing): improve handling of escaped chars in
  diff_str (#6485)

#### @std/front-matter 1.0.9 (patch)

- fix(front-matter): handle BOM when recognizing format (#6507)
- fix(front-matter): handle empty frontMatter data (#6481)
- refactor(front-matter): inline `recognize()` (#6466)
- test(front-matter): simplify asserts (#6475)
- test(front-matter): remove double tests in `any_test.ts` (#6474)
- test(front-matter): inline test data (#6465)

#### @std/fs 1.0.15 (patch)

- feat(fs/unstable): add makeTempFile and makeTempFileSync (#6469)
- feat(fs/unstable): add writeTextFile and writeTextFileSync (#6463)
- feat(fs/unstable): add writeFile and writeFileSync (#6444)

#### @std/ini 1.0.0-rc.6 (prerelease)

- refactor(ini): limit INI value type to possible allowed INI values. (#6495)

#### @std/internal 1.0.6 (patch)

- fix(assert,expect,internal,testing): improve handling of escaped chars in
  diff_str (#6485)

#### @std/testing 1.0.10 (patch)

- fix(assert,expect,internal,testing): improve handling of escaped chars in
  diff_str (#6485)

#### @std/text 1.0.12 (patch)

- feat(text/unstable): add dedent (#6500)

#### @std/toml 1.0.3 (patch)

- fix(toml): handle hexadecimal, octal, and binary numbers (#6496)
- test(toml): inline test data (#6473)

#### @std/uuid 1.0.6 (patch)

- feat(uuid/unstable): implement support for UUID V6 (#6415)

#### @std/webgpu 0.224.8 (patch)

- chore(webgpu): ignore createTextureWithData() test case on windows (#6493)

### 2025.03.04

#### @std/async 1.0.11 (patch)

- test(async/unstable): add `retry()` tests (#6423)
- test(async): fix flaky `pooledMap()` test (#6412)
- test(async/unstable): fix flaky `waitFor()` test (#6413)

#### @std/cli 1.0.14 (patch)

- fix(cli/unstable): update interval in ProgressBar (#6402)
- refactor(cli/unstable): clean up `start` end `stop` methods of `Spinner`, add
  test cases for multiple start/stop calls (#6420)
- test(cli): fix flaky spinner test (#6404)
- test(cli/unstable): make `ProgressBar` tests run faster (#6411)

#### @std/fmt 1.0.6 (patch)

- docs(fmt): fix `printf` module doc (#6424)

#### @std/front-matter 1.0.8 (patch)

- perf(front-matter): remove regexp `m` flags, reduce unnecessary string
  operations (#6393)
- refactor(front-matter): cleanup `_shared.ts` (#6418)

#### @std/fs 1.0.14 (patch)

- feat(fs/unstable): add `remove` and `removeSync` api. (#6438)
- feat(fs/unstable): add umask (#6454)
- feat(fs/unstable): add utime and utimeSync (#6446)
- feat(fs/unstable): add mkdir and mkdirSync (#6436)
- feat(fs/unstable): add `copyFile` and `copyFileSync` (#6425)
- feat(fs/unstable): add truncate and truncateSync (#6416)
- feat(fs/unstable): add readTextFileSync and readTextFile (#6405)
- fix(fs/unstable): fix node.js test runner, fix readTextFile and copyFile in
  Node.js (#6441)
- test(fs/unstable): remove windows specific paths and fix ci (#6448)
- test(fs/unstable): add test case for reading text file with BOM (#6431)

#### @std/tar 0.1.6 (patch)

- BREAKING(tar/unstable): fix handling of mode, uid, and gid (#6440)

#### @std/text 1.0.11 (patch)

- feat(text/unstable): add `reverse` function (#6410)

#### @std/uuid 1.0.5 (patch)

- fix(uuid): handle `rng` correctly in uuid v1 (#6432)

### 2025.02.14a

#### @std/front-matter 1.0.7 (patch)

- refactor(front-matter): use relative path for importing module in the same
  package (#6401)

#### @std/fs 1.0.13 (patch)

- docs(fs): add missing docs (#6400)

### 2025.02.14

#### @std/cli 1.0.13 (patch)

- feat(cli/unstable): introduce `new ProgressBar()` & `new ProgressBarStream()`
  (#6378)

#### @std/front-matter 1.0.6 (patch)

- refactor(front-matter): call `extract()` functions in `any.ts` (#6390)

#### @std/fs 1.0.12 (patch)

- feat(fs/unstable): add renameSync (#6396)
- feat(fs/unstable): add readFile and readFileSync (#6394)
- feat(fs/unstable): add makeTempDir and makeTempDirSync (#6391)
- feat(fs/unstable): add rename (#6379)

#### @std/semver 1.0.4 (patch)

- refactor(semver): clean up `parseRange`, add missing tests (#6362)

### 2025.01.31

#### @std/bytes 1.0.5 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/cli 1.0.12 (patch)

- feat(cli/unstable): support stderr on spinner (#6350)

#### @std/crypto 1.0.4 (patch)

- docs(crypto): clarify doc comment (#6368)
- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/encoding 1.0.7 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/expect 1.0.13 (patch)

- test(expect): check error message of `.toBeCloseTo()` (#6296)

#### @std/fmt 1.0.5 (patch)

- fix(fmt): make printf working with colors. (#6360)

#### @std/fs 1.0.11 (patch)

- feat(fs/unstable): add readLink and readLinkSync (#6373)
- feat(fs/unstable): add link and linkSync (#6369)
- feat(fs/unstable): add realPath and realPathSync (#6366)

#### @std/http 1.0.13 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/io 0.225.2 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/log 0.224.14 (patch)

- docs(log): mention potential deprecation of @std/log (#6364)

#### @std/msgpack 1.0.3 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/streams 1.0.9 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

#### @std/tar 0.1.5 (patch)

- refactor(bytes,crypto,encoding,http,io,msgpack,streams,tar): make Uint8Array
  usages compatible with TS 5.7 (#6372)

### 2025.01.22

#### @std/assert 1.0.11 (patch)

- fix(assert): handle `__proto__` correctly in `assertObjectMatch` (#6342)

#### @std/async 1.0.10 (patch)

- feat(async/unstable): add `waitFor` function to wait for condition to be true
  (#6230)

#### @std/cbor 0.1.6 (patch)

- fix(cbor): incorrect decoding with subarrays (#6344)

#### @std/cli 1.0.11 (patch)

- fix(cli): handle overflow in `promptSecret` (#6318)

#### @std/collections 1.0.10 (patch)

- docs(collections): add the word "unique" to `distinctBy` JSDoc for grepping
  purposes (#6336)

#### @std/csv 1.0.5 (patch)

- test(csv): unstable stringify tests (#6337)

#### @std/expect 1.0.12 (patch)

- docs(expect): fix typo on objectContaining example (#6357)

#### @std/fs 1.0.10 (patch)

- feat(fs/unstable): add symlink and symlinkSync (#6352)
- feat(fs/unstable): add chmod and chmodSync (#6343)
- feat(fs/unstable): add readDir (#6338)

#### @std/io 0.225.1 (patch)

- fix(io): fix readAllSync for the case when read source is slow (#6355)

### 2025.01.10

#### @std/cbor 0.1.5 (patch)

- perf(cbor): improve decodeCbor & decodeCborSequence performance (#6323)
- perf(cbor): encodeCbor & encodeCborSequence (#6311)

#### @std/cli 1.0.10 (patch)

- docs(cli): add examples of parseArgs (#6283)

#### @std/data-structures 1.0.6 (patch)

- fix(data-structures): ensure size consistency in RedBlackTree.from (#6307)

#### @std/datetime 0.225.3 (patch)

- fix(datetime): correct parsing of day period (#6313)
- docs(datetime): remove outdated mention of `utc` option (#6301)

#### @std/expect 1.0.11 (patch)

- fix(expect): consistent `toBeCloseTo` assertion messages (#6291)
- docs(expect,text): remove no-eval directives that appear to be unnecessary
  (#6333)
- docs(expect): correct minor typo (#6329)
- docs(expect): clarify the tolerance in `toBeCloseTo` (#6292)

#### @std/fmt 1.0.4 (patch)

- fix(fmt): add correct pluralization to fmt/duration when using style: full
  (#6295)
- refactor(fmt): cleanup duration `format()` and utils (#6309)
- test(fmt): add invalid duration `style` option test (#6310)

#### @std/fs 1.0.9 (patch)

- feat(fs/unstable): add statSync and lstatSync (#6300)
- test(fs): do not write files in source tree during test (#6236)

#### @std/log 0.224.13 (patch)

- test(log): re-enable doc tests for `FileHandler` (#6321)

#### @std/testing 1.0.9 (patch)

- docs(testing): clarify beforeAll in describe vs. outside (#6294)

#### @std/text 1.0.10 (patch)

- docs(expect,text): remove no-eval directives that appear to be unnecessary
  (#6333)

### 2024.12.20

#### @std/fs 1.0.8 (patch)

- feat(fs/unstable): add `fs.lstat` (#6276)

#### @std/testing 1.0.8 (patch)

- feat(testing/unstable): add API for configuring global sanitizer state (#6282)

### 2024.12.18

#### @std/assert 1.0.10 (patch)

- fix(assert): fix formatting for `assertNotEquals` error messages (#6246)

#### @std/cbor 0.1.4 (patch)

- feat(cbor): add encoding/decoding for `new Map()` instance (#6252)

#### @std/cli 1.0.9 (patch)

- feat(cli/unstable): add `promptMultipleSelect()` (#6223)
- fix(cli/unstable): `promptMultipleSelect()` add `isTerminal()` check (#6263)
- fix(cli/unstable): `promptSelect()` add `isTerminal()` check (#6264)
- docs(cli): remove `parseArgs()` console logs from examples (#6268)
- test(cli): add `promptSecret()` empty mask option test (#6273)
- test(cli/unstable): add `promptSelect()` ETX test (#6267)
- test(cli/unstable): add `promptMultipleSelect()` ETX test (#6266)
- test(cli): add tests for `promptSecret()` (#6256)
- test(cli/unstable): clean up `promptSelect()` tests (#6253)
- test(cli/unstable): rewrite `Spinner` tests using stub (#6254)

#### @std/data-structures 1.0.5 (patch)

- fix(data-structures): ensure size consistency in BinarySearchTree.from (#6272)

#### @std/encoding 1.0.6 (patch)

- feat(encoding/unstable): Crockford base32 unstable support (#6238)

#### @std/expect 1.0.10 (patch)

- fix(expect): fix `expect.arrayContaining` bug (#6271)
- fix(expect): always show custom message (#6217)
- docs(expect): suggest using top-level code instead of beforeAll (#6240)

#### @std/fs 1.0.7 (patch)

- feat(fs/unstable): add `fs.stat` (#6258)
- docs(fs/unstable): use `stat` function in `stat` example (#6275)

#### @std/log 0.224.12 (patch)

- docs(log): fix level name assertion in LogRecord example (#6269)

#### @std/regexp 1.0.1 (patch)

- fix(regexp): escape leading digit (#6208)

#### @std/testing 1.0.7 (patch)

- fix(testing): stop code execution in `describe.ignore` (#6237)

### 2024.12.06

#### @std/assert 1.0.9 (patch)

- docs(assert): note the thrown diff in object_match.ts (#6227)
- docs(assert): fix English in mod.ts (#6226)
- docs(assert): add note and example for Blob comparison (#6210)

#### @std/cbor 0.1.3 (patch)

- perf(cbor): for encoding numbers, bigints, and dates (#6214)

#### @std/cli 1.0.8 (patch)

- feat(cli/unstable): export `/unstable-prompt-select` (#6212)
- fix(cli/unstable): hide cursor while showing the selection with
  `promptSelect()` (#6221)
- refactor(cli): rewrite `promptSelect()` clear commands (#6215)

#### @std/dotenv 0.225.3 (patch)

- fix(dotenv): handle multiline variables on Windows (#6216)

#### @std/expect 1.0.9 (patch)

- fix(expect): fix error messages for `toMatchObject` (#6228)

#### @std/http 1.0.12 (patch)

- BREAKING(http/unstable): switch `params` and `info` args in `Handler` in
  `route()` for more conveniency (#6094)
- fix(http): handle HEAD requests in serveFile (#6218)

#### @std/testing 1.0.6 (patch)

- fix(testing): add missing methods to `test` alias of `it` (#6222)

#### @std/text 1.0.9 (patch)

- fix(text): use locale-independent letter case methods (#6204)

### 2024.11.25

#### @std/cli 1.0.7 (patch)

- feat(cli/unstable): add `promptSelect()` (#6190)

#### @std/tar 0.1.4 (patch)

- fix(tar): untar checksum calculation for the pax format (#6199)

### 2024.11.22

#### @std/archive

- BREAKING(archive): remove std/archive package (#6185)

#### @std/async 1.0.9 (patch)

- feat(async/unstable): add `isRetriable` option to `retry` (#6197)

#### @std/csv 1.0.4 (patch)

- feat(csv/unstable): infer column names from object arrays for stringify()
  (#6122)

#### @std/fs 1.0.6 (patch)

- fix(fs): improve the docs and error message of `ensureSymlink(Sync)` (#6198)

#### @std/http 1.0.11 (patch)

- fix(http): disable XSS in directory index page of file-server (CVE-2024-52793)
  https://github.com/denoland/std/security/advisories/GHSA-32fx-h446-h8pf

#### @std/log 0.224.11 (patch)

- chore(log): do not exec file handler examples in CI (#6183)

#### @std/toml 1.0.2 (patch)

- fix(toml): parsing positive time zone offset (#6188)

### 2024.11.13

#### @std/assert 1.0.8 (patch)

- fix(assert): check property equality up the prototype chain (#6153)

#### @std/bytes 1.0.4 (patch)

- test(bytes): fix typo in test description (#6179)

#### @std/expect 1.0.8 (patch)

- fix(expect): support `expect.addSnapshotSerializer` (#6173)

#### @std/http 1.0.10 (patch)

- fix(http): do not serve dot files when `showDotfiles=false` (#6180)

#### @std/ini 1.0.0-rc.5 (prerelease)

- BREAKING(ini): parse understands booleans, undefined, null and numbers (#6121)

#### @std/log 0.224.10 (patch)

- docs(log): improve logger.ts docs (#6176)
- docs(log): document FileHandler (#6175)

#### @std/media-types 1.1.0 (minor)

- feat(media-types): update media-types from latest mime-db (#6169)

#### @std/testing 1.0.5 (patch)

- docs(testing): fix typo in snapshot.ts (#6171)

### 2024.11.01

#### @std/assert 1.0.7 (patch)

- fix(assert): fix assertion error message of isError (#6147)
- test(assert): change inert comments to @ts-expect-error directives (#6162)

#### @std/async 1.0.8 (patch)

- test(async): fix flakiness of throttle example (#6156)
- test(async/unstable): fix typo (#6149)

#### @std/bytes 1.0.3 (patch)

- test(bytes): document the cases being tested for equals/startsWith/endsWith
  (#6163)

#### @std/expect 1.0.7 (patch)

- fix(expect): re-align `expect.toMatchObject` api (#6160)
- fix(expect): support
  expect.not.{arrayContaining,objectContaining,stringContaining,stringMatching}
  (#6138)
- fix(expect,internal,testing): support `expect.assertions` (#6032)

#### @std/internal 1.0.5 (patch)

- fix(expect,internal,testing): support `expect.assertions` (#6032)

#### @std/path 1.0.8 (patch)

- refactor(path): always name the parameters (add param definition check in doc
  linter) (#6158)

#### @std/streams 1.0.8 (patch)

- docs(streams): rest arguments not being asserted in docs (#6155)

#### @std/testing 1.0.4 (patch)

- feat(testing/unstable): support for stubbing properties (#6128)
- feat(testing/unstable): add type test for mutual assignability (#6154)
- fix(expect,internal,testing): support `expect.assertions` (#6032)

### 2024.10.24

#### @std/async 1.0.7 (patch)

- feat(async/unstable): add `throttle()` function (#6110)

#### @std/cbor 0.1.2 (patch)

- refactor(cbor): replace `toByteStream` function in common with import from
  `@std/streams` (#6107)
- test(cbor): number precision error in decoding test (#6115)
- test(cbor): empty string being excluded from expected result (#6106)

#### @std/collections 1.0.9 (patch)

- feat(collections/unstable): support `Iterable` argument in `slidingWindows`
  (#6095)

#### @std/expect 1.0.6 (patch)

- fix(expect): support `expect.objectContaining` (#6065)

#### @std/fmt 1.0.3 (patch)

- docs(fmt): fix %f width typo in printf docs (#6139)
- test(fmt): handle missing group separator for 1000.1 in some locales (#6117)

#### @std/fs 1.0.5 (patch)

- refactor(fs): fix uncaught errors in browsers (#6135)

#### @std/http 1.0.9 (patch)

- fix(http): fix tablet and smarttv in Device.type literal types (#6129)

#### @std/json 1.0.1 (patch)

- refactor(json): fix typo (#6103)

#### @std/path 1.0.7 (patch)

- docs(path): re-add URL examples to `@std/path/posix` examples (#6105)

#### @std/tar 0.1.3 (patch)

- docs(tar): fix example in creating directories (#6113)

#### @std/text 1.0.8 (patch)

- feat(text/unstable): handle non-Latin-script text in `slugify` (#6012)

### 2024.10.10a

#### @std/cbor 0.1.1 (patch)

- fix(cbor): fix module specifier in import (#6099)

### 2024.10.10

#### @std/async 1.0.6 (patch)

- feat(async/unstable): accept iterator varargs in `MuxAsyncIterator` (#6087)
- chore(async/unstable): fix typo (#6096)

#### @std/cbor 0.1.0 (minor)

- feat(cbor/unstable): introduce `@std/cbor` (#5909)

#### @std/collections 1.0.8 (patch)

- feat(collections/unstable): support `Iterable` argument in `takeLastWhile()`
  (#6090)
- feat(collections/unstable): support `Iterable` argument in `dropWhile()`
  (#6088)
- feat(collections/unstable): support `Iterable` argument in `intersect()`
  (#6036)
- feat(collections/unstable): support `Iterable` argument in `dropLastWhile()`
  (#6076)
- test(collections): add tests for `filterInPlace()` util (#6089)

#### @std/expect 1.0.5 (patch)

- fix(expect): register extended matchers after native matchers (#6075)

#### @std/http 1.0.8 (patch)

- docs(http/unstable): add example for multiple request methods on route (#6045)

#### @std/io 0.225.0 (minor)

- BREAKING(io): remove `StringReader` (#6062)
- BREAKING(io): remove `StringWriter` (#6061)
- BREAKING(io): remove `MultiReader` (#6059)
- BREAKING(io): remove `LimitedReader` (#6058)
- BREAKING(io): remove `readDelim()` (#6052)
- BREAKING(io): remove `BufWriter` (#6057)
- BREAKING(io): remove `BufReader` (#6056)
- BREAKING(io): remove `readShort()` (#6050)
- BREAKING(io): remove `readInt()` (#6048)
- BREAKING(io): remove `readLong()` (#6047)
- BREAKING(io/unstable): remove `readStringDelim()` (#6001)
- BREAKING(io): remove `readRange[Sync]()` (#6049)
- BREAKING(io/unstable): remove `sliceLongToBytes()` (#6005)
- BREAKING(io/unstable): remove `copyN()` (#5999)
- BREAKING(io): remove `readLines()` (#5991)

#### @std/log 0.224.9 (patch)

- fix(log): remove leaky `Logger.prototype.asString()` method (#6082)
- fix(log): remove leaky `ConsoleHandler.prototype.applyColors()` (#6072)
- fix(log): ensure consistent behavior with `@std/log` (#5974)
- docs(log): document `getLogger()` and `Logger` (#6084)
- docs(log): document `ConsoleHandler` (#6071)
- docs(log): document `formatters` module (#6073)
- docs(log): correct the examples of `debug()` (#6077)
- docs(log): document `BaseHandler` (#6067)
- docs(log): document pass-through functions (#6066)

#### @std/streams 1.0.7 (patch)

- feat(streams/unstable): `toByteStream()` (#6046)

#### @std/tar 0.1.2 (patch)

- fix(tar): ignore non-tar file portion of a stream in `UntarStream` (#6064)

### 2024.09.24

#### @std/archive 0.225.4 (patch)

- deprecation(archive/unstable): deprecate `@std/archive` (#5988)
- docs(archive): clarify deprecation notices (#6034)
- docs(archive): update `@std/archive` deprecation notices (#6028)
- docs(archive,log,testing): correct typos (#5995)

#### @std/assert 1.0.6 (patch)

- fix(assert): accept abstract classes (#5978)

#### @std/collections 1.0.7 (patch)

- feat(collections/unstable): support `Iterable` argument in `sample()` (#6035)
- feat(collections/unstable): support Iterable argument in `withoutAll()`
  (#6031)
- feat(collections/unstable): `Iterable` argument in `chunk()` (#5925)
- feat(collections/unstable): support iterators in `sortBy()` (#5919)
- feat(collections/unstable): support `Iterable` argument in `takeWhile()`
  (#5911)

#### @std/expect 1.0.4 (patch)

- fix(expect): support `expect.hasAssertions()` (#5901)

#### @std/fs 1.0.4 (patch)

- docs(fs): clarify permissions requirements for `exists[Sync]()` (#5983)

#### @std/http 1.0.7 (patch)

- feat(http/unstable): add support for multiple request methods on route (#6003)
- fix(http): make `file-server` work on Deno Deploy (#6033)
- fix(http): use non-locale-sensitive string methods for comparison (#6029)

#### @std/internal 1.0.4 (patch)

- chore: bump to internal@1.0.4 (#6020)

#### @std/io 0.224.9 (patch)

- deprecation(io): deprecate `BufWriter` (#6041)
- deprecation(io/unstable): deprecate `BufReader` (#6027)
- deprecation(io/unstable): deprecate `StringWriter` (#6026)
- deprecation(io/unstable): deprecate `StringReader` (#6025)
- deprecation(io/unstable): deprecate `LimitedReader` (#6024)
- deprecation(io/unstable): deprecate `MultiReader` (#6023)
- deprecation(io/unstable): deprecate `readDelim()` (#6022)
- deprecation(io/unstable): deprecate `readLong()` (#6007)
- deprecation(io/unstable): deprecate `readRange()` (#6010)
- deprecation(io/unstable): deprecate `readInt()` (#6009)
- deprecation(io/unstable): deprecate `readShort()` (#6008)
- deprecation(io/unstable): deprecate `sliceLongToBytes()` (#6002)
- deprecation(io/unstable): deprecate `readStringDelim()` (#6000)
- deprecation(io/unstable): deprecate `copyN()` (#5992)
- deprecation(io/unstable): deprecate `readLines()` (#5990)
- docs(io): update deprecation notices (#6021)

#### @std/log 0.224.8 (patch)

- docs(log): document `warn` module (#5973)
- docs(archive,log,testing): correct typos (#5995)

#### @std/streams 1.0.6 (patch)

- feat(streams/unstable): `toBytes()` (#6011)

#### @std/testing 1.0.3 (patch)

- docs(archive,log,testing): correct typos (#5995)
- docs(testing): fix typo in snapshot (#5994)

#### @std/text 1.0.7 (patch)

- fix(text): handle code points > U+FFFF in `levenshteinDistance` (#6014)

### 2024.09.16

#### @std/cache 0.1.3 (patch)

- fix(cache,data-structures): add missing non-null assertion and `override`
  keyword (#5981)

#### @std/data-structures 1.0.4 (patch)

- fix(cache,data-structures): add missing non-null assertion and `override`
  keyword (#5981)

#### @std/tar 0.1.1 (patch)

- fix(tar): update to `0.1.1` (#5980)

### 2024.09.12a

#### @std/net 1.0.4 (patch)

- chore(net): add back `get-network-address` module to fix
  `http@1.0.5/file-server` (#5970)

#### @std/path 1.0.6 (patch)

- docs(path): add note about `unstable-join` (#5967)

### 2024.09.12

#### @std/archive 0.225.3 (patch)

- refactor(archive,io): use `Seeker[Sync]` from `@std/io/types` (#5943)

#### @std/assert 1.0.5 (patch)

- BREAKING(assert/unstable): move unstable `assertNever` under
  `@std/assert/unstable-never` (#5928)
- fix(assert): value-equal complex keys (#5914)
- perf(assert): add fast path for primitive keyed collections in `equal()`
  (#5913)
- refactor(assert,expect): import internal APIs from more specific paths (#5923)
- refactor(assert): remove unnecessary `getValFromKeyedCollection()` (#5921)

#### @std/cli 1.0.6 (patch)

- BREAKING(cli/unstable): move `spinner` module to `unstable-spinner` (#5946)

#### @std/collections 1.0.6 (patch)

- fix(collections): ensure `pick` doesn't generate missing properties as
  `undefined` (#5926)

#### @std/data-structures 1.0.3 (patch)

- BREAKING(data-structures/unstable): move `bidirectional-map` module to
  `unstable-bidirectional-map` (#5947)
- feat(data-structures/unstable): `@std/data-structures/bidirectional-map`
  (#5910)

#### @std/encoding 1.0.5 (patch)

- BREAKING(encoding/unstable): move `base64url-stream` module to
  `unstable-base64url-stream` (#5959)
- BREAKING(encoding/unstable): move `base32hex` module to `unstable-base32hex`
  (#5961)
- BREAKING(encoding/unstable): move `hex-stream` module to `unstable-hex-stream`
  (#5960)
- BREAKING(encoding/unstable): move `base64-stream` module to
  `unstable-base64-stream` (#5958)
- BREAKING(encoding/unstable): move `base32hex-stream` module to
  `unstable-base32hex-stream` (#5956)
- BREAKING(encoding/unstable): move `base32-stream` module to
  `unstable-base32-stream` (#5955)

#### @std/expect 1.0.3 (patch)

- fix(expect): value-equal complex keys in `expect.equal()` (#5936)
- perf(expect): add fast path for primitive keyed collections in `equal()`
  (#5934)
- refactor(assert,expect): import internal APIs from more specific paths (#5923)

#### @std/front-matter 1.0.5 (patch)

- BREAKING(front-matter/unstable): move unstable overload of yaml `extract` to
  `unstable-yaml` (#5968)

#### @std/html 1.0.3 (patch)

- BREAKING(html/unstable): move `is-valid-custom-element-name` module to
  `unstable-is-valid-custom-element-name` (#5948)

#### @std/http 1.0.6 (patch)

- BREAKING(http/unstable): move `route` to `./unstable-route` (#5939)
- BREAKING(http/unstable): move unstable APIs (`header`, `method`,
  `signed-cookie`) (#5938)
- fix(http): invalid ipv6 hostname printed to console (#5924)
- fix(http): show hostname as 'localhost' for 0.0.0.0 on windows (#5918)
- refactor(http): inline `serveFallback()` util (#5917)

#### @std/io 0.224.8 (patch)

- feat(io): add `Seeker[Sync]` interfaces (#5930)
- refactor(archive,io): use `Seeker[Sync]` from `@std/io/types` (#5943)

#### @std/net 1.0.3 (patch)

- BREAKING(net/unstable): move `get-network-address` module to
  `unstable-get-network-address` (#5949)
- fix(net): skip empty mac address for `getNetworkAddress()` (#5941)
- test(net): add test of `getNetworkAddress()` (#5963)

#### @std/path 1.0.5 (patch)

- BREAKING(path/unstable): move unstable overload of `normalize` to
  `unstable-normalize` (#5965)
- BREAKING(path/unstable): move unstable overload of `join` to `unstable-join`
  (#5964)
- BREAKING(path/unstable): move unstable overload of `extname` to
  `unstable-extname` (#5962)
- BREAKING(path/unstable): move unstable overload of `basename` to
  `unstable-basename` (#5957)
- BREAKING(path/unstable): move unstable overload of `dirname` to
  `unstable-dirname` (#5954)

#### @std/random 0.1.0 (minor)

- feat(random/unstable): basic randomization functions (#5626)

#### @std/streams 1.0.5 (patch)

- BREAKING(streams/unstable): move `fixed-chunk-stream` module to
  `unstable-fixed-chunk-stream` (#5951)
- BREAKING(streams/unstable): move `to-lines` module to `unstable-to-lines`
  (#5950)

#### @std/text 1.0.6 (patch)

- BREAKING(text/unstable): move `slugify` module to `unstable-slugify` (#5953)
- BREAKING(text/unstable): move `to-constant-case` module to
  `unstable-to-constant-case` (#5952)

#### @std/url

- BREAKING(url): remove @std/url (#5931)

#### @std/uuid 1.0.4 (patch)

- BREAKING(uuid/unstable): move UUID v7 APIs to `./unstable-v7` (#5937)

### 2024.09.04

#### @std/archive 0.225.2 (patch)

- feat(archive): `UntarStream` and `TarStream` (#4548)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/assert 1.0.4 (patch)

- refactor(assert,datetime,fmt,io,streams): consistently `throw new Error()`
  instead of `throw Error()` (#5855)

#### @std/async 1.0.5 (patch)

- fix(async,csv,fmt): assign default value when `undefined` is passed (#5893)
- docs(async): add note about `deadline()` `DOMException` name of `TimeoutError`
  (#5833)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/cache 0.1.2 (patch)

- fix(cache/unstable): fix flaky fibonacci test (#5872)
- docs(cache): document valid range information for TTL values (#5834)

#### @std/cli 1.0.5 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/csv 1.0.3 (patch)

- fix(async,csv,fmt): assign default value when `undefined` is passed (#5893)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/datetime 0.225.2 (patch)

- refactor(assert,datetime,fmt,io,streams): consistently `throw new Error()`
  instead of `throw Error()` (#5855)

#### @std/dotenv 0.225.2 (patch)

- fix(dotenv): handle single-quotes in values in `stringify()` (#5846)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/encoding 1.0.4 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/expect 1.0.2 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)
- refactor(expect): align error messages in the matchers (#5835)

#### @std/fmt 1.0.2 (patch)

- fix(async,csv,fmt): assign default value when `undefined` is passed (#5893)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)
- refactor(assert,datetime,fmt,io,streams): consistently `throw new Error()`
  instead of `throw Error()` (#5855)

#### @std/front-matter 1.0.4 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/fs 1.0.3 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/http 1.0.5 (patch)

- fix(http): less restrictive arguments for `accepts*()` functions (#5850)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/internal 1.0.3 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/io 0.224.7 (patch)

- fix(io): don't use `Deno.Buffer` in examples (#5889)
- refactor(assert,datetime,fmt,io,streams): consistently `throw new Error()`
  instead of `throw Error()` (#5855)

#### @std/log 0.224.7 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/msgpack 1.0.2 (patch)

- fix(msgpack): accept readonly input data in `encode()` (#5832)

#### @std/net 1.0.2 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/path 1.0.4 (patch)

- feat(path/unstable): support file `URL` arg in `normalize()` (#5902)
- feat(path/unstable): support `URL` as 1st arg of `basename()` (#5900)
- feat(path/unstable): support `URL` in first arg of `join()` (#5863)
- fix(path/unstable): support `string | URL` in the 2nd overload of `basename`,
  `dirname`, and `extname` (#5904)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)
- refactor(path): make `isWindows` check compatible with Node and Bun (#4961)

#### @std/semver 1.0.3 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/streams 1.0.4 (patch)

- refactor(assert,datetime,fmt,io,streams): consistently `throw new Error()`
  instead of `throw Error()` (#5855)

#### @std/tar 0.1.0 (minor)

- feat(tar/unstable): `@std/tar` (#5905)

#### @std/testing 1.0.2 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/text 1.0.5 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/url 0.225.1 (patch)

- docs(url): update deprecation docs (#5907)

#### @std/uuid 1.0.3 (patch)

- feat(uuid/unstable): `@std/uuid/v7` (#5887)

#### @std/webgpu 0.224.7 (patch)

- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)

#### @std/yaml 1.0.5 (patch)

- fix(yaml): handle string instances (#5897)
- fix(yaml): handle Boolean instances correctly (#5894)
- fix(yaml): handle integer number instances (#5895)
- fix(yaml): handle float number instances (#5896)
- fix(yaml): fix `sortKey` error message (#5873)
- refactor(archive,async,cli,csv,dotenv,encoding,expect,fmt,front-matter,fs,http,internal,log,net,path,semver,testing,text,webgpu,yaml):
  enable `"exactOptionalPropertyTypes"` option (#5892)
- refactor(yaml): switch array test (#5898)
- refactor(yaml): simplify `stringifyBlockMapping()` (#5885)
- refactor(yaml): cleanup utility functions (#5886)
- refactor(yaml): cleanup str type (#5879)
- refactor(yaml): simplify seq type (#5878)
- refactor(yaml): simplify merge type (#5877)
- refactor(yaml): simplify set type (#5867)
- refactor(yaml): simplify regexp type (#5860)
- refactor(yaml): move `duplicate` and `duplicateIndex` (#5836)
- refactor(yaml): inline `composeNode()` (#5861)
- refactor(yaml): simplify `resolve()` for pairs (#5852)
- refactor(yaml): simplify null type (#5858)
- refactor(yaml): simplify boolean type (#5859)
- refactor(yaml): inline `readAlias()` (#5856)
- refactor(yaml): inline `readAnchorProperty()` (#5853)
- refactor(yaml): simplify omap `resolve()` (#5843)
- refactor(yaml): simplify pair `construct()` function (#5844)
- refactor(yaml): inline `readTagProperty()` (#5849)
- refactor(yaml): replace `getObjectTypeString()` with `isPlainObject()` (#5842)
- refactor(yaml): inline `readBlockMapping()` (#5847)
- refactor(yaml): inline `readBlockScalar()` (#5841)
- refactor(yaml): inline `readFlowCollection()` (#5840)
- refactor(yaml): change error message in `stringifyNode()` (#5839)
- refactor(yaml): inline `readDoubleQuotedScalar()` (#5838)
- refactor(yaml): align additional error messages (#5806)
- refactor(yaml): move `isObject()` (#5823)
- refactor(yaml): inline `readSingleQuotedScalar()` (#5827)
- test(yaml): add invalid `represent` type test (#5874)
- test(yaml): add positive timezone timestamp test (#5881)
- test(yaml): add int type tests (#5868)
- test(yaml): add set type test (#5866)
- test(yaml): add regexp type tests (#5862)
- test(yaml): add duplicate binary references test (#5837)
- test(yaml): add undefined array entry with `skipInvalid` and `flowLevel`
  options test (#5828)
- test(yaml): add duplicate array reference test (#5825)
- test(yaml): add undefined object entry with skipInvalid and flowLevel option
  test (#5829)
- chore(yaml): fix typo in inline comment (#5845)

### 2024.08.26

#### @std/archive 0.225.1 (patch)

- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- docs(archive): complete documentation (#5636)
- refactor(archive,cache,datetime,fmt,front-matter): align error messages to the
  style guide (#5706)

#### @std/assert 1.0.3 (patch)

- feat(assert/unstable): add `assertNever` (#5690)
- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- docs(assert): add additional example in assertObjectMatch docs (#5703)

#### @std/async 1.0.4 (patch)

- refactor(async): align the error messages to the style guide (#5758)
- chore(async): add browser-compat declarations (#5730)

#### @std/cache 0.1.1 (patch)

- feat(cache/unstable): `TtlCache` (#5662)
- docs(cache): tweak `LruCache` docs (#5790)
- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- refactor(archive,cache,datetime,fmt,front-matter): align error messages to the
  style guide (#5706)

#### @std/cli 1.0.4 (patch)

- perf(cli,http,ini,internal,media-types): replace `trim()` comparisons with
  regexps (#5751)
- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- docs(cli): align additional error messages (#5768)
- test(cli): reduce flakiness of Spinner test (#5821)

#### @std/crypto 1.0.3 (patch)

- refactor(toml,msgpack,crypto,data-structures): align the error messages to the
  style guide (#5705)
- refactor(crypto): remove old unused `_fnv` folder (#5716)

#### @std/csv 1.0.2 (patch)

- fix(csv): accept readonly cell/header data (#5734) (#5735)
- refactor(csv): align additional error messages (#5796)

#### @std/data-structures 1.0.2 (patch)

- refactor(toml,msgpack,crypto,data-structures): align the error messages to the
  style guide (#5705)

#### @std/datetime 0.225.1 (patch)

- docs(datetime): add constants to module docs (#5732)
- refactor(archive,cache,datetime,fmt,front-matter): align error messages to the
  style guide (#5706)

#### @std/dotenv 0.225.1 (patch)

- fix(dotenv): show warning when there is invalid key in `.env` file (#5745)

#### @std/encoding 1.0.3 (patch)

- feat(encoding/unstable): adds streaming versions for hex, base32, base32hex,
  base64 and base64url (#4915)
- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- refactor(encoding): align additional error messages (#5767)

#### @std/expect 1.0.1 (patch)

- docs(expect): correct `expect()` docs (#5788)
- refactor(expect): align additional error messages (#5811)

#### @std/fmt 1.0.1 (patch)

- refactor(archive,cache,datetime,fmt,front-matter): align error messages to the
  style guide (#5706)

#### @std/front-matter 1.0.3 (patch)

- feat(front-matter/unstable): add pass-through `ParseOptions` argument for YAML
  parser (#5748)
- fix(front-matter): remove os specific newline (#5752)
- fix(front-matter): allow whitespaces after the header (#5685)
- refactor(archive,cache,datetime,fmt,front-matter): align error messages to the
  style guide (#5706)
- test(front-matter): remove duplicate tests (#5808)

#### @std/fs 1.0.2 (patch)

- refactor(fs): align additional error messages (#5802)

#### @std/html 1.0.2 (patch)

- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)

#### @std/http 1.0.4 (patch)

- fix(http/unstable): match request method (#5772)
- perf(cli,http,ini,internal,media-types): replace `trim()` comparisons with
  regexps (#5751)
- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- refactor(http): align additional error messages (#5791)

#### @std/ini 1.0.0-rc.4 (prerelease)

- perf(cli,http,ini,internal,media-types): replace `trim()` comparisons with
  regexps (#5751)

#### @std/internal 1.0.2 (patch)

- perf(cli,http,ini,internal,media-types): replace `trim()` comparisons with
  regexps (#5751)
- refactor(internal): align additional error messages (#5766)

#### @std/io 0.224.6 (patch)

- refactor(io): create a style guide for error messages, align error messages to
  the style guide (#5671)

#### @std/jsonc 1.0.1 (patch)

- refactor(jsonc): align additional error messages (#5799)

#### @std/log 0.224.6 (patch)

- refactor(log): align additional error messages (#5801)
- refactor(log): make `BaseHandler` abstract (#5737)
- refactor(log): replace `protected` properties with `Symbol`s (#5724)

#### @std/media-types 1.0.3 (patch)

- perf(cli,http,ini,internal,media-types): replace `trim()` comparisons with
  regexps (#5751)
- refactor(media-types): align additional error messages (#5800)

#### @std/msgpack 1.0.1 (patch)

- refactor(toml,msgpack,crypto,data-structures): align the error messages to the
  style guide (#5705)

#### @std/net 1.0.1 (patch)

- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)

#### @std/path 1.0.3 (patch)

- feat(path/unstable): support `URL` in `extname()` (#5818)
- feat(path/unstable): support `URL` input in `dirname()` (#5747)
- refactor(path,streams): align additional error messages (#5718)

#### @std/semver 1.0.2 (patch)

- refactor(semver): align additional error messages (#5785)
- refactor(semver): unify param names (#5700)

#### @std/streams 1.0.3 (patch)

- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- refactor(path,streams): align additional error messages (#5718)

#### @std/testing 1.0.1 (patch)

- fix(testing): fix `IsExact` edge cases (#5676)
- refactor(testing): align additional error messages (#5810)

#### @std/text 1.0.4 (patch)

- docs(archive,assert,cache,cli,encoding,html,http,net,streams,text): remove
  unstable Markdown alert (#5672)
- docs(text): fix `slugify()` summary (#5722)
- test(text): move case tests to separate files (#5807)

#### @std/toml 1.0.1 (patch)

- refactor(toml,msgpack,crypto,data-structures): align the error messages to the
  style guide (#5705)

#### @std/uuid 1.0.2 (patch)

- refactor(uuid): align additional error messages (#5803)
- test(uuid): assert error message of `version()` (#5819)

#### @std/webgpu 0.224.6 (patch)

- refactor(webgpu): align additional error messages (#5754)

#### @std/yaml 1.0.4 (patch)

- refactor(yaml): use `isObject()` (#5822)
- refactor(yaml): cleanup `stringifyFlowMapping()` (#5743)
- refactor(yaml): cleanup `stringifyBlockSequence()` (#5742)
- refactor(yaml): cleanup `detectType()` (#5759)
- refactor(yaml): inline `readPlainScalar()` (#5813)
- refactor(yaml): move `getDuplicateReferences()` into `stringify()` (#5804)
- refactor(yaml): inline `writeFoldedLines()` (#5812)
- refactor(yaml): remove `Mark` class (#5805)
- refactor(yaml): inline `testDocumentSeparator()` (#5793)
- refactor(yaml): remove `any` types (#5782)
- refactor(yaml): remove `schema` property from `DumperState` (#5798)
- refactor(yaml): remove type mod file (#5795)
- refactor(yaml): inline `skipSeparationSpace()` (#5792)
- refactor(yaml): inline `readLineBreak()` (#5783)
- refactor(yaml): inline `storeMappingPair()` (#5779)
- refactor(yaml): remove `storeMappingPair()` result `null` type (#5781)
- refactor(yaml): inline `mergeMappings()` (#5777)
- refactor(yaml): use `Set` in `inspectNode()` (#5778)
- refactor(yaml): inline `readBlockSequence()` (#5776)
- refactor(yaml): inline `captureSegment()` (#5775)
- refactor(yaml): inline `tagDirectiveHandler()` (#5771)
- refactor(yaml): cleanup `stringifyFlowSequence()` (#5744)
- refactor(yaml): change `styleMap` type to `Map` (#5760)
- refactor(yaml): inline `yamlDirectiveHandler()` (#5763)
- refactor(yaml): remove `ResultType` (#5765)
- refactor(yaml): remove `ArrayObject` (#5761)
- refactor(yaml): add `BOM` constant (#5764)
- refactor(yaml): move options to options object (#5740)
- refactor(yaml): replace `chooseScalarType()` callback with `implicitTypes`
  argument (#5750)
- refactor(yaml): remove variable underscore (#5741)
- refactor(yaml): rename `DumperState` methods (#5738)
- refactor(yaml): remove `dump` property (#5683)
- refactor(yaml): remove `tag` property (#5689)
- refactor(yaml): cleanup `Schema` (#5715)
- refactor(yaml): use `Map`s for `TypeMap` (#5694)
- refactor(yaml): add `stringify()` method to `DumperState` (#5707)
- refactor(yaml): boolean constants (#5699)
- refactor(yaml): use `Set` for `overridableKeys` (#5697)
- refactor(yaml): use `Map` for `tagMap` and `anchorMap` (#5696)
- refactor(yaml): redefine `include` as optional `Schema` (#5693)
- refactor(yaml): remove `schema` property (#5692)
- refactor(yaml): make `version` property required (#5691)
- test(yaml): add `undefined` array entry test with `skipInvalid` option (#5814)
- test(yaml): add `condenseFlow()` test (#5780)
- test(yaml): add test for deprecated boolean syntax (#5713)
- test(yaml): add edge case test for `stringify` (#5704)

### 2024.08.16

#### @std/cache 0.1.0 (minor)

- feat(cache/unstable): add `memoize()` and `LruCache` (#4725)
- fix(cache/unstable): fix flaky `memoize()` test with `FakeTime` (#5664)
- chore(cache): add `@experimental` JSDoc tag to public symbols (#5666)

#### @std/datetime 0.225.0 (minor)

- BREAKING(datetime): replace `utc` with `timeZone` option (#5647)
- fix(datetime): handle am / pm variants (#5406)
- refactor(datetime): cleanup `DateTimeFormatter` and `parse()` function (#5649)

#### @std/encoding 1.0.2 (patch)

- feat(encoding/unstable): `decodeBase32Hex()` and `encodeBase32Hex()` (#4931)
- test(encoding): cleanup base32 tests (#5665)

#### @std/front-matter 1.0.2 (patch)

- refactor(front-matter): remove `Extractor` type (#5659)

#### @std/http 1.0.3 (patch)

- refactor(http): use `methods` module in `file-server` module (#5668)

#### @std/io 0.224.5 (patch)

- docs(io): document `std/io` (#5656)
- refactor(io): cleanup `BufferFullError` and `PartialReadError` logic (#5657)

#### @std/streams 1.0.2 (patch)

- feat(streams/unstable): `toLines()` (#5121)

#### @std/text 1.0.3 (patch)

- feat(text/unstable): add `slugify()` function (#5646)

#### @std/uuid 1.0.1 (patch)

- perf(uuid): make `uuidToBytes()` up to 2.5x faster (#5670)
- perf(uuid): make `bytesToUuid()` up to 100x faster (#5655)

#### @std/yaml 1.0.3 (patch)

- refactor(yaml): remove `result` property (#5684)
- refactor(yaml): move exports to import file (#5651)

### 2024.08.07

#### @std/http 1.0.2 (patch)

- fix(http/unstable): make `info` parameter optional (#5652)

### 2024.08.07

#### @std/archive 0.225.0 (minor)

- BREAKING(archive): remove `TarEntry.#header` (#5638)
- fix(archive): make `data` property private in `Tar` (#5645)
- fix(archive): make `block` and `reader` properties in `Untar` private (#5637)
- docs(archive): mark public APIs as unstable/experimental (#5639)

#### @std/csv 1.0.1 (patch)

- fix(csv,streams): use string arrays in `ReadableStream.from()` in docs and
  tests (#5635)

#### @std/datetime 0.224.5 (patch)

- refactor(datetime): remove `Tokenizer` class (#5622)

#### @std/http 1.0.1 (patch)

- feat(http/unstable): `route` module (#5644)
- feat(http/unstable): `headers` module (#4317)
- feat(http/unstable): `methods` module (#4320)
- fix(http): handle wrong request method correctly (#5643)
- refactor(http): use `headers` module in `file-server` module (#5642)

#### @std/streams 1.0.1 (patch)

- feat(streams/unstable): `FixedChunkStream` (#4995)
- fix(csv,streams): use string arrays in `ReadableStream.from()` in docs and
  tests (#5635)

### 2024.08.05

#### @std/async 1.0.3 (patch)

- fix(async): abortable should not change original outputs (#5609)

#### @std/cli 1.0.3 (patch)

- refactor(cli): minor cleanups (#5628)
- refactor(cli): `isNumber()` (#5607)

#### @std/csv 1.0.0 (major)

- chore(csv): release `csv@1.0.0` (#5219)

#### @std/semver 1.0.1 (patch)

- docs(semver): remove diagram line overlaps (#5624)

#### @std/url 0.225.0 (minor)

- chore(url): release `url@0.225.0` (#5631)
- deprecation(url): deprecate `@std/url` (#5530)
- refactor: import from `@std/assert` (#5199)

#### @std/yaml 1.0.2 (patch)

- refactor(yaml): move functions to class methods (#5625)

### 2024.08.02

#### @std/assert 1.0.2 (patch)

- feat(assert/unstable): add `options` parameter to `AssertionError` constructor
  (#5561)
- chore(assert): mark `options` argument of `AssertionError` constructor
  unstable (#5573)

#### @std/async 1.0.2 (patch)

- fix(async): `abortableAsyncIterable()` should call `.return()` on the
  generator once aborted (#5560)
- test(async): improve test speed of `async/pool_test.ts` (#5611)
- test(async): fix `abortable.AsyncIterable() calls return before throwing` test
  (#5596)

#### @std/cli 1.0.2 (patch)

- refactor(cli): use non-null assertion in `parseArgs()` logic (#5618)
- refactor(cli): simplify `argv` and `notFlags` push (#5608)
- refactor(cli): remove `broken` variable in favour of loop label (#5602)
- refactor(cli): use `for of` instead of `for in` loop (#5598)
- refactor(cli): make regexps constants (#5595)
- chore(cli): simplify `parseArgs()` logic (#5601)
- chore(cli): simplify `setNested()` and `hasNested()` (#5599)

#### @std/csv 1.0.0-rc.6 (prerelease)

- feat(csv): support `fieldsPerRecord` in `CsvParseStream` (#5600)
- fix(csv): remove `undefined` from possible value type of parse result (#5617)
- fix(csv): show 1-based line and column numbers in error messages (#5604)
- docs(csv): more examples for `stringify` and `CsvStringifyStream` (#5606)
- docs(csv): more examples for `parse` and `CsvParseStream` (#5605)
- docs(csv): clarify `CsvParseStream` description (#5613)
- docs(csv): clarify `parse` document (#5597)
- docs(csv): correct thrown error type in `fieldsPerRecord` field description
  (#5594)

#### @std/datetime 0.224.4 (patch)

- chore(datetime): remove console log (#5610)

#### @std/fmt 1.0.0 (major)

- BREAKING(fmt): rename `PrettyDurationOptions` to `FormatOptions` (#5591)
- docs(fmt,fs,text,yaml): fix Markdown alerts (#5568)
- chore(fmt): release `fmt@1.0.0` (#5454)

#### @std/front-matter 1.0.1 (patch)

- refactor(front-matter): replace regexp factory with regexp literals (#5370)

#### @std/fs 1.0.1 (patch)

- docs(fmt,fs,text,yaml): fix Markdown alerts (#5568)
- docs(fs): fix incorrect examples for walk (#5559)

#### @std/html 1.0.1 (patch)

- feat(html/unstable): add `isValidCustomElementName()` (#5456)

#### @std/http 1.0.0 (major)

- BREAKING(http): remove `ETagSource` (#5577)
- fix(http): better `eTag` return type for `string` and `Uint8Array` inputs
  (#5571)
- fix(http): update localhost strings in tests (#5563)
- chore(http): release `http@1.0.0` (#5217)

#### @std/ini 1.0.0-rc.3 (prerelease)

- BREAKING(ini): reduce options for `stringify`, make `FormattingOptions` type
  private (#5572)
- feat(ini): add type param for value type (#5588)
- fix(ini): correctly handle quoted values in `parse()` (#5592)
- docs(ini): cleanup module documentation (#5566)
- refactor(ini): cleanup dead code (#5576)
- test(ini): copy tests from `ini/_ini_map_test.ts` (#5593)

#### @std/io 0.224.4 (patch)

- refactor(io): use `writeAll()` within `copy()` (#5580)

#### @std/net 1.0.0 (major)

- chore(net): release net@1.0.0 (#5457)

#### @std/semver 1.0.0 (major)

- BREAKING(semver): remove the handling of non-standard SemVers in format
  function (#5587)
- BREAKING(semver): do not accept undefined input in `tryParse` (#5584)
- fix(semver): do not throw in `canParse` (#5583)
- fix(semver): throw on invalid input in `parseRange()` (#5567)
- fix(semver): correctly remove spaces between operators and versions in
  `parseRange()` (#5564)
- docs(semver): fix `Comparator` example (#5585)
- docs(semver): clarify `compare` docs (#5586)
- refactor(semver): throw `TypeError` if release is invalid in `increment()`
  (#5565)
- chore(semver): release `semver@1.0.0` (#5220)

#### @std/testing 1.0.0 (major)

- BREAKING(testing): replace `TimeError` exception in favor of built-in error
  classes in some cases (#5550)
- fix(testing): correct `stub()` error message (#5575)
- docs(testing): mention default serializer (#5590)
- refactor(testing): improve error messages in `mock` module (part 2) (#5569)
- chore(testing): release `testing@1.0.0` (#5218)

#### @std/text 1.0.2 (patch)

- docs(fmt,fs,text,yaml): fix Markdown alerts (#5568)

#### @std/url 1.0.0-rc.3 (prerelease)

- deprecation(url): deprecate `@std/url` (#5530)

#### @std/yaml 1.0.1 (patch)

- docs(fmt,fs,text,yaml): fix Markdown alerts (#5568)

### 2024.07.26

#### @std/assert 1.0.1 (patch)

- fix(assert): fix `assertObjectMatch()` prints arrays as objects (#5503)
- fix(assert): `assertObjectMatch` doesn't print whole object (#5498)
- chore(assert): remove redundant constructor example (#5506)

#### @std/async 1.0.1 (patch)

- chore(async): remove redundant constructor example (#5507)

#### @std/cli 1.0.1 (patch)

- test(cli): stop spinner without error (#5551)
- chore(cli): remove redundant constructor example (#5508)

#### @std/crypto 1.0.2 (patch)

- fix(crypto): improve handling of `length` option (#5505)

#### @std/csv 1.0.0-rc.5 (prerelease)

- chore(csv): remove redundant constructor examples (#5509)

#### @std/data-structures 1.0.1 (patch)

- chore(data-structures): remove redundant constructor examples (#5510)

#### @std/expect 1.0.0 (major)

- docs(expect): add examples of matcher usages (#5553)
- docs(expect): link to matcher docs (#5502)
- docs(expect): minor doc tweaks (#5501)

#### @std/front-matter 1.0.0 (major)

- chore(front-matter): release `front-matter@1.0.0` (#5376)

#### @std/fs 1.0.0 (major)

- BREAKING(fs): throw `Deno.errors.NotSupported` instead of
  `SubdirectoryMoveError` in `move[Sync]()` (#5532)
- BREAKING(fs): throw `Deno.errors.NotFound` instead of `WalkError` in
  `walk[Sync]()` (#5477)
- docs(fs): make `preserveTimestamps` note more prominent (#5543)
- chore(fs): release `fs@1.0.0` (#5214)
- chore(fs): remove redundant constructor examples (#5511)

#### @std/http 1.0.0-rc.6 (prerelease)

- fix(http): only show LAN address when `--allow-sys` is provided (#5547)
- chore(http): remove redundant constructor example (#5512)

#### @std/json 1.0.0 (major)

- chore(json): remove redundant constructor examples (#5513)
- chore(json): release `json@1.0.0` (#5215)

#### @std/jsonc 1.0.0 (major)

- chore(jsonc): tweak `JsonValue` export (#5546)
- chore(jsonc): release `jsonc@1.0.0` (#5216)

#### @std/path 1.0.2 (patch)

- docs(path): cleanup `@std/path/posix` and `@std/path/windows` module
  documentation (#5529)
- docs(path): add examples to `@std/path/posix` examples (#5371)

#### @std/streams 1.0.0 (major)

- fix(streams): strictly define `toJson()` and `toText()` input (#5517)
- chore(streams): release `streams@1.0.0` (#5518)
- chore(streams): remove redundant constructor examples (#5514)

#### @std/testing 1.0.0-rc.5 (prerelease)

- fix(testing): FakeTime fakes `AbortSignal.timeout` (#5500)
- refactor(testing): improve error messages in `mock` module (#5549)
- refactor(testing): improve `FakeTime` error messaging (#5533)
- chore(testing): remove redundant constructor examples (#5515)

#### @std/text 1.0.1 (patch)

- feat(text/unstable): add toConstantCase() (#5110)
- fix(text): unicode support and word splitting according to case (#5447)
- perf(text): make `levenshteinDistance()` up to 147x faster (#5527)
- test(text): add more testcases for `levenshteinDistance` (#5528)

#### @std/yaml 1.0.0 (major)

- docs(yaml): correct `core` schema note (#5552)
- docs(yaml): document compatibility policy (#5542)
- docs(yaml): document different schemas (#5531)
- refactor(yaml): cleanup dead sexagesimal regexp code in float type (#5545)
- refactor(yaml): remove deprecated sexagesimal functionality for integer types
  (#5539)
- refactor(yaml): cleanup dead code in float `Type` implementation (#5526)
- test(yaml): test `arrayIndent = false` option (#5521)
- test(yaml): improve test coverage for sequence type (#5536)
- test(yaml): improve test coverage for mapping type (#5535)
- test(yaml): improve test coverage for string type (#5534)
- test(yaml): test sortKeys option behavior (#5523)
- test(yaml): check `lineWidth` option behavior (#5524)
- test(yaml): improve coverage for nil `Type` (#5525)
- test(yaml): check the use of reserved characters (#5519)
- test(yaml): check stringify behavior when `skipInvalid` specified (#5522)
- test(yaml): test `indent` option of stringify (#5520)
- test(yaml): add check of merge of list of mapping (#5496)
- chore(yaml): release `yaml@1.0.0` (#5264)

### 2024.07.19

#### @std/async 1.0.0 (major)

- chore(async): release `async@1.0.0` (#5211)

#### @std/cli 1.0.0 (major)

- docs(cli): fix options arguments display (#5486)
- docs(cli): improve unstable API notices (#5482)
- docs(cli): documentation tweaks (#5458)
- chore(cli): release `cli@1.0.0` (#5212)

#### @std/collections 1.0.5 (patch)

- refactor(collections): use `Set.prototype.intersection()` method in
  `intersect()` (#5417)

#### @std/csv 1.0.0-rc.4 (prerelease)

- BREAKING(csv): remove `ParseError` (#5405)

#### @std/dotenv 0.225.0 (minor)

- BREAKING(dotenv): remove `defaultPath` option from `load[Sync]()` (#5451)
- BREAKING(dotenv): remove `examplePath` option from `load[Sync]()` (#5450)

#### @std/expect 1.0.0-rc.3 (prerelease)

- fix(expect): improve `expect` type to make it work better with `expect.extend`
  (#5309)

#### @std/fs 1.0.0-rc.6 (prerelease)

- docs(fs): fix options argument display (#5491)
- docs(fs): fix options argument display (#5487)

#### @std/http 1.0.0-rc.5 (prerelease)

- docs(http): fix options argument display (#5488)
- docs(http): fix options argument display (#5489)
- docs(http): improve unstable API notices (#5483)

#### @std/json 1.0.0-rc.3 (prerelease)

- docs(json): fix options argument display (#5490)

#### @std/jsonc 1.0.0-rc.3 (prerelease)

- docs(jsonc): remove docs for removed `options` parameter (#5438)

#### @std/media-types 1.0.2 (patch)

- fix(media-types): return `video/mp4` for `.mp4` extension (#5475)

#### @std/net 1.0.0-rc.2 (prerelease)

- docs(net): tweak `getNetworkAddress()` return doc (#5473)

#### @std/path 1.0.1 (patch)

- fix(path): support use in dnt (#5478)

#### @std/semver 1.0.0-rc.3 (prerelease)

- BREAKING(semver): replace `prerelease` and `buildmetadata` arguments with
  options object (#5471)

#### @std/streams 1.0.0-rc.4 (prerelease)

- docs(streams): address documentation issues (#5480)
- chore(streams): release `streams@1.0.0` (#5213)

#### @std/text 1.0.0 (major)

- BREAKING(text): align to single-export file pattern (#5428)
- feat(text): add ability for user to control word comparison function (#5448)
- docs(text): state complexity of `levenshteinDistance()` (#5472)
- chore(text): release `text@1.0.0` (#5209)

#### @std/ulid 1.0.0 (major)

- fix(ulid): fix decode-time export path (#5432)
- chore(ulid): release `ulid@1.0.0` (#5206)

#### @std/yaml 1.0.0-rc.4 (prerelease)

- BREAKING(yaml): replace `YamlError` with `TypeError` in `stringify()` (#5452)
- BREAKING(yaml): replace `YamlError` with `SyntaxError` in `parse()` (#5446)
- docs(yaml): list `extended` schema (#5444)
- refactor(yaml): change `object` type from `any` to `unknown` in `writeNode`
  (#5404)
- refactor(yaml): remove `instanceOf` field of `Type` (#5462)
- refactor(yaml): add `KindType` generic type argument to `Type` (#5461)
- refactor(yaml): improve `Type.predicate` behavior (#5460)
- refactor(yaml): remove `Type.loadKind` property (#5459)
- refactor(yaml): remove dead code in `Schema` constructor (#5445)
- refactor(yaml): make `Type.kind` required (#5442)

### 2024.07.12

#### @std/async 1.0.0-rc.4 (prerelease)

- fix(async): improve debounce node.js compatibility (#5419)

#### @std/cli 1.0.0-rc.5 (prerelease)

- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)

#### @std/collections 1.0.4 (patch)

- refactor(collections): inline `randomInteger` utility function (#5415)

#### @std/csv 1.0.0-rc.3 (prerelease)

- BREAKING(csv): throw `TypeError` in `stringify()` instead of `StringifyError`
  (#5347)
- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)
- refactor(csv): rename `graphemeLength` to `codePointLength` (#5421)

#### @std/data-structures 1.0.0 (major)

- docs(data-structures): get all `@link` nodes working (#5422)
- chore(data-structures): release `data-structures@1.0.0` (#5205)

#### @std/datetime 0.224.3 (patch)

- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)

#### @std/fmt 1.0.0-rc.1 (prerelease)

- BREAKING(fmt): remove `stripColor` (#5374)
- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)
- docs(fmt): improve documentation (#5373)
- chore(fmt): release `fmt@1.0.0-rc.1` (#5372)

#### @std/front-matter 1.0.0-rc.2 (prerelease)

- BREAKING(front-matter): remove `unknown` from `Format` union type (#5367)
- docs(front-matter): fix description of `Extract` (#5383)
- refactor(front-matter): remove `createExtractor()` (#5378)
- refactor(front-matter): replace regexp objects with maps (#5379)

#### @std/fs 1.0.0-rc.5 (prerelease)

- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)

#### @std/html 1.0.0 (major)

- chore(html): release `html@1.0.0` (#4988)

#### @std/http 1.0.0-rc.4 (prerelease)

- BREAKING(http): rename `Entity` to `ETagSource` and `calculate()` to `eTag()`
  (#5144)
- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)

#### @std/ini 1.0.0-rc.2 (prerelease)

- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)

#### @std/log 0.224.5 (patch)

- test(log): cleaunp `TextDecoder` use (#5407)

#### @std/msgpack 1.0.0 (major)

- chore(msgpack): release `msgpack@1.0.0` (#5210)

#### @std/net 1.0.0-rc.1 (prerelease)

- docs(net): update docs for `getAvailablePort()` (#5366)
- docs(net): make `getNetworkAddress()` unstable status more prominent (#5368)
- chore(net): release `net@1.0.0-rc.1` (#5349)

#### @std/path 1.0.0 (major)

- chore(path): release `path@1.0.0` (#5203)

#### @std/regexp 1.0.0 (major)

- docs(regexp): import `escape` from most specific place in examples (#5427)
- chore(regexp): release `regexp@1.0.0` (#5207)

#### @std/semver 1.0.0-rc.2 (prerelease)

- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)

#### @std/streams 1.0.0-rc.3 (prerelease)

- fix(streams): toText() incorrect with multibyte strings in different chunks
  (#5381)

#### @std/testing 1.0.0-rc.4 (prerelease)

- fix(testing): throw error when async func is passed to describe (#5385)
- docs(cli,csv,datetime,fmt,fs,http,ini,semver,testing): assert optional
  properties on types/interfaces have `@default` tag (#4933)
- test(testing): fix flakiness of snapshot test (#5414)

#### @std/text 1.0.0-rc.3 (prerelease)

- docs(text): refine documents in text module (#5425)

#### @std/toml 1.0.0 (major)

- BREAKING(toml): throw `SyntaxError` in `parse()` instead of `TOMLParseError`
  (#5346)
- refactor(toml): improve early returns (#5338)
- chore(toml): release `toml@1.0.0` (#5204)

#### @std/ulid 1.0.0-rc.4 (prerelease)

- feat(ulid): add single-export endpoints (#5426)

#### @std/yaml 1.0.0-rc.3 (prerelease)

- refactor(yaml): fix `onWarning` arg type (#5395)
- refactor(yaml): rearrange constants and functions (#5411)
- refactor(yaml): remove passing `this.dump` as method param (#5413)
- refactor(yaml): add writeNode options (#5409)
- refactor(yaml): remove obsolete export from `trimTrailingNewline()` (#5412)
- refactor(yaml): remove nested functions (#5389)
- refactor(yaml): make `Type` generic (#5394)
- refactor(yaml): replace `indexOf()` tests with `includes()` (#5390)
- refactor(yaml): correct `testAmbiguousType` type (#5399)
- refactor(yaml): correct `duplicate` and `usedDuplicates` types (#5398)
- refactor(yaml): correct `sortKeys` type (#5397)
- refactor(yaml): replace `keyNode` any type (#5396)
- refactor(yaml): replace `implicit` `any[]` type with `Type[]` (#5393)
- refactor(yaml): replace `any` with `unknown` in `ResultType` constituents
  (#5392)
- refactor(yaml): extract and rename regexp constant (#5391)
- refactor(yaml): move state functions inside class (#5388)
- refactor(yaml): simplify `foldLine()` (#5386)
- refactor(yaml): simplify `indentString()` (#5335)
- refactor(yaml): camelcase `iskey` (#5365)
- refactor(yaml): remove `Any` type (#5306)

### 2024.07.09

#### @std/assert 1.0.0 (major)

- docs(assert): improve `assertObjectMatch` docs (#5296)
- docs(assert): improve `assertNotStrictEquals` example (#5295)
- docs(assert): update `assertMatch` example (#5294)
- test(assert): add "`assert()` throws if expr is falsy" test (#5267)
- chore(assert): release `assert@1.0.0` (#4989)

#### @std/bytes 1.0.2 (patch)

- fix(bytes,cli,collections,expect): add missing non-null assertions (#5280)

#### @std/cli 1.0.0-rc.4 (prerelease)

- fix(bytes,cli,collections,expect): add missing non-null assertions (#5280)

#### @std/collections 1.0.3 (patch)

- fix(bytes,cli,collections,expect): add missing non-null assertions (#5280)

#### @std/crypto 1.0.1 (patch)

- test(crypto): test `timingSafeEqual()` in handling `DataView`s (#5268)

#### @std/csv 1.0.0-rc.2 (prerelease)

- refactor(csv): rename arguments, variables and loop (#5297)
- refactor(csv): remove `runeCount()` function (#5298)
- refactor(csv): throw errors immediately (#5299)
- test(csv): add grapheme length test (#5304)

#### @std/encoding 1.0.1 (patch)

- perf(encoding): fix loop times in `encodeHex()` (#5344)

#### @std/expect 1.0.0-rc.2 (prerelease)

- fix(expect): make `.not` aware of whether is it is in async context (#5308)
- fix(bytes,cli,collections,expect): add missing non-null assertions (#5280)

#### @std/fmt 0.225.6 (patch)

- fix(fmt): fix the case when mantissa exceeds 10 by rounding and exponent is
  negative (#5279)
- test(fmt): add test cases for `printf()` (#5278)

#### @std/front-matter 1.0.0-rc.1 (prerelease)

- BREAKING(front-matter): make `Extractor` helper type private (#5334)
- BREAKING(front-matter): remove `createExtractor()` (#5266)
- fix(front-matter): improve `extract` types (#5325)
- chore(front-matter): release `front-matter@1.0.0-rc.1` (#5263)

#### @std/fs 1.0.0-rc.4 (prerelease)

- fix(fs): accept `exts` without leading period in `walk[Sync]()` (#5345)

#### @std/http 1.0.0-rc.3 (prerelease)

- fix(http): allow deleting cookie with `secure`, `httpOnly` and `partitioned`
  attributes (#5354)

#### @std/ini 1.0.0-rc.1 (prerelease)

- BREAKING(ini): make `IniMap` private (#5351)
- docs(ini): link options interfaces to functions that use them (#5359)
- chore(ini): release `ini@1.0.0-rc.1` (#5357)

#### @std/net 0.224.5 (patch)

- chore(net): mark `getNetworkAddress()` unstable (#5348)

#### @std/path 1.0.0-rc.4 (prerelease)

- BREAKING(path): remove `FormatInputPathObject` (#5321)
- BREAKING(path): remove `GlobToRegExpOptions` (#5320)

#### @std/testing 1.0.0-rc.3 (prerelease)

- fix(testing): cause type error for async function as describe body (#5355)
- fix(testing): escape CR in snapshot files (#5352)

#### @std/toml 1.0.0-rc.4 (prerelease)

- refactor(toml): remove Utils object (#5342)
- refactor(toml): remove `Patterns` object (#5343)
- refactor(toml): rename functions to camel case (#5339)

#### @std/yaml 1.0.0-rc.2 (prerelease)

- BREAKING(yaml): rename `StringifyOptions.noRefs` to
  `StringifyOptions.useAnchors` (#5288)
- BREAKING(yaml): remove style aliases of `!!int` type (#5307)
- BREAKING(yaml): rename `StringifyOptions.noCompatMode` to
  `StringifyOptions.compatMode` (#5287)
- BREAKING(yaml): rename `ParseOptions.noArrayIndent` to
  `ParseOptions.arrayIndent` (#5286)
- BREAKING(yaml): rename `ParseOptions.json` to
  `ParseOptions.allowDuplicateKeys` (#5282)
- fix(yaml): fix `StringifyOptions.noRefs` (#5292)
- fix(yaml): fix `!!int` style variation handling in `stringfiy` (#5256)
- docs(yaml): improve documentation (#5324)
- refactor(yaml): cleanup dead code in `Mark` class (#5327)
- refactor(yaml): simplify `YamlError` (#5328)
- refactor(yaml): simplify and rename `dropEndingNewline()` (#5336)
- refactor(yaml): move `getObjectTypeString()` (#5332)
- refactor(yaml): remove obsolete static `Schema.SCHEMA_DEFAULT` property
  (#5326)
- refactor(yaml): cleanup `detectType()` (#5313)
- refactor(yaml): cleanup `mergeMappings()` (#5314)
- refactor(yaml): rename util functions (#5310)
- refactor(yaml): replace `usedDuplicates()` array with `Set` (#5312)
- refactor(yaml): cleanup `inspectNode()` (#5311)
- refactor(yaml): simplify `encodeHex()` (#5305)
- refactor(yaml): add `readIndent()` method (#5302)
- refactor(yaml): remove repeat helper function (#5303)
- refactor(yaml): rename `throwWarning()` to `dispatchWarning()` (#5301)
- refactor(yaml): move char check functions (#5300)
- refactor(yaml): remove first argument from `ParseOptions.onWarning` (#5284)
- refactor(yaml): add `peek()` and `next()` to `LoaderState` (#5276)
- refactor(yaml): replace `Type` class with interface (#5262)
- refactor(yaml): simplify isWhiteSpaceOrEOL (#5271)
- refactor(yaml): simplify `sanitizeInput()` (#5274)
- refactor(yaml): inline error functions as methods (#5273)
- refactor(yaml): remove `State` class (#5275)
- refactor(yaml): move loader and dumper files (#5270)
- refactor(yaml): make `readDocument()` and `readDocuments()` generator
  functions (#5255)
- refactor(yaml): merge `yaml/_dumper/` files (#5260)
- refactor(yaml): merge `yaml/_loader/` files (#5259)
- refactor(yaml): add default options object (#5261)
- test(yaml): test parsing of single quoted scalars (#5356)
- test(yaml): add test cases of stringify (#5350)
- test(yaml): test block scalar output of stringify (#5341)
- test(yaml): add test for `ParseOptions.json` option (#5283)
- test(yaml): add test of parsing !!int types (#5253)

### 2024.07.02

#### @std/archive 0.224.3 (patch)

- test(archive): fix typo in `tar_test.ts` (#5196)

#### @std/assert 1.0.0-rc.3 (prerelease)

- BREAKING(assert): remove `assert` from module names (#5176)
- refactor: import from `@std/assert` (#5199)

#### @std/async 1.0.0-rc.3 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/bytes 1.0.1 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/cli 1.0.0-rc.3 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/collections 1.0.2 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/crypto 1.0.0 (major)

- refactor: import from `@std/assert` (#5199)
- chore(crypto): release `crypto@1.0.0` (#4990)

#### @std/csv 1.0.0-rc.1 (prerelease)

- BREAKING(csv): remove `csv` from module names (#5172)
- BREAKING(csv): make `ReadOptions` private (#5169)
- docs(csv): fix description of `ParseResult` (#5170)
- docs(csv): add module docs (#5157)
- refactor(csv): minor cleanup (#5166)
- refactor: import from `@std/assert` (#5199)
- refactor(csv): minor cleanups (#5158)
- refactor(csv): remove dead code and improve `CsvParseStream` test (#5153)
- refactor(csv): remove dead code and improve tests (#5151)
- test(csv): improve `CsvStringifyStream` test (#5154)
- test(csv): improve stringify testing (#5150)
- chore(csv): release `csv@1.0.0-rc.1` (#5159)

#### @std/data-structures 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/datetime 0.224.2 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/dotenv 0.224.2 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/encoding 1.0.0 (major)

- refactor: import from `@std/assert` (#5199)
- chore(encoding): release `encoding@1.0.0` (#4991)

#### @std/expect 1.0.0-rc.1 (prerelease)

- BREAKING(expect): remove special handling of Immutable.js objects (#5228)
- fix(expect): fix validation of nth param in `toHaveBeenNthCalledWith` matcher
  (#5227)
- refactor(expect,testing): update `@std/assert` imports (#5242)
- refactor(expect): remove `expect.addSnapshotSerializer(s)` (#5231)
- refactor: import from `@std/assert` (#5199)
- test(expect): test edge cases of matchers (#5226)
- test(expect): add test of `iterableEquality` (#5222)
- test(expect): improve `expect` test cases (#5221)
- chore(expect): release `expect@1.0.0-rc.1` (#5235)

#### @std/fmt 0.225.5 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/front-matter 0.224.3 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/fs 1.0.0-rc.3 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/html 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/http 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/ini 0.225.2 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/internal 1.0.1 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/io 0.224.3 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/json 1.0.0-rc.2 (prerelease)

- BREAKING(json): remove `json` from module names (#5173)
- refactor: import from `@std/assert` (#5199)

#### @std/jsonc 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/log 0.224.4 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/media-types 1.0.1 (patch)

- fix(media-types): update `db.ts` (#5193)
- refactor: import from `@std/assert` (#5199)
- chore(media-types): release `media-types@1.0.1` (#5197)

#### @std/msgpack 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/net 0.224.4 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/path 1.0.0-rc.3 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/semver 1.0.0-rc.1 (prerelease)

- BREAKING(semver): remove `SEMVER_SPEC_VERSION` (#5180)
- BREAKING(semver): make invalid SemVer constants private (#5168)
- BREAKING(semver): remove deprecated `rangeMax()`, `rangeMin()` and
  `testRange()` APIs (#5160)
- docs(semver): minor documentation cleanups (#5178)
- refactor: import from `@std/assert` (#5199)
- test(semver): add `tryParse()` tests (#5161)
- chore(semver): release `semver@1.0.0-rc.1` (#5181)

#### @std/streams 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/testing 1.0.0-rc.2 (prerelease)

- fix(testing): throw error eagerly when insufficient permissions are granted to
  write to snapshot file in update mode (#5201)
- refactor(expect,testing): update `@std/assert` imports (#5242)
- refactor: import from `@std/assert` (#5199)

#### @std/text 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/toml 1.0.0-rc.3 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/ulid 1.0.0-rc.3 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/url 1.0.0-rc.2 (prerelease)

- refactor: import from `@std/assert` (#5199)

#### @std/uuid 1.0.0 (major)

- refactor: import from `@std/assert` (#5199)

#### @std/webgpu 0.224.5 (patch)

- refactor: import from `@std/assert` (#5199)

#### @std/yaml 1.0.0-rc.1 (prerelease)

- BREAKING(yaml): remove `ParseOptions.legacy` option (#5229)
- BREAKING(yaml): remove `filename` option from `parse()` and `stringify()`
  (#5223)
- BREAKING(yaml): remove `listener` option from `parse()` and `stringify()`
  (#5224)
- BREAKING(yaml): make `Schema` and `Type` private and stop supporting
  user-defined schemas (#5175)
- BREAKING(yaml): rename `DumpOptions` to `StringifyOptions` (#5171)
- BREAKING(yaml): remove `iterator` argument from `parseAll()` (#5148)
- fix(yaml): fix `!!pairs` parsing (#5192)
- fix(yaml): fix merge (<<) type handling in `parse()` (#5185)
- refactor(yaml): replace chars and comments with constants (#5250)
- refactor(yaml): add `sanitizeInput()` function (#5248)
- refactor(yaml): remove inferred `Schema` type (#5252)
- refactor(yaml): add default options object (#5249)
- refactor(yaml): share char constants (#5246)
- refactor(yaml): remove `DirectiveHandler` type (#5247)
- refactor(yaml): minor cleanups (#5239)
- refactor(yaml): simplify schema (#5236)
- refactor(yaml): consolidate `yaml/schema/*.ts` code into `yaml/_schema.ts`
  (#5225)
- refactor: import from `@std/assert` (#5199)
- refactor(yaml): remove unused `func` type (#5191)
- refactor(yaml): remove dead code (#5189)
- refactor(yaml): simplify map initializations (#5183)
- refactor(yaml): rename `YAMLError` to `YamlError` (#5149)
- test(yaml): test handling of boolean values (#5251)
- test(yaml): check handling of binary type (#5245)
- test(yaml): add `parse()` test for duplicate keys (#5240)
- test(yaml): add test cases of handling ? mark in YAML (#5234)
- test(yaml): test `!!timestamp` type handling (#5237)
- test(yaml): test `stringify()` case when string encoded into hex sequences
  (#5230)
- test(yaml): test anchor and alias handling of `parse()` (#5190)
- test(yaml): add misc `parse()` test cases (#5188)
- test(yaml): add test for block scalars (#5187)
- test(yaml): improve `parse()` testing (#5182)
- chore(yaml): release `yaml@1.0.0-rc.1` (#5244)
- chore(yaml): remove `example` folder (#5238)

### 2024.06.26

#### @std/cli 1.0.0-rc.2 (prerelease)

- test(cli): improve `Spinner` test (#5108)

#### @std/collections 1.0.1 (patch)

- perf(collections): use `for` loop instead of `forEach()` in `unzip()` (#5104)

#### @std/fs 1.0.0-rc.2 (prerelease)

- docs(fs): add not supported docs for `CopyOptions.preserveTimestamps` (#5143)

#### @std/http 1.0.0-rc.1 (prerelease)

- BREAKING(http): rename `verifyCookie()` to `verifySignedCookie()` (#5138)
- BREAKING(http): improve thrown errors in `cookie` module (#5129)
- BREAKING(http): change the default port of file-server to the same default of
  `Deno.serve()` (#4888)
- BREAKING(http): move `unstable-signed-cookie` to `signed-cookie` (#5101)
- BREAKING(http): remove deprecated `server` module (#5100)
- fix(http): handle the case fileInfo.mode=0 correctly (#5132)
- docs(http): remove outdated mention of `CookieMap` (#5109)
- refactor(http): change error thrown in `ServerSentEventStream` to
  `SyntaxError` (#5135)
- refactor(http): minor cleanup (#5126)
- refactor(http): remove dead code and improve `UserAgent` testing (#5120)
- chore(http): release `http@1.0.0-rc.1` (#5131)

#### @std/jsonc 1.0.0-rc.1 (prerelease)

- BREAKING(jsonc): remove `allowTrailingComma` option (#5119)
- refactor(jsonc): minor cleanups (#5114)
- chore(jsonc): release `jsonc@1.0.0-rc.1` (#5115)

#### @std/media-types 1.0.0 (major)

- BREAKING(media-types): rename `extensionsByType` to `allExtensions` (#5106)
- docs(media-types): remove outdated historical note (#5105)
- chore(media-types): release `media-types@1.0.0` (#4780)

#### @std/testing 1.0.0-rc.1 (prerelease)

- BREAKING(testing): remove deprecated `asserts` module (#5099)
- BREAKING(testing): disable multiple `FakeTime` creations (#5130)
- fix(testing): correctly throw in constructor with `spy()` (#5139)
- fix(testing): function call of `Date` constructor is not correctly faked
  (#5122)
- docs(testing): add module docs (#5147)
- refactor(testing): remove `@std/fmt/colors` dependency from `snapshot` module
  (#5145)
- refactor(testing): remove dead code and improve test of `testing/mock.ts`
  (#5137)
- test(testing): improve bdd testing (#5136)
- test(testing): improve `FakeTime` testing (#5123)
- chore(testing): release `testing@1.0.0-rc.1` (#5142)

#### @std/yaml 0.224.3 (patch)

- feat(yaml): support schema name for 'schema' option (#5118)
- docs(yaml): improve `yaml` document (#5127)

### 2024.06.21

#### @std/archive 0.224.2 (patch)

- refactor(archive,expect,io,log,toml,yaml): remove `private` and `public`
  access modifiers (#5077)

#### @std/async 1.0.0-rc.2 (prerelease)

- BREAKING(async): simplify `deadline()` logic, remove `DeadlineError` and
  improve errors (#5058)
- BREAKING(async): make `abortablePromise()` and `abortableAsyncIterable()`
  private (#5056)

#### @std/cli 1.0.0-rc.1 (prerelease)

- chore(cli): release `cli@1.0.0-rc.1` (#5068)
- chore(cli): make spinner unstable/experimental (#5067)

#### @std/collections 1.0.0 (major)

- chore(collections): release `collections@1.0.0` (#4773)

#### @std/dotenv 0.224.1 (patch)

- docs(dotenv): improve `dotenv` docs (#5095)

#### @std/expect 0.224.5 (patch)

- refactor(archive,expect,io,log,toml,yaml): remove `private` and `public`
  access modifiers (#5077)

#### @std/fs 1.0.0-rc.1 (prerelease)

- refactor(fs): improve `expandGlob()` implementation and testing (#5089)
- refactor(fs): reduce the repetition in `exists.ts` (#5088)
- refactor(fs): reduce the repetition in ensure_dir.ts (#5085)
- refactor(fs): resolve directories when checking whether they are the same in
  `isSubdir()` (#5076)
- test(fs): improve `copy()` testing (#5084)
- test(fs): improve `ensureSymlink()` test (#5087)
- test(fs): check `ensureDir()` is not racy (#5086)
- chore(fs): release `fs@1.0.0-rc.1` (#5091)

#### @std/io 0.224.2 (patch)

- refactor(archive,expect,io,log,toml,yaml): remove `private` and `public`
  access modifiers (#5077)

#### @std/json 1.0.0-rc.1 (prerelease)

- BREAKING(json): rename /common to /types (#5103)
- BREAKING(json): remove `writableStrategy` and `readableStrategy` options
  (#5097)
- docs(json): lint `@std/json` docs (#4798)
- test(json): improve json testing (#5075)
- chore(json): release `json@1.0.0-rc.1` (#5102)

#### @std/jsonc 0.224.3 (patch)

- test(jsonc): remove dead code and improve testing (#5093)

#### @std/log 0.224.3 (patch)

- refactor(archive,expect,io,log,toml,yaml): remove `private` and `public`
  access modifiers (#5077)

#### @std/streams 1.0.0-rc.1 (prerelease)

- BREAKING(streams): remove `iterateReader`, `readableStreamFromReader`,
  `readerFromIterable`, `readerFromStreamReader`, `writableStreamFromWriter`,
  and `writerFromStreamWriter` (#5060)
- fix(streams): prevent `earlyZipReadableStreams()` from possibly using
  excessive memory (#5082)
- test(streams): improve test coverage (#5078)
- test(streams): improve `DelimiterStream` test cases (#5070)
- test(streams): improve `Buffer` test (#5061)
- chore(streams): release `streams@1.0.0-rc.1` (#5074)

#### @std/testing 0.225.3 (patch)

- refactor(testing): remove `FakeTime.start` setter (#5050)

#### @std/toml 1.0.0-rc.2 (prerelease)

- refactor(archive,expect,io,log,toml,yaml): remove `private` and `public`
  access modifiers (#5077)

#### @std/yaml 0.224.2 (patch)

- refactor(archive,expect,io,log,toml,yaml): remove `private` and `public`
  access modifiers (#5077)

### 2024.06.17

#### @std/async 1.0.0-rc.1 (prerelease)

- BREAKING(async): stop exporting ERROR_WHILE_MAPPING_MESSAGE (#5041)
- docs(async): improve module docs (#5039)
- docs(async): avoid memory leak in example (#5040)
- chore(async): release `async@1.0.0-rc.1` (#5035)
- chore(async): mark `Tuple` and `TupleOf` as `@internal` (#5042)

#### @std/cli 0.224.7 (patch)

- refactor(cli): minor cleanups (#5052)
- test(cli): improve spinner test coverage (#5047)
- test(cli): improve test coverage (#5046)

#### @std/http 0.224.5 (patch)

- feat(http): support partitioned cookies (#5044)

#### @std/msgpack 1.0.0-rc.1 (prerelease)

- chore(msgpack): release `msgpack@1.0.0-rc.1` (#5030)

#### @std/path 1.0.0-rc.2 (prerelease)

- test(path): improve test coverage (#5038)

#### @std/streams 0.224.5 (patch)

- chore(streams): remove unused test util (#5048)

#### @std/testing 0.225.2 (patch)

- docs(testing): improve the docs of `@std/testing` (#5033)
- refactor(testing): remove use of `public` keyword (#5051)

#### @std/ulid 1.0.0-rc.2 (prerelease)

- refactor(ulid): remove `len` argument from `encodeTime()` and `encodeRandom()`
  (#5054)

### 2024.06.12

#### @std/assert 1.0.0-rc.2 (prerelease)

- fix(assert): fix tolerance calculation when comparing negative values (#5019)

#### @std/data-structures 1.0.0-rc.1 (prerelease)

- chore(data-structures): release `data-structures@1.0.0-rc.1` (#4987)

#### @std/fs 0.229.3 (patch)

- docs(fs): improve documentation (#4788)

#### @std/ini 0.225.1 (patch)

- docs(ini): improve ini docs (#5020)

#### @std/msgpack 0.224.3 (patch)

- docs(msgpack): complete documentation (#5029)
- test(msgpack): add test cases for `encode()` (#5028)
- test(msgpack): add `decode()` test cases (#5027)

#### @std/net 0.224.3 (patch)

- docs(net): complete documentation (#4982)

#### @std/regexp 1.0.0-rc.1 (prerelease)

- docs(regexp): complete documentation (#5023)
- chore(regexp): release `regexp@1.0.0-rc.1` (#5024)

#### @std/text 1.0.0-rc.1 (prerelease)

- refactor(text): minor cleanups and improvements (#5025)
- chore(text): release `text@1.0.0-rc.1` (#5026)

#### @std/ulid 1.0.0-rc.1 (prerelease)

- refactor(ulid): improve error types and messages (#5022)
- chore(ulid): release `ulid@1.0.0-rc.1` (#4997)

#### @std/url 1.0.0-rc.1 (prerelease)

- chore(url): release `url@1.0.0-rc.1` (#4981)

### 2024.06.06

#### @std/archive 0.224.1 (patch)

- refactor(archive): cleanup use of `@std/assert` (#4975)

#### @std/assert 1.0.0-rc.1 (prerelease)

- BREAKING(assert): make `unreachable()` consistent with `@std/assert` (#4943)
- BREAKING(assert): `assertAlmostEquals()` sets useful tolerance automatically
  (#4460)
- docs(assert): remove outdated API docs (#4937)
- refactor(assert): minor cleanups (#4941)
- chore(assert): release `assert@1.0.0-rc.1` (#4934)

#### @std/async 0.224.2 (patch)

- refactor(async): cleanup use of `@std/assert` (#4950)

#### @std/bytes 1.0.0 (major)

- chore(bytes): release `bytes@1.0.0` (#4746)

#### @std/cli 0.224.6 (patch)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)
- refactor(cli): cleanup use of `@std/assert` (#4966)

#### @std/csv 0.224.3 (patch)

- refactor(csv): cleanup use of `@std/assert` (#4976)

#### @std/data-structures 0.225.2 (patch)

- refactor(data-structures): remove use of `public` keyword (#4983)

#### @std/datetime 0.224.1 (patch)

- docs(datetime): trim module documentation (#4971)

#### @std/encoding 1.0.0-rc.2 (prerelease)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)

#### @std/fmt 0.225.4 (patch)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)

#### @std/fs 0.229.2 (patch)

- refactor(fs): cleanup use of `@std/assert` (#4948)

#### @std/html 1.0.0-rc.1 (prerelease)

- chore(html): release `html@1.0.0-rc.1` (#4962)

#### @std/http 0.224.4 (patch)

- refactor(http): cleanup use of `@std/assert` (#4974)

#### @std/io 0.224.1 (patch)

- refactor(io): cleanup use of `@std/assert` (#4979)

#### @std/jsonc 0.224.2 (patch)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)
- refactor(jsonc): cleanup use of `@std/assert` (#4968)

#### @std/log 0.224.2 (patch)

- refactor(log): cleanup use of `@std/assert` (#4973)

#### @std/path 1.0.0-rc.1 (prerelease)

- BREAKING(path): remove `path.posix` and `path.win32` (#4953)
- BREAKING(path): remove separator argument from `common()` (#4947)
- BREAKING(path): remove `GlobToRegExpOptions.os` and `OSType` export (#4928)
- docs(path): fix typo in `normalize` doc (#4959)
- docs(path): improve `join` jsdoc (#4958)
- docs(path): fix typo (#4956)
- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)
- refactor(path): clean `isWindows` logic (#4972)
- refactor(path): cleanup `join()` implementations (#4946)
- test(path): improve `windows.parse()` test (#4952)
- test(path): improve `normalizeGlob()` test coverage (#4940)
- test(path): improve `normalize()` coverage (#4939)
- chore(path): release `path@1.0.0-rc.1` (#4951)
- chore(path): use `assertPath()` in `windows.join()` (#4960)

#### @std/semver 0.224.3 (patch)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)

#### @std/streams 0.224.4 (patch)

- refactor(streams): cleanup use of `@std/assert` (#4980)

#### @std/testing 0.225.1 (patch)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)

#### @std/text 0.224.3 (patch)

- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)
- refactor(text): cleanup use of `@std/assert` (#4977)

#### @std/toml 1.0.0-rc.1 (prerelease)

- BREAKING(toml): rename `FormatOptions` to `StringifyOptions` (#4963)
- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)
- chore(toml): release `toml@1.0.0-rc.1` (#4969)
- chore(toml): minor cleanup (#4964)

#### @std/url 0.224.1 (patch)

- docs(url): complete documentation (#4965)
- docs(cli,encoding,fmt,jsonc,path,semver,testing,text,toml,url): remove "This
  module is browser compatible" note (#4945)

#### @std/webgpu 0.224.4 (patch)

- refactor(webgpu): cleanup use of `@std/assert` (#4978)

### 2024.06.03

#### @std/assert 0.226.0 (minor)

- BREAKING(assert,testing): remove `formatter` option from `assertEquals()`
  (#4893)
- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)
- docs(assert): improve docs (#4876)

#### @std/cli 0.224.5 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/crypto 1.0.0-rc.1 (prerelease)

- BREAKING(crypto): remove deprecated APIs (#4919)
- BREAKING(crypto): remove KeyStack (#4916)
- docs(crypto): improve docs (#4884)
- refactor(crypto): cleanup redundant assertion in `timingSafeEqual()` (#4907)
- test(crypto): test node.js custom inspection of `KeyStack` (#4887)
- chore(crypto): release `crypto@1.0.0-rc.1` (#4912)

#### @std/csv 0.224.2 (patch)

- docs(csv): use assertions in example code snippets (#4932)
- docs(csv): improve API docs (#4920)

#### @std/data-structures 0.225.1 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/encoding 1.0.0-rc.1 (prerelease)

- BREAKING(encoding): replace `Ascii85Options` with `EncodeAscii85Options` and
  `DecodeAscii85Options` (#4861)
- BREAKING(encoding): rename `MaxVarInt` to `MaxVarint` (#4896)
- BREAKING(encoding): rename `MaxUInt64` to `MaxUint64` (#4897)
- BREAKING(encoding): remove deprecated VarInt APIs (#4864)
- fix(encoding): throw `TypeError` on invalid input (#4901)
- chore(encoding): release `encoding@1.0.0-rc.1` (#4858)

#### @std/expect 0.224.4 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/fmt 0.225.3 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/front-matter 0.224.2 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/html 0.224.2 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/http 0.224.3 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)
- docs(http): added `--allow-sys` to file server example (#4890)

#### @std/jsonc 0.224.1 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/net 0.224.2 (patch)

- feat(net): `getNetworkAddress()` (#4677)

#### @std/path 0.225.2 (patch)

- docs(path): improve API docs (#4900)
- test(path): add test cases of `isAbsolute()`, `joinGlobs()`, and `common()`
  (#4904)
- test(path): test `toNamespacedPath()` (#4902)

#### @std/semver 0.224.2 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/streams 0.224.3 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/testing 0.225.0 (minor)

- BREAKING(assert,testing): remove `formatter` option from `assertEquals()`
  (#4893)
- refactor(testing): do not use assertEquals in snapshot.ts (#4930)

#### @std/text 0.224.2 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

#### @std/toml 0.224.1 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)
- docs(toml): lint `@std/toml` docs (#4799)

#### @std/uuid 1.0.0-rc.1 (prerelease)

- BREAKING(uuid): remove `V1Options` in favor of `GenerateOptions` (#4925)
- BREAKING(uuid): remove `v1.generate()` signature with `buf` and `offset`
  parameters and `number[]` return type (#4877)
- chore(uuid): release `uuid@1.0.0-rc.1` (#4867)

#### @std/webgpu 0.224.3 (patch)

- docs(assert,cli,data-structures,expect,fmt,front-matter,html,http,jsonc,semver,streams,text,toml,webgpu):
  add snippet checks in module, function and class docs to doc checker (#4855)

### 2024.05.29

#### @std/cli 0.224.4 (patch)

- fix(cli): reduce flicker in spinner render function (#4835)
- docs(cli): make check_docs pass (#4815)
- docs(cli): improve spinner.message document (#4785)
- test(cli): reduce the flakiness of `Spinner` test cases (#4844)

#### @std/data-structures 0.225.0 (minor)

- BREAKING(data-structures): hide private internals (#4827)
- docs(data-structures): enables doc lint of data-structures (#4847)

#### @std/encoding 0.224.3 (patch)

- docs(encoding): fix typo in `ascii85.ts` (#4854)
- docs(encoding): Cleanup and fix doc lints (#4838)
- refactor(encoding): remove unnecessary prefixes from private functions (#4862)
- refactor(encoding): rename `_util.ts` (#4860)
- test(encoding): use own `encodeHex()` and `decodeHex()` (#4863)

#### @std/expect 0.224.3 (patch)

- docs(expect): document methods and add examples (#4836)

#### @std/fmt 0.225.2 (patch)

- docs(fmt): improve API docs (#4829)

#### @std/front-matter 0.224.1 (patch)

- docs(front-matter): improve docs for stabilization (#4789)

#### @std/html 0.224.1 (patch)

- docs(html): improve API docs (#4878)

#### @std/http 0.224.2 (patch)

- docs(http): don't run some examples in doc checker (#4840)
- docs(http): improve docs for stabilization (#4813)

#### @std/ini 0.225.0 (minor)

- BREAKING(ini): remove internal `Formatting` type (#4818)
- fix(ini): remove unused `ParseOptions.assignment` property (#4816)
- docs(ini): add missing doc comments (#4819)
- refactor(ini): move StringifyOptions to stringify.ts (#4817)

#### @std/msgpack 0.224.2 (patch)

- fix(msgpack): error on early end of data (#4831)
- docs(msgpack): complete documentation of the package (#4832)

#### @std/semver 0.224.1 (patch)

- docs(semver): improve docs (#4846)

#### @std/streams 0.224.2 (patch)

- docs(streams): improve docs for stabilization (#4852)

#### @std/text 0.224.1 (patch)

- docs(text): pass docs check (#4837)
- docs(text): add module doc (#4812)

#### @std/ulid 0.224.1 (patch)

- docs(ulid): finish documentation (#4825)

#### @std/uuid 0.224.3 (patch)

- deprecation(uuid): deprecate `v1.generate()` signature with `buf` and `offset`
  parameters (#4880)
- deprecation(uuid): rename `V1Options` to `GenerateOptions` (#4872)
- fix(uuid): validate namespace UUIDs in `v3.generate()` and `v5.generate()`
  (#4874)
- docs(uuid): update module docs (#4790)
- test(uuid): add tests for invalid namespace UUID (#4875)

#### @std/yaml 0.224.1 (patch)

- refactor(yaml): remove dead code (#4849)
- test(yaml): test handling of omap (#4851)
- test(yaml): test float handling (#4850)

### 2024.05.22

#### @std/assert 0.225.3 (patch)

- refactor(assert,internal): rename `diffstr()` to `diffStr()` (#4758)

#### @std/async 0.224.1 (patch)

- docs(async): improve docs for stabilization (#4803)

#### @std/bytes 1.0.0-rc.3 (prerelease)

- perf(bytes): skip doing extra work in some scenarios (#4767)

#### @std/cli 0.224.3 (patch)

- chore(cli): remove outdated todo comment (#4787)

#### @std/collections 1.0.0-rc.1 (prerelease)

- feat(collections): `collections@1.0.0-rc.1` (#4697)
- docs(collections,internal,media-types): use `@typeParam` tag instead of
  `@template` (#4772)
- docs(collections): fix typos and improve example (#4763)
- docs(collections): update module doc (#4765)

#### @std/csv 0.224.1 (patch)

- docs(csv,encoding,http,json,media-types,uuid): use `rfc-editor.org` for RFC
  links (#4777)

#### @std/data-structures 0.224.1 (patch)

- docs(data-structures): improve documentation (#4793)

#### @std/encoding 0.224.2 (patch)

- docs(csv,encoding,http,json,media-types,uuid): use `rfc-editor.org` for RFC
  links (#4777)

#### @std/expect 0.224.2 (patch)

- fix(expect): updated error message for toContain (#4750)

#### @std/http 0.224.1 (patch)

- docs(csv,encoding,http,json,media-types,uuid): use `rfc-editor.org` for RFC
  links (#4777)

#### @std/internal 1.0.0 (major)

- docs(collections,internal,media-types): use `@typeParam` tag instead of
  `@template` (#4772)
- docs(internal): add module docs (#4757)
- refactor(assert,internal): rename `diffstr()` to `diffStr()` (#4758)

#### @std/json 0.224.1 (patch)

- docs(csv,encoding,http,json,media-types,uuid): use `rfc-editor.org` for RFC
  links (#4777)

#### @std/media-types 1.0.0-rc.1 (prerelease)

- fix(media-types): do not expose vendored json file as public API (#4776)
- docs(collections,internal,media-types): use `@typeParam` tag instead of
  `@template` (#4772)
- docs(csv,encoding,http,json,media-types,uuid): use `rfc-editor.org` for RFC
  links (#4777)
- chore(media-types): `media-types@1.0.0-rc.1` (#4744)

#### @std/msgpack 0.224.1 (patch)

- fix(msgpack): encode maps with null prototype (#4764)

#### @std/regexp 0.224.1 (patch)

- docs(regexp): update module example to get full jsr score (#4796)

#### @std/streams 0.224.1 (patch)

- feat(streams): `concatReadableStreams()` (#4747)

#### @std/uuid 0.224.2 (patch)

- docs(csv,encoding,http,json,media-types,uuid): use `rfc-editor.org` for RFC
  links (#4777)

#### @std/webgpu 0.224.2 (patch)

- docs(webgpu): improve docs for stabilization (#4811)

### 2024.05.16

#### @std/assert 0.225.2 (patch)

- fix(assert): handle `assertStrictEquals(-0, +0)` correctly (#4715)
- fix(assert): don't swallow the original error while creating assertion error
  (#4701)
- docs(assert): document `assertStrictEquals()` equality comparison behavior
  (#4724)
- refactor(assert): vendor code from `fmt/colors.ts` (#4716)
- chore(assert): revert "handle `assertStrictEquals(-0, +0)` correctly" (#4718)

#### @std/bytes 1.0.0-rc.2 (prerelease)

- docs(bytes): trim module documentation (#4693)
- docs(bytes,collections): fix doc checker and documentation (#4691)
- chore(bytes): release `bytes@1.0.0-rc.2` (#4745)

#### @std/cli 0.224.2 (patch)

- test(cli): reduce flakiness of spinner test (#4738)
- test(cli): reduce flakiness of spinner test (#4719)
- test(cli): `Spinner` tests (#4713)

#### @std/collections 0.224.2 (patch)

- feat(collections): add `invert()` and `invertBy()` (#4710)
- docs(collections): finalize module documentation (#4696)
- docs(bytes,collections): fix doc checker and documentation (#4691)
- refactor(collections): sort exports in `mod.ts` (#4712)

#### @std/encoding 0.224.1 (patch)

- test(encoding): improve test coverage (#4742)

#### @std/expect 0.224.1 (patch)

- fix(expect): don't swallow the original error while creating assertion error
  (#4700)
- chore(expect): fix future `no-slow-type` lint errors with expando properties
  (#4711)

#### @std/fmt 0.225.1 (patch)

- chore(fmt,fs,path,internal): skip yanked version manually (#4753)

#### @std/fs 0.229.1 (patch)

- chore(fmt,fs,path,internal): skip yanked version manually (#4753)

#### @std/internal 0.225.1 (patch)

- docs(internal): cleanups and documentation improvements (#4706)
- refactor(internal): cleanup `buildMessage()` (#4705)
- refactor(internal): cleanup `diff()` (#4704)
- refactor(internal): cleanup and restructure `diffstr()` (#4703)
- refactor(internal): cleanup `_internals` (#4702)
- refactor(internal): cleanup and restructure (#4698)
- chore(fmt,fs,path,internal): skip yanked version manually (#4753)
- chore(internal): release `internal@1.0.0` (#4741)

#### @std/media-types 0.224.1 (patch)

- docs(media-types): polish documentation (#4731)
- refactor(media-types): minor cleanups (#4743)

#### @std/net 0.224.1 (patch)

- test(net): improve test coverage (#4709)

#### @std/path 0.225.1 (patch)

- chore(fmt,fs,path,internal): skip yanked version manually (#4753)

#### @std/uuid 0.224.1 (patch)

- refactor(uuid): factor out common symbols into `common` module (#4749)

#### @std/webgpu 0.224.1 (patch)

- test(webgpu): remove `Deno.resources()` usage (#4708)

### 2024.05.07

#### @std/assert 0.225.1 (patch)

- test(assert): improve test coverage (#4679)

#### @std/bytes 1.0.0-rc.1 (prerelease)

- feat(bytes): `@std/bytes@1.0.0-rc.1` (#4651)
- docs(bytes): fix return type description for `concat()` (#4668)
- docs(bytes): update API doc of lastIndexOfNeedle (#4665)

#### @std/cli 0.224.1 (patch)

- fix(cli): spinner support NO_COLOR (#4662)

#### @std/collections 0.224.1 (patch)

- fix(collections): correct error class when `chunk()` throws (#4682)
- docs(collections): complete documentation (#4664)
- refactor(collections): minor cleanups (#4681)

#### @std/log 0.224.1 (patch)

- feat(log): make `FileHandler` and `RotatingFileHandler` buffer size
  configurable (#4680)

### 0.224.0 / 2024.04.25

- deprecation(permissions): update removal time for `std/permissions` (#4575)
- deprecation(semver): rename `testRange()` to `satisfies()` (#4364)
- feat(http): file server prints local network address (#4604)
- fix(bytes): `equals()` works with subarray (#4630)
- fix(bytes): improve invalid count error message for `repeat()` (#4603)
- fix(csv): do not print empty header line when no columns are given in
  `stringify()` (#4610)
- fix(csv): remove unused `opt` parameter (#4598)
- fix(fs/ensure_dir): allow links to directories (#4132)
- fix(path): export private types used in public API (#4645)
- perf(bytes): improve performance of `equals()` (#4635)

### 0.223.0 / 2024.04.15

- deprecation(expect): rename `addSnapshotSerializers` to
  `addSnapshotSerializer` (#4582)

### 0.222.1 / 2024.04.11

- deprecation(semver): deprecate `rangeMax()` and `rangeMin()` (#4561)
- fix(log): Revert "deprecate(log): deprecate internal utility methods" (#4436)
  (#4572)

### 0.222.0 / 2024.04.11

- [unstable] BREAKING(semver): remove comparator.semver field (#4533)
- deprecate(log): deprecate internal utility methods (#4436)
- deprecation(console): copy `std/console` APIs into `std/cli` and deprecate
  `std/console` (#4547)
- deprecation(crypto): rename an export to match style guide, deprecating
  original and two other obsolete imports (#4525)
- deprecation(encoding): make exported function names consistent with
  `std/encoding` (#4555)
- deprecation(yaml): cleanup schema exports (#4566)
- feat(expect): support `expect.addSnapshotSerialize()` api (#4537)
- feat(semver): `greaterThanRange()` and `lessThanRange()` (#4534)
- feat(testing): add `after`, `before`, `test` aliases (#4541)
- fix(cli): make the output of `promptSecret()` consistent with `prompt()`
  (#4549)

### 0.221.0 / 2024.03.27

- feat(expect): add `expect.{closeTo, stringContaining, stringMatching}` (#4508)
- fix(_tools): update `check_deprecation` path exclusion to recognize Windows
  directory separators (#4519)
- fix(crypto): move FNV hashes from TypeScript to Rust/Wasm and implement
  iteration functionality (#4515)
- fix(expect/assert): missing constructor equality check (#4512)
- fix(fs): `SubdirectoryMoveError` extends `Error` correctly (#4528)
- fix(yaml): speciously restrictive type for `stringify()` (#4507)
- fix: use hyphens for JSR package exports (#4424)

### 0.220.1 / 2024.03.15

- fix(tar): leak in `Tar() checks directory entry type` test (#4490)

### 0.220.0 / 2024.03.14

- Revert "refactor(cli): cleanup `parse_args.ts` (#4189)" (#4485)
- add JSR link (#4456)

### 0.219.1 / 2024.03.08

- chore: fix for jsr publish (#4449)

### 0.219.0 / 2024.03.08

- [unstable] BREAKING(semver): remove `gtr()` and `ltr()` (#4450)
- [unstable] BREAKING(semver): remove `reverseSort()` (#4422)
- [unstable] BREAKING(semver): remove deprecated operators (#4423)
- feat(expect): support `expect.extend()` api (#4412)
- fix(expect): fix equality of iterables (#4286)
- fix(fs): `emptyDir()` test after workspace conversion (#4427)
- fix(fs): `expandGlob()` test after workspace conversion (#4428)
- fix(log): don't discard bytes >4096 in `FileHandler` (#4415)
- fix(path): fix common() results that depend on the order and/or number of
  input paths (#4414)

### 0.218.0 / 2024.02.29

- feat(assert): optional `reason` param for `unreachable` (#4404) (#4405)
- feat(collections): add `pick` and `omit` (#4218)
- feat(expect): add asymmetric matchers (any, anything, arrayContaining) (#4366)
- feat(uuid): add type predicate return type to validate (v4) (#4301)
- fix(fs/ensure_symlink): check symlink is pointing the given target (#4371)
- fix(log): add missing return types (#4401)

### 0.217.0 / 2024.02.22

- deprecation(semver): deprecate `==`, `===`, `!==`, and `""` operators (#4271)
- doc: fix `std/path/posix` link (#4337)
- feat(io): `iterateReader[Sync]()` (#4247)
- feat(io): un-deprecate `readerFromStreamReader()` (#4343)
- feat(testing): explicit resource management for `spy()` and `stub()` (#4306)
- fix(http): `version` from `deno.json` import (#4342)
- fix(media_types): load extensions when directly importing
  `extensionsByTypes()` (#4351)
- fix(semver): fix `prerelease` handlings in range utils (#4323)
- fix(semver): fix parse_range for `>x.y` pattern (#4350)

### 0.216.0 / 2024.02.15

- BREAKING(path): remove `path/windows/separator.ts` (#4292)
- BREAKING(semver): remove `SemVerRange` and `isSemVerRange()` (#4295)
- BREAKING(semver): remove `eq()`, `gt()`, `gte()`, `lt()`, `lte()` and `neq()`
  (#4294)
- BREAKING(semver): remove `outside()` (#4293)
- feat(datetime): `format()` options (#4285)
- fix(semver): return new object instance in `comparatorMin()` and
  `comparatorMax()` (#4314)

### 0.215.0 / 2024.02.08

- BREAKING(log): remove `WARNING` log level (#4258)
- BREAKING(path): remove `glob.ts` files (#4259)
- BREAKING(path): remove `separator.ts` files (#4260)
- BREAKING(semver): remove `Comparator` functions (#4278)
- BREAKING(semver): remove `rangeFormat()` (#4265)
- BREAKING(semver): remove `sort()` (#4264)
- deprecation(semver): deprecate `ltr()` and `gtr()` (#4228)
- deprecation(semver): deprecate `reverseSort()` (#4280)
- feat(expect): add `expect.addEqualityTesters` api. (#4255)
- fix: version bump workflow (#4288)
- refactor(dotenv): prepare for `noUncheckedIndexedAccess` (#4261)
- refatcor(toml): prepare for `noUncheckedIndexedAccess` (#4274)

### 0.214.0 / 2024.02.01

- BREAKING(io): remove `types.d.ts` (#4237)
- BREAKING(log): remove string formatter (#4239)
- BREAKING(log): single-export handler files (#4236)
- BREAKING(streams): remove `readAll()`, `writeAll()` and `copy()` (#4238)
- feat(tools,log,http,semver): check mod exports, export items consistently from
  mod.ts (#4229)
- fix(expect): add Error object equal check. (#4248)
- fix(expect): align `toEqual` to jest (#4246)

### 0.213.0 / 2024.01.25

- BREAKING(http): remove `CookieMap` (#4179)
- BREAKING(semver): remove `FormatStyle` (#4182)
- BREAKING(semver): remove `compareBuild()` (#4181)
- BREAKING(semver): remove `rsort()` (#4180)
- deprecation(path): split off all constants into their own files and deprecate
  old names (#4153)
- deprecation(semver): deprecate `SemVerRange`, introduce `Range` (#4161)
- deprecation(semver): deprecate `outside()` (#4185)
- deprecation(semver): rename `eq()`, `neq()`, `lt()`, `lte()`, `gt()` and
  `gte()` (#4083)
- feat(collections): pass `key` to `mapValues()` transformer (#4127)
- feat(io): un-deprecate `Buffer` (#4184)
- feat(log): make handlers disposable (#4195)
- feat: print warning on use of deprecated API (#4200)
- fix(expect): fix the function signature of `toMatchObject()` (#4202)
- fix(flags): correct deprecation notices (#4207)
- fix(fmt): correct `stripColor()` deprecation notice (#4208)
- fix(log): make `flattenArgs()` private (#4214)
- fix(toml): `parse()` duplicates the character next to reserved escape
  sequences (#4192)
- fix: ignore linting for `Deno.serveHttp()` (#4234)
- fix: ignore linting rule for `Deno.resources()` (#4233)

### 0.212.0 / 2024.01.12

- BREAKING(encoding): remove `base32.byteLength()` (#4173)
- BREAKING(log): remove deprecated APIs (#4104)
- BREAKING(semver): remove `SemVerComparator` (#4109)
- BREAKING(semver): remove `canParse()` non-string overload (#4108)
- BREAKING(semver): remove `cmp()` (#4171)
- BREAKING(semver): remove `isSemVerComparator()` (#4107)
- BREAKING(semver): remove `parse(semver: string)` overload (#4172)
- BREAKING(semver): remove `rcompare()` (#4106)
- BREAKING: remove `std/signal` sub-module (#4105)
- deprecation(io): move types file (#4133)
- deprecation(log): deprecate `LogLevels.WARNING` (#4170)
- deprecation(log): move handlers to single-export files (#4176)
- deprecation(log): rename `warning()` to `warn()` (#4117)
- deprecation(semver): deprecate `Comparator` functions (#4131)
- deprecation(semver): deprecate `sort()` (#4098)
- deprecation(semver): rename `rangeFormat()` to `formatRange()` (#4090)
- feat(cli): make `Spinner.color` public (#4092)
- feat(io): re-introduce IO functions (#4128)
- feat(net): add `preferredPort` option to `getAvailablePort()` (#4151)
- feat(text): cases (#4082)
- fix(fs): reduce perm requirement of `ensureDir()` (#4041)
- fix(http): punt removal version of `unstable_cookie_map.ts` (#4125)
- fix: add `--no-lock` to spawned process args in tests (#4168)
- fix: use `with` keyword for import attributes (#4141)

### 0.211.0 / 2024.01.04

- BREAKING(collections): remove `groupBy()` (#3923)
- BREAKING(crypto): remove stable `KeyStack()` (#4055)
- BREAKING(front_matter): remove deprecated APIs (#4013)
- BREAKING(http): remove deprecated `createCommonResponse()` and `Status` APIs
  (#4014)
- BREAKING(path): remove deprecated APIs (#4016)
- BREAKING: remove `types.d.ts` at top level (#3922)
- deprecation(log): string type for `BaseHandler.formatter` (#4023)
- deprecation(semver): deprecate `compareBuild()` (#4088)
- deprecation(semver): deprecate `format()` `style` argument (#4050)
- deprecation(semver): deprecate `testComparator()` (#4037)
- deprecation(semver): deprecate cmp (#4025)
- deprecation(semver): rename rsort to reverseSort (#4032)
- feat(cli): make `Spinner.message` able to be changed on-the-fly (#4079)
- feat(semver): optional SemVer build and prerelease properties (#4024)
- fix(cli): document milliseconds unit for `Spinner.interval` (#4017)
- fix(cli/spinner): export private type aliases used in public API (#4012)
- fix(expect): align toEqual to jest (#4034)
- fix(expect): align toStrictEqual behavior to jest (#4035)
- fix(expect): invalid return typing (#4011)
- fix(fs): fix `expandGlob()` test race condition (#4081)
- fix(semver): remove `undefined` return type from `rangeMax()` (#4089)
- fix(toml): testdata typo (#4074)

### 0.210.0 / 2023.12.21

- BREAKING(crypto): remove `toHashString()` (#3924)
- BREAKING(encoding): remove deprecated APIs (#3952)
- BREAKING(http): remove deprecated `std/http/method` API (#3951)
- deprecation(encoding): deprecate `base32.byteLength()` (#4000)
- deprecation(semver): comparator min and max properties (#3974)
- deprecation(semver): deprecate `SemVer` argument for `parse()` and
  `canParse()` (#3939)
- deprecation(semver): deprecate `rcompare()` (#3958)
- deprecation(semver): rename `isSemVerComparator()` (#3957)
- deprecation(signal): move deprecation forward (#4004)
- feat(cli): command line spinner (#3968)
- feat(collections): improve `mapValues()` typing (#3978)
- feat(log): add support for structured JSON logging (#3960)
- feat(testing): enable the `using` keyword on `FakeTime()` (#3961)
- fix(http): account for period in signed cookie name (#3977)
- fix(path/extname): fix incorrect import (#3970)
- perf(streams): make `toBlob()` 20-30% faster (#3934)

### 0.209.0 / 2023.12.13

- BREAKIING(fs): remove `EOL` enum, add OS-dependent `EOL` (#3850)
- BREAKING(async): remove deprecated `deferred()` (#3852)
- BREAKING(bytes): remove spread `concat()` overload (#3854)
- BREAKING(collections): remove deprecated APIs (#3853)
- BREAKING(datetime): remove `toIMF()` (#3849)
- BREAKING(http): remove `ServerSentEvent()` (#3847)
- BREAKING(media_types): remove `typeByExtension()` (#3848)
- Revert "BREAKING(media_types): remove `typeByExtension()`" (#3877)
- deprecate(log): remove enums and add deprecation notices (#3855)
- deprecation(front_matter): move `Format` enum deprecation forward (#3931)
- deprecation(io): IO types in favour of Web Streams API (#3903)
- deprecation: move `types.d.ts` to `std/io` (#3885)
- feat(cli): `promptSecret()` (#3777)
- feat(expect): support message checks in expect().toThrow (#3938)
- feat(http): `signCookie()`, `verifyCookie()` and `parseSignedCookie()` (#3905)
- feat(net): `getAvailablePort()` (#3890)
- feat: add `std/ini` (#3871)
- feat: new `std/webgpu` sub-module (#3119)
- fix(assert): disallow scalar string args in `assertArrayIncludes()` (#3910)
- fix(assert): export parameter type alias for `assertArrayIncludes()` (#3917)
- fix(assert): fix diff of long string in objects (#3867)
- fix(cli): re-export promptSecret from mod.ts (#3944)
- fix(fs): improve `exists()` test coverage (#3898)
- fix(text): fix closestString (#3936)
- fix(toml): handle CRLF as newline in parsing multiline string (#3920)
- fix(tools): ignore the .git folder when checking for copyright header (#3937)
- perf(async): remove event listener ASAP in `abortablePromise()` and
  `abortableAsyncIterable()` (#3909)
- perf(crypto): use `Promise.all()` for `KeyStack` data comparisons (#3919)
- perf(encoding): increase `varint.decode()` performance by 45x (#3940)

### 0.208.0 / 2023.11.24

- BREAKING(collections): deprecate `groupBy()` (#3663)
- BREAKING: deprecate `std/http/method` (#3834)
- feat(assert): improve assertion message of `assertNotStrictEquals()` (#3820)
- feat(crypto): support `BLAKE2B-160` algorithm (#3793)
- feat: add std/expect (#3814)

### 0.207.0 / 2023.11.17

- BREAKING(bytes): deprecate `concat()` signatures that don't use `Uint8Array[]`
  argument (#3784)
- BREAKING(crypto): remove `crypto.subtle.timingSafeEqual()` method (#3803)
- BREAKING(fs): deprecate `EOL` enum (#3809)
- BREAKING(http): deprecate `ServerSentEvent()` (#3783)
- BREAKING(http): deprecate `enum Status` in favour of `STATUS_CODES` object
  (#3781)
- BREAKING: move `std/flags` to new `std/cli` sub-module (#3530)
- BREAKING: remove deprecated `std/http/http_errors` (#3737)
- BREAKING: remove deprecated `std/wasi` module (#3733)
- feat: `std/data_structures` (#3734)

### 0.206.0 / 2023.11.10

- BREAKING(async): deprecate `deferred()` in favor of `Promise.withResolvers()`
  (#3758)
- BREAKING(encoding): remove deprecated binary APIs (#3763)
- BREAKING(path): split up glob into multiple files
- add `deno fmt --check`
- feat(testing/mock): enable `spy` to accept a class constructor (#3766)
- feat: `ServerSentEventStream()` (#3751)
- feat: add `std/text` with word-similarity helpers (#3488)
- fix(fmt): format duration rounding error. (#3762)
- fix(msgpack): encode huge objects (#3698)
- fix: broken import
- fix: rework file server tests (#3779)
- perf(streams): add single-character fast path for `DelimiterStream()` (#3739)

### 0.205.0 / 2023.11.01

- BREAKING(dotenv): remove deprecated `restrictEnvAccessTo` option (#3705)
- BREAKING(http): move cookie_map, errors, server_sent_event, and method to
  unstable category, deprecate server.ts (#3661)
- BREAKING: deprecate `std/wasi` (#3732)
- BREAKING: remove deprecated `BytesList()` (#3740)
- BREAKING: remove deprecated `std/csv` exports (#3704)
- feat(fs): introduce `canonicalize` option to `WalkOptions` (#3679)
- feat(semver): canParse (#3709)
- fix(fs): `expandGlob`/`expandGlobSync` don't require full `--allow-read` perms
  on granted read permissions (#3692)
- fix(http): file server with showDirListing + urlRoot (#3691)
- fix: flaky `http/file_server.ts` tests (#3717)

### 0.204.0 / 2023.10.12

- BREAKING(front_matter): deprecate Format enum, use union type instead (#3641)
- BREAKING(front_matter): deprecate language-specific `test` functions (#3654)
- BREAKING(path): split path into per-os modules, deprecate legacy os-specific
  exports (#3649)
- feat(crypto): add BLAKE2B-128 hash algorithm (#3680)
- fix(archive/untar.ts): cannot access symlinks in archives (#3686)
- fix(assert): fix swapping of multiline str diff (#3685)
- perf(encoding): optimize encodeBase64Url (#3682)
- perf: improvements using `Promise.all()` (#3683)

### 0.203.0 / 2023.09.27

- BREAKING(encoding): deprecate encode/decode, add encodeFoo/decodeFoo (#3660)
- BREAKING(encoding): deprecate old encode/decode in hex.ts (#3673)
- BREAKING(front_matter): deprecate default exports (#3653)
- BREAKING(io): deprecate io top level module (#3556)
- fix(collections): accept read-only arrays in aggregateGroups, reduceGroups,
  zip (#3662)
- fix(datetime): correctly format midnight in 12-hour time (#3667)
- fix(datetime): fix dayOfYear when the timezone has DST (#3668)
- fix(encoding): add validation of the input types (#3666)
- fix(semver): add a necessary grouping, fix prerelease parsing (#3674)

### 0.202.0 / 2023.09.19

- BREAKING(collections): move RedBlackTree, BinarySearchTree, and BinaryHeap to
  'unstable' subdir (#3628)
- BREAKING(crypto): clean up module (#3630)
- BREAKING(csv): deprecate error message exports (#3602)
- BREAKING(datetime): deprecate to_imf.ts (#3633)
- BREAKING(media_types): deprecate typeByExtension (#3622)
- BREAKING(streams): deprecate APIs based on legacy Reader/Writer interfaces
  (#3640)
- feat(encoding): add encodeHex, decodeHex (#3642)
- feat(streams): to ArrayBuffer/Blob/Json/Text (#3631)
- feat(ulid): port /x/ulid module (#3582)
- fix(streams): DelimiterStream regression (#3611)
- fix(stripAnsiCode): escape erase character (#3608)
- fix(testing/snapshot): distinguish between singular and plural forms (#3625)
- fix(testing/time): fix FakeTime.next to return false if all timers are cleared
  (#3638)
- fix(url): fixes for url functions and new tests. (#3607)

### 0.201.0 / 2023.09.01

- BREAKING(bytes): deprecate BytesList class (#3589)
- BREAKING(crypto): deprecate crypto.subtle.timingSafeEqual() (#3596)
- BREAKING(dotenv): fix dotenv permissions (#3578)
- BREAKING(encoding): deprecate encoding/binary (#3584)
- BREAKING(fmt): rename stripColor to stripAnsiCode (#3588)
- BREAKING(permissions): deprecate permissions module (#3567)
- BREAKING(semver): remove deprecated APIs (#3591)
- BREAKING(signal): deprecate signal module (#3568)
- BREAKING(streams): remove readable_stream_from_iterable (#3579)
- BREAKING(yaml): change binary handling (#3586)
- feat(assert): add inequality asserts (#3496)
- feat(std): add `std/url` module. (#3527)
- fix(assert): properly quote strings in assertIsError (#3577)
- fix(fmt): make printf respect NO_COLOR (#3595)
- fix(log): rotating file handler sync setup and destroy (#3543)

### 0.200.0 / 2023.08.24

- doc: add complete docs for all dotenv functionality (#3560)

### 0.199.0 / 2023.08.21

- fix(collections): redblack tree and bst not being exported from mod (#3528)
- fix(http/cookie_map): add maxAge to set/delete options (#3524)
- fix(log): fix serializing BigInt value in object (#3550)
- fix(path): typo in comment in _resolve (#3545)
- fix(testing/time): fix FakeTime.restoreFor accuracy for sync callbacks (#3531)
- perf: repoint internal imports to single-export files (#3537)

### 0.198.0 / 2023.08.10

- feat(path): single file exports (#3510)

### 0.197.0 / 2023.08.03

- BREAKING(testing/snapshot): change tab char serialization (#3447)
- BREAKING(testing/snapshot): fix regression of serialization of long strings
  (#3507)
- feat(fs/walk): include symlink option (#3464)
- fix(toml/parse): fix edge cases (#3509)

### 0.196.0 / 2023.07.26

- BREAKING(http/server): deprecate serve and serveTls (#3381)
- fix(http): fix handling of string port number (#3499)

### 0.195.0 / 2023.07.19

- BREAKING(streams): deprecate readableStreamFromIterable (#3486)
- BREAKING(testing, assert): move `std/testing/asserts` to `std/assert` (#3445)
- feat(fmt): enable `setColorEnabled` in browsers (#3485)
- fix(async/delay): reject with existing AbortSignal reason (#3479)

### 0.194.0 / 2023.07.12

- feat(collections): allow PropertyKey for groupBy key (#3461)
- feat: msgpack encoding (#3460)

### 0.193.0 / 2023.07.04

- feat: add http/user_agent (#3387)
- fix(json): allow primitives at top level without separator (#3466)
- fix(testing/asserts): handle primitive/null values better in assertObjectMatch
  (#3468)

### 0.192.0 / 2023.06.15

- BREAKING(semver): rewrite semver (#3385)
- feat(testing): report the number of removed snapshots (#3435)
- fix(datetime/day_of_year): respect time zone of date (#3443)
- fix(http/file_server): resolve empty subdir correctly on Windows (#3439)
- fix(testing/time): use real Date in FakeTime (#3414)
- fix(yaml): parse always return null when file is empty, whitespace or only
  comments (#3442)

### 0.191.0 / 2023.06.08

- BREAKING(csv,http,path): remove deprecated APIs (#3418)
- feat(async/retry): introduce jitter option and fix retry bugs (#3427)
- feat(collections): switch functions to take iterables when possible (#3401)
- feat(collections/sort_by): descending order can be specified in options
  (#3419)
- feat(crypto): add BLAKE2B-224 hashing algorithm in crypto (#3392)
- feat(html): add escape and unescape functions for HTML entities (#3335)
- fix(http/file_server): use platform specific `resolve` (#3424)
- fix(streams/mergeReadableStreams): better error handling (#3395)
- fix(toml): various edge case fixes for `toml.stringify` (#3403)

### 0.190.0 / 2023.05.29

### 0.189.0 / 2023.05.24

- feat(async): add jitter to retry exponential backoff (#3379)
- feat(collections/group_by): accept iterable input, add index param to callback
  (#3390)

### 0.188.0 / 2023.05.18

- fix(flags): correctly collect default value (#3380)

### 0.187.0 / 2023.05.12

- feat(collections): add `partitionEntries` (#3365)
- feat(regexp): add escape function (#3334)
- fix(datetime): negative months, quarters, and years (#3367)
- fix(http/file_server): dealing with dir listing view that contain system files
  (#3371)
- fix(http/file_server): redirect non-canonical URL to canonical URL (#3362)
- perf(http/file_server): read fileinfo in parallel (#3363)

### 0.186.0 / 2023.05.04

- BREAKING(path): deprecate path.sep (#3342)
- feat(async): support `signal` on `deadline()` (#3347)
- feat(async/pool): use browser compatible APIs (#3350)
- feat(http): add HTTP_METHODS, HttpMethod, and isHttpMethod (#3309)
- feat(uuid): add pre-defined namespace UUIDs (#3352)
- fix(http/file_server): fix `Range` header handling (#3354)
- fix(http/server): flaky 'address in use' error (#3333)
- fix(http/server_sent_event): fix Uncaught TypeError if created without
  optional EventInit (#3356)

### 0.185.0 / 2023.04.27

- feat(dotenv): allow reading from `.env` files without granting env access
  (#3306)
- feat(jsonc): annotate return types (#3327)
- feat(uuid): uuid v3 (#3324)
- perf(http/file_server): avoid calculating Content-Type when 304 Not Modified
  response (#3323)

### 0.184.0 / 2023.04.18

- BREAKING(encoding): remove deprecated APIs (#3303)
- BREAKING(encoding): remove deprecated APIs (#3315)
- feat(console): add unicodeWidth for TTY text layout (#3297)
- feat(testing): add .skip alias to bdd test API (#3300)
- fix(http): move deno deploy specific logic from `etag.ts` to `file_server.ts`
  (#3316)
- fix(http/file_server.ts): respond to Range requests with correct byte length
  (#3319)

### 0.183.0 / 2023.04.12

- BREAKING(csv): rename `CsvStream` to `CsvParseStream` (#3287)
- BREAKING(encoding/varint): remove deprecated APIs (#3282)
- feat(datetime): add isUtcLeap (#3295)
- feat: add http/etag (#3245)
- fix(bytes): correct slice() of BytesList (#3292)
- fix(csv): improve typing for CSV parser (#3267)
- fix(dotenv): allow `null` for `*path` values (#3221)
- fix(encoding/ascii85): fix `encode()` returns a wrong result with a subarray
  (#3310)
- fix(fs): fix NotFound error when moving src to itself with overwrite: true
  (#3289)

### 0.182.0 / 2023.03.31

- feat(csv): add `CsvStringifyStream` (#3270)
- feat(fs): undo deprecation of `exists` and add permission and type check to it
  (#2785)
- feat(fs/walk): WalkError class (#3054)
- feat: disposition on TextDelimiterStream (#3273)
- fix(csv/csv_stringify_stream): output headers based on `columns` option
  (#3293)
- fix(encoding/base58): fix base58 decoding missing the first byte (#3275)

### 0.181.0 / 2023.03.22

- feat(front_matter): support +++ for TOML block (#3254)
- feat(testing/asserts): include `msg` in assertion errors (#3253)

### 0.180.0 / 2023.03.16

- BREAKING(csv): move `encoding/csv` to own top-level folder and towards
  single-export files (#3228)
- BREAKING(front_matter): move to top-level folder (#3252)
- BREAKING(json): move to top-level folder and towards single-export files
  (#3236)
- BREAKING(jsonc): move to top-level folder and single-export files (#3243)
- BREAKING(toml): move to top-level folder and towards single-export files
  (#3241)
- BREAKING(yaml): move to top-level folder (#3251)
- feat(http): add http/server_sent_event (#3239)

### 0.179.0 / 2023.03.10

- BREAKING(encoding/varint): deprecate Wasm implementation in favour of native
  TypeScript (#3215)
- feat(fs): add followSymlink to expandGlob (#3093)
- fix(fs/ensureDir): fix racy ensureDir (#3242)
- fix(fs/ensure_symlink): lstat relative symlink properly (#3216)
- fix(http/cookie): accept cookies with value containing = character (#3152)
- fix(http/file_server): redirect directory URLs that don't end with a slash
  (#3220)

### 0.178.0 / 2023.02.23

- Remove std/node, it was merged into Deno itself (#3206)
- feat(encoding/csv/streaming): add `skipFirstRow` and `columns` options (#3184)
- feat(http/file_server): etag value falls back to `DENO_DEPLOYMENT_ID` if
  `fileInfo.mtime` is not available (#3186)
- feat(streams/delimiter_stream): add disposition option (#3189)
- fix(crypto): create DataView with correct byteLength in timingSafeEqual
  (#3208)
- fix(encoding/yaml): avoid prototype pollution in Node.js and Browser (#3173)
- fix(node): do not ask env permission from process.env access (#3178)
- fix(node/child_process): "windowsVerbatimArguments" option should be
  automatically set to true for CMD in spawn() (#3167)
- fix(node/fs): chmod function throws unnecessary TypeError on Windows (#3168)
- fix: change `BigInt` type to `bigint` type (#3187)

### 0.177.0 / 2023.02.06

- feat(encoding/csv): handle CSV byte-order marks (#3143)
- fix(node/child_process): enable promisify(execFile) (#3161)
- fix(node/process): null is not returned when reaching end-of-file in stdin
  (#3113)
- fix(semver): allow unsetting build metadata (#3157)

### 0.176.0 / 2023.02.02

- fix(node): disable worker_threads (#3151)
- fix(node): throw permission error instead of unknown error (#3133)
- fix(node/util): stricter runtime type checking (#3122)
- fix: make encoding/front_matter work in a browser (#3154)

### 0.175.0 / 2023.01.28

- BREAKING(dotenv,fmt,io): remove deprecated APIs (#3134)
- BREAKING(path): rework basename and dirname to be coreutils compatible (#3089)
- feat(node): AsyncLocalStorage (#3137)
- feat(semver): add support for build metadata (#3126)

### 0.174.0 / 2023.01.25

- feat(fmt/printf): add formatter i/I (Deno.inspect) (#3100)
- fix(encoding/csv): escape cells containing newlines (LFs) (#3128)

### 0.173.0 / 2023.01.16

- BREAKING(streams, archive): remove deprecated exports (#3107)
- fix(fs): change globstar default to true for expandGlob and expandGlobSync
  (#3115)
- fix(streams): prevent artificial terminal newline in `TextLineStream` (#3103)
- fix: revert "feat(node/cluster): `cluster` module for Node compat (#2271)"
  (#3111)

### 0.172.0 / 2023.01.13

- feat(collection): add toArray method to BinaryHeap (#3079)
- feat(node/cluster): `cluster` module for Node compat (#2271)
- fix(datetime): `.quarter` calculation for `difference()` (#3085)
- fix(encoding/jsonc): avoid prototype pollution in Node.js and Browser (#3077)
- fix(node): support ref & unref of TCP handle (#3102)
- fix(path): correctly handle trailing slashes for posix basename (#3088)

### 0.171.0 / 2023.01.05

- feat(http): add --header option to file_server (#2977)
- feat(node): Add support for os.uptime (#3052)
- feat(node/diagnostics_channel): initial implementation (#3050)
- feat(node/url): domainToASCII/domainToUnicode (#3022)
- fix(flags): parse method looses types in certain cases with collect option
  (#3040)
- fix(flags): types for aliases defined as array are ignored (#3043)
- fix(node/http): avoid empty chunk issue of flash (#3062)
- fix(node/http): ignore body when status code is one of 101, 204, 205, 304
  (#3067)
- fix(node/util): reference error of 'process' (#3037)
- fix(path): correctly handle trailing slashes for basename (#3068)
- fix(testing): do not mutate tokens when creating details (#3049)
- fix: don't use windows-xl runners, too expensive (#3021)

### 0.170.0 / 2022.12.19

- Revert "fix(node/http): do not buffer first chunk (#2989)" (#3013)

### 0.169.0 / 2022.12.19

- feat(datetime): single-export files (#3007)
- feat(media_types): single-export files (#3001)
- fix(http): prevent downstream connections from getting closed when the
  response stream throws an error (#3008)
- fix(node): add missing exports to `process` (#3014)

### 0.168.0 / 2022.12.14

- BREAKING(archive): move to single-export files (#2958)
- BREAKING(dotenv): rename config to load (#2616)
- BREAKING(io): single-export files (#2975)
- fix(encoding): base58 decoding (#2982)
- fix(node): fix nextTick shim in deploy (#2980)
- fix(node): ignore NotSupported errors coming from `Deno.chmod` (#2996)
- fix(node/http): do not buffer first chunk (#2989)
- perf(encoding/yaml) Don't allocate buffers unnecessarily (#2967)
- perf(node/buffer): improve utf8 decoding performance (#2986)

### 0.167.0 / 2022.12.01

- Reorder steps to view documentation (#2948)
- Revert "test(node/http): modify writable of ClientRequest (#2945)" (#2950)
- feat(async): retry (#2929)
- feat(dotenv): support type inference based on `restrictEnvAccessTo` option
  (#2933)
- feat(node): add os.version (#2962)
- feat(node): add util.types.isProxy (#2960)
- feat(testing): add conditional type check utils (#2864)
- fix(node/tls): implement secureConnect event (#2926)

### 0.166.0 / 2022.11.24

- BREAKING(fmt/bytes): rename prettyBytes to format (#2896)
- BREAKING(fmt/duration): rename prettyDuration to format (#2871)
- feat(http/cookie): allow number type for expires param (#2932)
- feat(node): export `process.argv` (#2924)
- feat(node/crypto): add hmac implementation (#2664)
- feat: Add process._kill and shim process.kill(pid, 0) correctly (#2922)
- fix(fmt/bytes): default local decimal and group symbols (#2904)
- fix(http/cookie): wording for cookie value validation error (#2931)
- fix(node/console): update export members of console (#2927)
- fix(node/fs): enable type narrowing with instanceof for ReadStream and
  WriteStream (#2915)
- fix(node/http): allow setting statusMessage (#2911)
- fix(node/http): disable chunked request if Content-Length header is specified
  (#2755)
- fix(node/http): request with headers (#2898)
- fix(node/string_decoder): proper buffer type casting and fix default logic
  (#2897)
- fix(node/timers): implement timeout.refresh (#2919)
- fix: wait for denoflate wasm to load (#2923)

### 0.165.0 / 2022.11.16

- fix(node): improve crypto.getHashes compatibility (#2890)
- fix(node): issues with browser (#2892)
- fix: allow creating http.IncomingRequest without url being set (#2893)

### 0.164.0 / 2022.11.13

- feat(fmt): add `prettyDuration` (#2861)
- feat(http/file_server): add -v, --version option (#2868)
- fix(node/fs): improve fs.read compatibility (#2880)
- fix(node/http): add .finished property to ServerResponse (#2878)
- fix(node/http): fix non-string buffer response (#2863)
- node: mock ClientRequest.setTimeout (#2875)
- perf(node/string_decoder): use native decoder for GenericDecoder (#2858)

### 0.163.0 / 2022.11.08

- chore: upgrade rust to 0.165.0 and wasmbuild to 0.10.2 (#2850)
- chore(semver): rename inc and diff (#2826)
- docs(encoding): remove `await` (#2831)
- docs(encoding): remove `ColumnDetails["fn"]` (#2840)
- docs(flags): fix broken link to minimist (#2842)
- docs(fs): remove misleading docs from fs.walk (#2836)
- docs(log): add note for module authors (#2843)
- refactor: cleanup check licence headers tool (#2830)
- refactor(_tools): use `fs/walk` in deprecations check (#2837)
- refactor(_util): remove `deepAssign` (#2847)
- refactor(crypto): move `crypto/_wasm_crypto/` to `crypto/_wasm/` (#2845)
- refactor(encoding): move `varint/_wasm_varint/` to `varint/_wasm/` (#2844)

### 0.162.0 / 2022.11.03

- feat(encoding/front_matter): add support for different formats of front matter
  (#2801)
- feat(streams): add ByteSliceStream (#2795)
- feat(tools): add import path check in docs (#2820)
- fix(dotenv): Empty string crashing parsing (#2819)
- fix(flags): set boolean aliases to false by default (#2824)
- fix(node): `node:setup` task honours `-y` flag (#2825)
- fix(node/fs): add support for numeric flags in `fs.open()` (#2828)

### 0.161.0 / 2022.10.26

- BREAKING: remove deprecated `std/hash` module (#2786)
- feat(crypto): `createHash` utility (#2805)
- feat(crypto): `toHashString` utility (#2767)
- feat(node): add support of .node module (#2804)
- feat(node): list remaining Node tests in documentation (#2787)
- fix(fs/expandGlob): globstar false does not take effect (#2571) (#2779)
- fix(node/fs): enable to check error thrown on invalid values of bufferSize
  (#2782)
- fix(node/net): modify close event timing (#2793)

### 0.160.0 / 2022.10.17

- feat(crypto): export algorithm types (#2759)
- feat(node): add readline/promises (#2760)
- fix(node/child_process): add support of windowsVerbatimArguments option
  (#2781)
- fix(node/child_process): mock childProcess.disconnect method (#2776)
- fix(node/fs): make fs.access resolve on windows (#2775)
- fix(node/fs): resolve `Dirent` instead of Object (#2753)

### 0.159.0 / 2022.10.06

- BREAKING: deprecate `std/textproto` (#2737)
- feat(collections): improve types of `partition` module (#2744)
- feat(http/file_server): add `showIndex` option to serveDir (#2738)
- feat(node): new child_process.fork (#2700)
- feat(node/crypto): add base64url encoding to hash.digest() (#2740)
- feat(node/fs): Support more File system flags (#2725)
- fix(http): remove unnecessary delay when closing server (#2732)
- fix(http/file_server): handles path with reserved char (#2675)
- fix(node): debuglog callback should be optional (#2734)
- fix(node): handle inherited output in spawnSync() (#2743)
- fix(node/fs): Enable `test-fs-open.js` (#2715)
- fix(node/process): Deno 1.26 replaced Deno.setRaw with Deno.stdin.setRaw
  (#2710)
- fix(node/process): do not error assigning `false` to `process.env[VAR_NAME]`
  (#2716)
- fix(node/tls): fix TLSSocket constructor (#2749)
- fix(node/tls): set tlssocket._handle._parentWrap (#2750)
- fix(node/url): enable url.format function to handle a url object (#2747)
- fix(streams): don't use shared buffer for iterateReader outputs (#2735)
- perf(streams): memory optimizations by avoiding large buffer allocation in a
  loop (#2748)

### 0.158.0 / 2022.09.28

- feat(node): add child_process.exec() (#2684)
- feat(node): add child_process.execFileSync() (#2699)
- feat(node): add child_process.execSync() (#2689)
- feat(node/process): `process.getuid()` and `process.getgid()` (#2680)
- fix(http): `serve` swallows errors when `Response.body` has already been
  consumed (#2702)
- fix(node): `test-child-process-spawnsync-validation-errors.js` (#2690)
- fix(node): support mapping Node flags to Deno (#2688)
- fix(node/fs): Enable `test-fs-read-zero-length.js` and `test-fs-read-type.js`
  (#2692)
- fix(node/fs): improve compatibility of fs.WriteStream (#2696)
- fix: testing example pages failing to load (#2693)

### 0.157.0 / 2022.09.22

- feat(node/child_process): `spawnSync` (#2637)
- fix(collections): deepMerge ignoring 'replace' options for nested properties
  (#2681)
- fix(node): use `Buffer.from()` and `Buffer.alloc()` instead of `new Buffer()`
  (#2655)
- fix(node/fs): Enable `test-fs-read.js` (#2672)
- fix(node/fs): improve compatibility of fs.ReadStream (#2653)
- fix(node/fs): position option of fs.read and fs.readSync works the same as
  Node (#2669)
- fix(node/net): fix socket events order (#2676)
- fix(node/process): does not throw with invalid env var names (#2671)
- fix(node/process): ignore SIGTERM on windows (#2686)
- node: add FreeBSD support (#2467)

### 0.156.0 / 2022.09.15

- fix(fs): `ensureSymlink` works when symlink already exists (#2642)
- fix(http/file_server): serveFile returns 404 when the path is directory
  (#2659)
- fix(node): set proper default streams export (#2657)
- fix(node/fs): make ReadStream and WriteStream callable with or without new
  (#2634)
- fix(node/http): `_createUrlStrFromOptions` optimizations (#2635)
- fix(node/process): make execPath writable (#2647)
- fix(node/process): reduce required env permission range (#2654)

### 0.155.0 / 2022.09.09

- BREAKING(encoding/csv): make column argument optional (#2168)
- BREAKING(encoding/csv): sync stringify function (#2611)
- feat(dotenv): allow to restrict env lookup to specific Env variables (#2544)
- fix(async): restore `delay` browser compatibility (#2625)
- fix(log): make setup and destroy sync (#2532)
- fix(node): bump node version to latest stable (#2610)
- fix(node): use readable-stream from stream/promises (#2630)
- fix(node): vendor readable-stream from esm.sh (#2584)
- fix(node/process): revert workaround for stdin.isTTY (#2590) (#2614)
- fix(node/url): `urlObject.format` is not a function for object input (#2607)
- fix(testing/asserts): temporarily disable background colors in diff (#2601)

### 0.154.0 / 2022.09.01

- BREAKING(encoding/csv): remove ColumnOptions (#2536)
- BREAKING: replace ALL CAPS acronyms in public API names (#2582)
- feat(encoding): add base58 encoding/decoding feature (#2539)
- feat(fs): support URL params (#2573)
- feat(node): add Server.setTimeout() stub (#2564)
- feat(node/fs): add `opendir` and `opendirSync` (#2576)
- feat(testing): better assertFalse types (#2562)
- feat(testing): better assertNotInstanceOf types (#2558)
- fix(encoding/json): improve safety of `JSONValue` object type (#2565)
- fix(encoding/jsonc): Improve safety of `JSONValue` object type in `jsonc.ts`
  (#2568)
- fix(fs): use Deno.errors.AlreadyExists where appropriate (#2547)
- fix(node): change Promise.All to Promise.all (#2569)
- fix(node/fs): fix accessSync permission handling (#2570)
- fix(node/process): fix BadResource issue of stdin.isTTY (#2590)
- fix(node/readline): fix Interface constructor (#2588)

### 0.153.0 / 2022.08.24

- feat(async/delay): add persistent option (#2527)
- feat(crypto): add KeyStack for rotatable key data signing (#2303)
- feat(encoding/csv): sync parse (#2491)
- feat(http): add CookieMap and SecureCookieMap (#2502)
- feat(http): support cert, key options in serveTls (#2508)
- feat(http/cookie): add set-cookie headers parser (#2475)
- feat(http/file_server): return 404 response if file not found (#2529)
- feat(node): add types to fs/promises (#2518)
- feat(node): Handle "upgrade" event (#2457)
- feat(node): use Deno.serve() API for Node http polyfill (#2537)
- feat(testing/asserts): add assertNotInstanceOf (#2530)
- fix(collections): edge cases for BinaryHeap (#2525)
- fix(node): zlib bindings should use nextTick import (#2560)
- fix(node/events): export static setMaxListeners, listenerCount (#2523)
- fix(node/util.types): stricter checking of TypedArray (#2528)
- fix(testing): better assertEqual diff for object getters (#2509)

### 0.152.0 / 2022.08.11

- feat(crypto): add subtle.timingSafeEqual() (#2503)
- feat(testing): allow for stubbing non existent instance methods (#2487)
- node: add stub for child_process.execSync (#2513)
- node: remove import to global.ts from module_esm.ts (#2501)
- remove 'unhandledRejection' from list of unsupported events (#2500)

### 0.151.0 / 2022.08.04

- fix(node): fs.existsSync never throws (#2495)
- fix(node/fs): add watchFile & unwatchFile (#2477)
- fix(node/http,https): set the url protocol by default (#2480)

### 0.150.0 / 2022.07.28

- feat(http/http_errors): add headers property (#2462)
- feat(node): support uncaughtException and uncaughtExceptionMonitor (#2460)
- fix(io): StringWriter retaining references after write (#2456)
- fix(node): correct import specifiers (#2474)
- fix(node/fs): fix fs.watch (#2469)
- fix(node/process.env) support built-in object methods for process.env (#2468)
- node: ChildProcess.ref()/.unref() (#2395)
- node: Use "Deno.spawnChild" API for "child_process" polyfill (#2450)

### 0.149.0 / 2022.07.20

- feat(semver): add "semver" module (#2434)
- fix(node/module): improve error message of createRequire (#2440)
- fix(testing): add support for `PromiseLike` in `assertRejects` (#2443)
- node: process.on("beforeExit") (#2331)

### 0.148.0 / 2022.07.12

- fix(archive/tar): export TarEntry class (#2429)
- fix(encoding/csv/stream): cancel lineReader if readable is canceled (#2401)
- fix(node): add missing named zlib exports (#2435)
- node: handle v8 flag passed to child_process.fork (#2424)

### 0.147.0 / 2022.07.05

- feat(dotenv): add expand feature, move parse logic to RegExp (#2387)
- feat(dotenv): stringify (#2412)
- feat(http): add HTTP errors (#2307)
- feat(http): add content negotiation (#2302)
- feat: add createAssertSnapshot (#2403)
- fix(node/fs/exists): fix promisified exists (#2409)
- node: process.argv[1] uses phony local module if executing remote module
  (#2418)

### 0.146.0 / 2022.06.30

- BREAKING(collections): rename RBTree/BSTree to RedBlackTree/BinarySearchTree
  (#2400)
- feat(dotenv): include missing vars in MissingEnvVarsError (#2390)
- fix(encoding/json): add `null` to JSONValue union (#2384)
- fix(node): export createReadStream() from fs (#2393)
- fix(node): use call() to call prototype methods in inspect() (#2392)
- fix(node/zlib) zlib codes contains undefined values and keys (#2396)
- fix(streams/delimiter): avoid recursion in TextLineStream (#2318)
- fix(testing): break out of Set equality check on match (#2394)

### 0.145.0 / 2022.06.23

- fix(wasi): Fix WASI initialize() (#2372)
- feat(encoding): add json/stream.ts (#2231)
- feat(flags): infer argument types, names and defaults (#2180)
- feat(media_types): Improve contentType type definition (#2357)
- feat(node): add missing modules node/util/types.ts node/diagnostics_channel.ts
  (#2369)
- fix(encoding/csv/stream): properly handle CR characters (#2325)
- fix(http): Disable `console.error` if `opts.quiet` is true (#2379)
- fix(node): make performance object event target (#2371)
- fix(testing/bdd): fix flat test grouping context (#2308)
- node: improve error for unsupported import (#2380)

### 0.144.0 / 2022.06.15

- Add warning on usage of collections/mod.ts (#2321, #2346)
- encoding: add front matter module (#2335)
- feat(node): add missing TTY methods to stdout,stderr (#2337)
- fix: update ci script and fix type errors (#2344)

### 0.143.0 / 2022.06.09

- BREAKING feat(http): improve type safety and docs for http_status (#2297)
- BREAKING(flags): introduce negatable option (#2301)
- feat(encoding): add unsigned LEB128 varint encoding (#2265)
- feat(node/assert): add deepEqual and notDeepEqual (#2288)
- fix(dotenv): support inline comment (#2316)
- fix(media_types): work around type issues under Node.js (#2304)
- fix: pass resolved ephemeral port to onListen (#2311)

### 0.142.0 / 2022.06.02

- feat(crypto): add fnv algorithms (#2200)
- feat: add media_types (#2286)
- fix(node): type checking on AsyncResource (#2289)
- fix: assertSnapshot errors on empty snapshot in non-update mode (#2269)
- fix: put TextLineStream CR handling behind option (#2277)

### 0.141.0 / 2022.05.27

- BREAKING(flags): introduce `collect` option (#2247)
- BREAKING(testing): use Object.is() for strict equality (#2244)
- BREAKING(testing/asserts): remove implicit any types from assert signatures.
  (#2203)
- feat(http/util): add compareEtag (#2259)
- feat(node/crypto): stub out missing exports (#2263)
- feat(node/dns): `NAPTR`, `NS`, `CAA`, and `SOA` support (#2233)
- feat(streams): toTransformStream (#2227)
- feat(streams/delimiter): support `\r` in `TextLineStream` (#2267)
- feat(streams/merge): earlyZipReadableStreams (#2264)
- feat(testing/asserts): return error from `assertRejects` and `assertThrows`
  (#2226)
- fix(async/pooledMap): return ordered result (#2239)
- fix(node/fs): export fs.ReadStream (#2253)

### 0.140.0 / 2022.05.18

- feat(http): add onListen option to serve (#2218)
- feat(node/dgram): support dgram (udp) node module compat (#2205)
- fix(assertRejects): fails on synchronous throw #1302 (#2234)
- fix(collections): prevent cycles in deepMerge() (#2228)
- fix(encoding/csv): improve error message for csv's parse function (#2191)
- fix(http/file_server): fix handling of 'W/' prefixed etag (#2229)
- fix(testing/bdd): support using bdd tests with dnt (#2235)
- fix: add toJSON to node/perf_hooks.ts (#2209)

### 0.139.0 / 2022.05.12

- feat(encoding): add jsonc parser (#2154)
- feat(node/dns): Implement Resolver APIs (#2201)
- feat(node/net): unix domain socket support (#2146)
- feat(testing/snapshot): add "assertSnapshot" options overload (#2179)
- fix(node/module): interpret length parameter as optional in blitBuffer (#2199)
- fix(node/timers): set custom promisify function (#2198)

### 0.138.0 / 2022.05.05

- fix: Export equalSimd and equalsNaive (#2187)
- BREAKING(testing/snapshot): change multiline string serialization (#2166)
- feat(node/dns): support dns promises lookup (#2164)
- feat(testing): assertFalse (#2093)
- fix(node/dns): export more types (#2185)
- fix(node/worker_threads): Don't wait for parent message in web worker (#2182)
- fix(testing): Compare circular objects (#2172)

### 0.137.0 / 2022.04.28

- feat(testing): infer stub and spy return types from properties (#2137)
- fix(http): export interface ServeTlsInit (#2148)
- fix(node): use Web Crypto API via globalThis (#2115)
- fix(wasi): ContextOptions is an optional argument (#2138)
- http: serve() should log where it is listening (#1641)

### 0.136.0 / 2022.04.21

- feat(testing): Implement "assertSnapshot" (#2039)
- feat(testing): add TestContext argument to "it" function (#2117)
- fix(http): use the `addEventListener` method instead of `onabort` properties
  (#2124)
- fix(node/crypto): fix randomInt (#2101)
- perf(http): optimize file server (#2116)

### 0.135.0 / 2022.04.14

- BREAKING(io/readers): use an array as a MultiReader constructor parameter to
  avoid Maximum call stack size exceeded (#2016)
- BREAKING(mime/multipart): deprecate mime/multipart module (#2105)
- BREAKING(testing/bench): deprecate testing/bench module (#2104)
- feat(node): `Duplex.fromWeb` (#2086)
- feat(testing): add behavior-driven development (#2067)
- feat(testing): add utility for faking time (#2069)
- fix(node): Make global.ts evaluate synchronously (#2098)

### 0.134.0 / 2022.04.07

- feat(node/child_process): support `signal` parameter for `ChildProcess.kill`
  (#2083)
- feat(node/net): add server.ref/unref methods (#2087)
- feat: web streams based encoding/csv (#1993)
- fix(log): fix log formatter issue (#2070)
- fix(node/fs): fix writing redundant data (#2076)

### 0.133.0 / 2022.03.31

- BREAKING: improve bytes/ module (#2074)
- feat(testing): add mocking utilities (#2048)

### 0.132.0 / 2022.03.25

- feat(collections): Add BSTree and RBTree (#2023)
- feat(node): add ReadStream and createReadStream (#1435)
- feat(node): export URLSearchParams via url module (#2056)

### 0.131.0 / 2022.03.24

- feat(node): add NodeEventTarget (#2032)
- feat(node): add Console constructor (#2037)
- feat(node): worker_threads (#1151)
- feat(node): add process.allowedNodeEnvironmentFlags (#2049)
- feat(collections): add BinaryHeap (#2022)
- feat(async): expose asyncPromise and asyncAsyncIterable (#2034)
- fix(node/http): ignore error from `respondWith` (#2058)
- fix(node): warn on non supported event, but still register listener (#2050)
- fix(node): fix `EventEmitter` methods (#2035)
- fix(node): make global.<timerFunc> Node.js timers (#2038)

### 0.130.0 / 2022.03.16

- feat(testing): add `assertInstanceOf` (#2028)
- feat(node): shim get-caller-file (#2029)
- fix(node): fix dynamic require (#2024)
- feat(node/fs): add `fs.writevSync(fd, buffers[, position])` (#2020)

### 0.129.0 / 2022.03.10

- feat: streams based `Buffer` (#1970)
- feat(node/crypto): add crypto.publicEncrypt (#1987)
- feat(node/fs): add `fs.writev(fd, buffers[, position], callback)` (#2008)
- feat(streams): LimitedTransformStream & LimitedBytesTransformStream (#2007)
- feat(streams): TextDelimiterStream (#2006)
- feat(testing/asserts): use assertion signature for "assertStrictEquals"
  (#1984)
- fix(async): re-export abortable in mod.ts (#1959)
- fix(fmt/colors): update `ANSI_PATTERN` (#1996)
- fix(node): fix http.request for minipass-fetch 2.x (#2004)
- fix(node/process): ignore SIGBREAK binding when the platform is not windows
  (#2014)
- fix(testing): Misleading assertion error in assertNotEquals (#1989)

### 0.128.0 / 2022.03.03

- feat(node): add crypto.webcrypto (#1961)
- feat(streams): TextLineStream (#1978)
- fix(dotenv): avoid top-level-await in load.ts (#1964)
- fix(node): fix http client reqs with bodies (#1983)
- fix(testing): fix assertObjectMatch for RegExp/Map/Set (#1967)

### 0.127.0 / 2022.02.24

- feat(async): add `abortable` to async module. (#1939)
- feat(dotenv): add dotenv library (#1877)
- feat(http): expose serveDir function from file_server.ts (#1944)
- feat(node): add fs.realpath.native (#1951)
- feat(node/tls): basic support of tls.createServer (#1948)
- feat(testing): add `assertAlmostEquals` (#1906)
- fix(node): don't use globalThis.setTimeout types in node/timers (#1934)

### 0.126.0 / 2022.02.17

- feat(node): add tls.connect (#1923)
- fix(collections/group_by): improve type safety (#1880)
- fix(io/buffer): super and initialized prop (#1917)
- fix(node): add networkInterfaces to unstable (#1904)
- fix(node): fix fs.createWriteStream (#1874)
- fix(node): fix fs.write again, enable more test cases (#1892)
- fix(node): support 6-arg fs.write (#1888)
- fix(node/buffer): fix base64 decode (#1885)
- fix(node/module): fix commonjs wrapper (#1902)

### 0.125.0 / 2022.02.03

- feat(node): add punycode module (#1857)
- feat(node): add url.resolve (#1851)
- feat(node/child_process): add support for AbortSignal in ChildProcess (#1864)
- feat(node/fs): add fs.createWriteStream (#1859)
- fix(node/fs): fix fs.access when the user owns the file (#1869)
- fix(node/fs): fix fs.copyFile (support 4-arg call) (#1872)
- fix(node/http): fix http.request (#1856)
- fix(node/net): mock response.socket object (#1858)
- fix: bypass TS errors for missing --unstable (#1819)

Note 0.124.0 is the same as 0.125.0 but ignoring a typescript error related to a
new feature added setNoDelay.

### 0.123.0 / 2022.01.27

- feat(node): add os.networkInterfaces (#1846)
- feat(node): add process.uptime (#1853)
- feat(node/child_process): add execFile (#1838)
- fix(node/process): can not pass exit code as a string (#1849)
- fix(testing): `assertObjectMatch` matches ArrayBuffer views correctly (#1843)

### 0.122.0 / 2022.01.20

- BREAKING(encoding/csv): add return type to csv's parse and remove a parse func
  from args (#1724)
- feat(node): add Timeout class (#1699)
- feat(node): provide node compatible timer APIs in commonjs wrapper (#1834)
- fix(log): flush to file when buffer is full (#1782)
- fix(node): fix fs.write/fs.writeAll (#1832)
- fix(node): make stdio streams optional if not present on Deno namespace
  (#1829)
- fix(node/net): setNoDelay and setKeepAlive no-ops (#1828)
- fix(node/timers): work around |this| check in deno (#1827)

### 0.121.0 / 2022.01.12

- feat(crypto): add md4 hash (#1799)
- feat(http): add eyecandy to file_server (#1804)
- feat(http/file_server): add 'quiet' flag (#1773)
- feat(node): add zlib (#1790)
- feat(node): mock more APIs (#1802)
- feat(node): upstream caller-path package (#1801)
- feat(node/fs): fs.write()/fs.writeSync() (#1817)
- fix(node): placeholder process.getgid() (#1814)
- fix(node): process.env ownPropertyDescriptor (#1795)
- fix(node): set prototype for Module (#1797)
- fix(node/http): client emit response, trailers & abort (#1809)
- fix(node/http/client): convert response's Headers to plain Object (#1811)
- fix(node/url): format auth/search/hash corruption (#1810)

### 0.120.0 / 2022.01.05

- feat(crypto): add Tiger hash (#1749)
- feat(node): add https.request (#1746)
- feat(node): add process.execPath (#1748)
- feat(node): add vm.runInThisContext (#1747)
- feat(uuid): add function to detect RFC version of a UUID (#1766)
- fix(examples/chat): fix applyState call (#1760)
- fix(node): don't emit exit twice (#1753)
- fix(node): fix fs.readdir (#1758)
- fix(node): improve util.isDeepStrictEqual (#1765)
- fix(node/child_process): allow number and boolean env vars (#1762)
- fix(path): change default of 'extended' options of glob methods (#1719)
- fix(testing/assert): inequality of -0 and 0 (#1783)

### 0.119.0 / 2021.12.22

- feat(hash): add Tiger hash (#1729)
- feat(node): expose util.debuglog (#1735)
- feat(node/util): implement `getOwnNonIndexProperties` (#1728)
- feat(uuid): add `validate` function to check UUID (#1720)

### 0.118.0 / 2021.12.16

- [BREAKING] Remove 'findLast' from 'collections' module (#1527)
- [BREAKING] Remove 'findLastIndex' from 'collections' module (#1528)
- [BREAKING] Remove 'server_legacy' from 'http' module (#1648)
- [BREAKING] Remove 'ws' module (#1647)
- [BREAKING] Remove assertThrowsAsync from 'testing/' (#1646)
- [BREAKING] Remove Go-style address in 'http' module (#1660)
- [BREAKING] Remove onSignal from 'signals/' (#1644)
- feat(http): add onError option to serveListener and serveTls (#1679)
- feat(node): add child_process.fork (#1695)
- feat(node): add http.Agent (#1706)
- feat(node): add http.OutgoingMessage (#1705)
- feat(node): add http.request (#1712)
- feat(node): add missing url.parse (#1667)
- feat(node): add mock inspector module (#1688)
- feat(node): add mock zlib module (#1698)
- feat(node): add util.isDeepStrictEqual (#1556)
- feat(node): export fs.Stats class (#1696)
- feat(node/fs): add fs.access (#1687)
- feat(node/url): add url.resolveObject (#1691)
- feat(node/util): add util.deprecate (#1697)
- feat(toml): align keys by option (#1693)
- fix(datetime): fix bug for parse at the end of the month (#1676)
- fix(node/util/inspect): validate invalid options (#1672)
- fix(toml): parse declaration correctly (#1682)

### 0.117.0 / 2021.12.03

- feat(http): introduce onError option on ServerInit (#1621)
- feat(node/readline): Interface, createInterface (#1554)
- fix(node): use async read for stdin (#1653)
- fix(std/node): Add base64url encoding support, indexOf, lastIndexOf and
  includes to Buffer (#1636)
- test(node/fs): enable `test-fs-rm.js` (#1632)
- fix(node/util/inspect): Fix some bugs (#1637)
- fix(node): Use upstream implementation for streams (#1634)

### 0.116.0 / 2021.11.24

- feat(node/os): implement os.hostname() (#1631)
- feat(node/util): add `util.inspect` (#1592)
- fix(fmt/printf): print with rounding taken into account (#1623)
- fix(node/http): ignore server request parse errors (#1624)
- refactor(node): reorganize _next_tick.ts module (#1608)

### 0.115.1 / 2021.11.17

- fix(node): use old "process.nextTick" polyfill if Deno.core is not available
  (#1612)

### 0.115.0 / 2021.11.17

- feat(node): add wasi module (#1534)
- feat(node): process.config, process.exitCode, process._exiting (#1597)
- feat(node): process.stdin.setRawMode (#1572)
- feat(node/_fs): Add `fs.readSync` (#1598)
- feat(node/fs): add `fs.read` API (#1557)
- feat(node/fs): implement `fs.rm` and `fs.rmSync` (#1568)
- feat(node/process): add process.hrtime.bigint() (#1600)
- feat(node/util): Add `util.isBuffer` and `util._extend` (#1567)
- fix(node): Align exports and declarations for Buffer and Events module (#1570)
- fix(node): improve http.Server.listen() compat (#1574)
- fix(node/http): fix no body chunked response (#1603)
- fix(node/http): improve http.Server compatibility (#1595)
- fix(node/http): improve http.Server#close() compat (#1602)
- fix(node/util): improve test coverage (#1591)
- node: add nextTick helper module (#1584)
- node: polyfill process.nextTick using Deno.core bindings (#1588)
- node: Use upstream source for "events" module (#1558)

### 0.114.0 / 2021.11.09

- BREAKING(http): update `serve`, add `serveListener`, deprecate
  `listenAndServe` (#1506)
- BREAKING(std/collections): deprecate findLast (#1532)
- feat(http/file_server): add streaming support, fix empty file handling (#1479)
- feat(node): add readline module (#1453)
- feat(node): process.on and process.off for signals (#1466)
- feat(node/_fs): Add watchFile function (#1483)
- feat(node/http): HTTP Server/Response improvements (#1448)
- feat(node/querystring): implement qs.unescapeBuffer (#1516)
- feat(node): mock 'vm' module (#1501)
- feat(node): os.cpus() (#1500)
- feat(node): process.execArgv (#1499)
- fix(collections): prevent calling `Object.prototype.__proto__` in
  collections/deep_merge.ts (#1504)
- fix(collections): remove default selector for `findSingle` (#1232)
- fix(crypto/digest): always return the underlying ArrayBuffer (#1515)
- fix(http/file_server): don't require --allow-read for showing help message
  (#1521)
- fix(node): //@ts-ignore Error.captureStackTrace (#1533)
- fix(node): add proper module.export for 'module' (#1497)
- fix(node): child_process stdio for binary data (#1477)
- fix(node): fix flaky downloadFile test (#1460)
- fix(node): fix process.arch (#1498)
- fix(node): fix string representation of node errors (#1470)
- fix(node): isAlreadyClosed for child_process (#1469)
- fix(node/_tools): Better error and output logging (#1492)
- fix(node/_util): Deno.permissions is no longer called unless it exists.
  (#1520)
- fix(node/events): enable remaining tests for EventEmitter (#1489)
- fix(node/events): make EventEmitter's public methods enumerable (#1530)
- fix(node/process): warn on not implemented event instead of throw (#1510)
- fix(node/querystring): improve `querystring.parse` (#1473)
- fix(node/querystring): Improve querystring.stringify (#1488)
- fix(node/querystring/stringify): invalid surrogate pair throws URIError
  (#1505)
- fix(node/querystring/stringify): Remove initialValue (#1494)
- fix(signal): update signal module for canary API change (#1468)
- fix(testing): show special characters in assertEquals results (#1450)

### 0.113.0 / 2021.10.25

- feat(collections/running_reduce): support `currentIndex` (#1431)
- feat(http/file_server): add color to log message (#1434)
- feat(http/file_server): add breadcrumbs navigation (#1433)
- feat(node): allow require with 'node:' prefix (#1438)
- feat(node/url): add `url.urlToHttpOptions(url)` (#1426)
- feat(testing): add assertIsError (#1376)
- fix(async): fix async/tee concurrent .next calls error (#1425)
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
- feat: add symlink and symlinkSync to node/fs (#825)
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
