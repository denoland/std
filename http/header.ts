// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// This module is generated from https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers.
// Attributions and copyright licensing by Mozilla Contributors is licensed under CC-BY-SA 2.5.

/**
 * Authentication
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#authentication
 */
export const HttpHeaderAuthentication = {
  /**
   * Defines the authentication method that should be used to access a resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
   */
  WwwAuthenticate: "WWW-Authenticate",

  /**
   * Contains the credentials to authenticate a user-agent with a server.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
   */
  Authorization: "Authorization",

  /**
   * Defines the authentication method that should be used to access a resource behind a proxy server.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authenticate
   */
  ProxyAuthenticate: "Proxy-Authenticate",

  /**
   * Contains the credentials to authenticate a user agent with a proxy server.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization
   */
  ProxyAuthorization: "Proxy-Authorization",
} as const;

/**
 * Caching
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#caching
 */
export const HttpHeaderCaching = {
  /**
   * The time, in seconds, that the object has been in a proxy cache.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Age
   */
  Age: "Age",

  /**
   * Directives for caching mechanisms in both requests and responses.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
   */
  CacheControl: "Cache-Control",

  /**
   * Clears browsing data (e.g. cookies, storage, cache) associated with the requesting website.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data
   */
  ClearSiteData: "Clear-Site-Data",

  /**
   * The date/time after which the response is considered stale.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires
   */
  Expires: "Expires",
} as const;

/**
 * Conditionals
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#conditionals
 */
export const HttpHeaderConditionals = {
  /**
   * The last modification date of the resource, used to compare several versions of the same resource. It is less accurate than ETag, but easier to calculate in some environments. Conditional requests using If-Modified-Since and If-Unmodified-Since use this value to change the behavior of the request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified
   */
  LastModified: "Last-Modified",

  /**
   * A unique string identifying the version of the resource. Conditional requests using If-Match and If-None-Match use this value to change the behavior of the request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
   */
  ETag: "ETag",

  /**
   * Makes the request conditional, and applies the method only if the stored resource matches one of the given ETags.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match
   */
  IfMatch: "If-Match",

  /**
   * Makes the request conditional, and applies the method only if the stored resource doesn't match any of the given ETags. This is used to update caches (for safe requests), or to prevent uploading a new resource when one already exists.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
   */
  IfNoneMatch: "If-None-Match",

  /**
   * Makes the request conditional, and expects the resource to be transmitted only if it has been modified after the given date. This is used to transmit data only when the cache is out of date.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
   */
  IfModifiedSince: "If-Modified-Since",

  /**
   * Makes the request conditional, and expects the resource to be transmitted only if it has not been modified after the given date. This ensures the coherence of a new fragment of a specific range with previous ones, or to implement an optimistic concurrency control system when modifying existing documents.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Unmodified-Since
   */
  IfUnmodifiedSince: "If-Unmodified-Since",

  /**
   * Determines how to match request headers to decide whether a cached response can be used rather than requesting a fresh one from the origin server.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary
   */
  Vary: "Vary",
} as const;

/**
 * Connection management
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#connection_management
 */
export const HttpHeaderConnectionManagement = {
  /**
   * Controls whether the network connection stays open after the current transaction finishes.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
   */
  Connection: "Connection",

  /**
   * Controls how long a persistent connection should stay open.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive
   */
  KeepAlive: "Keep-Alive",
} as const;

/**
 * Content negotiation
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#content_negotiation
 */
export const HttpHeaderContentNegotiation = {
  /**
   * Informs the server about the types of data that can be sent back.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
   */
  Accept: "Accept",

  /**
   * The encoding algorithm, usually a compression algorithm, that can be used on the resource sent back.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
   */
  AcceptEncoding: "Accept-Encoding",

  /**
   * Informs the server about the human language the server is expected to send back. This is a hint and is not necessarily under the full control of the user: the server should always pay attention not to override an explicit user choice (like selecting a language from a dropdown).
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
   */
  AcceptLanguage: "Accept-Language",
} as const;

/**
 * Controls
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#controls
 */
export const HttpHeaderControls = {
  /**
   * Indicates expectations that need to be fulfilled by the server to properly handle the request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect
   */
  Expect: "Expect",

  /**
   * When using TRACE, indicates the maximum number of hops the request can do before being reflected to the sender.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Max-Forwards
   */
  MaxForwards: "Max-Forwards",
} as const;

/**
 * Cookies
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#cookies
 */
export const HttpHeaderCookies = {
  /**
   * Contains stored HTTP cookies previously sent by the server with the Set-Cookie header.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie
   */
  Cookie: "Cookie",

  /**
   * Send cookies from the server to the user-agent.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
   */
  SetCookie: "Set-Cookie",
} as const;

/**
 * CORS
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#cors
 */
export const HttpHeaderCORS = {
  /**
   * Indicates whether the response to the request can be exposed when the credentials flag is true.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
   */
  AccessControlAllowCredentials: "Access-Control-Allow-Credentials",

  /**
   * Used in response to a preflight request to indicate which HTTP headers can be used when making the actual request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
   */
  AccessControlAllowHeaders: "Access-Control-Allow-Headers",

  /**
   * Specifies the methods allowed when accessing the resource in response to a preflight request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
   */
  AccessControlAllowMethods: "Access-Control-Allow-Methods",

  /**
   * Indicates whether the response can be shared.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
   */
  AccessControlAllowOrigin: "Access-Control-Allow-Origin",

  /**
   * Indicates which headers can be exposed as part of the response by listing their names.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
   */
  AccessControlExposeHeaders: "Access-Control-Expose-Headers",

  /**
   * Indicates how long the results of a preflight request can be cached.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
   */
  AccessControlMaxAge: "Access-Control-Max-Age",

  /**
   * Used when issuing a preflight request to let the server know which HTTP headers will be used when the actual request is made.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers
   */
  AccessControlRequestHeaders: "Access-Control-Request-Headers",

  /**
   * Used when issuing a preflight request to let the server know which HTTP method will be used when the actual request is made.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method
   */
  AccessControlRequestMethod: "Access-Control-Request-Method",

  /**
   * Indicates where a fetch originates from.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin
   */
  Origin: "Origin",

  /**
   * Specifies origins that are allowed to see values of attributes retrieved via features of the Resource Timing API, which would otherwise be reported as zero due to cross-origin restrictions.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin
   */
  TimingAllowOrigin: "Timing-Allow-Origin",
} as const;

/**
 * Downloads
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#downloads
 */
export const HttpHeaderDownloads = {
  /**
   * Indicates if the resource transmitted should be displayed inline (default behavior without the header), or if it should be handled like a download and the browser should present a "Save As" dialog.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
   */
  ContentDisposition: "Content-Disposition",
} as const;

/**
 * Message body information
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#message_body_information
 */
export const HttpHeaderMessageBodyInformation = {
  /**
   * The size of the resource, in decimal number of bytes.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
   */
  ContentLength: "Content-Length",

  /**
   * Indicates the media type of the resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
   */
  ContentType: "Content-Type",

  /**
   * Used to specify the compression algorithm.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
   */
  ContentEncoding: "Content-Encoding",

  /**
   * Describes the human language(s) intended for the audience, so that it allows a user to differentiate according to the users' own preferred language.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
   */
  ContentLanguage: "Content-Language",

  /**
   * Indicates an alternate location for the returned data.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Location
   */
  ContentLocation: "Content-Location",
} as const;

/**
 * Proxies
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#proxies
 */
export const HttpHeaderProxies = {
  /**
   * Contains information from the client-facing side of proxy servers that is altered or lost when a proxy is involved in the path of the request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
   */
  Forwarded: "Forwarded",

  /**
   * Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Via
   */
  Via: "Via",
} as const;

/**
 * Redirects
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#redirects
 */
export const HttpHeaderRedirects = {
  /**
   * Indicates the URL to redirect a page to.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location
   */
  Location: "Location",

  /**
   * Directs the browser to reload the page or redirect to another. Takes the same value as the meta element with http-equiv="refresh".
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Refresh
   */
  Refresh: "Refresh",
} as const;

/**
 * Request context
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#request_context
 */
export const HttpHeaderRequestContext = {
  /**
   * Contains an Internet email address for a human user who controls the requesting user agent.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/From
   */
  From: "From",

  /**
   * Specifies the domain name of the server (for virtual hosting), and (optionally) the TCP port number on which the server is listening.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host
   */
  Host: "Host",

  /**
   * The address of the previous web page from which a link to the currently requested page was followed.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer
   */
  Referer: "Referer",

  /**
   * Governs which referrer information sent in the Referer header should be included with requests made.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
   */
  ReferrerPolicy: "Referrer-Policy",

  /**
   * Contains a characteristic string that allows the network protocol peers to identify the application type, operating system, software vendor or software version of the requesting software user agent.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
   */
  UserAgent: "User-Agent",
} as const;

/**
 * Response context
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#response_context
 */
export const HttpHeaderResponseContext = {
  /**
   * Lists the set of HTTP request methods supported by a resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Allow
   */
  Allow: "Allow",

  /**
   * Contains information about the software used by the origin server to handle the request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server
   */
  Server: "Server",
} as const;

/**
 * Range requests
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#range_requests
 */
export const HttpHeaderRangeRequests = {
  /**
   * Indicates if the server supports range requests, and if so in which unit the range can be expressed.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Ranges
   */
  AcceptRanges: "Accept-Ranges",

  /**
   * Indicates the part of a document that the server should return.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
   */
  Range: "Range",

  /**
   * Creates a conditional range request that is only fulfilled if the given etag or date matches the remote resource. Used to prevent downloading two ranges from incompatible version of the resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Range
   */
  IfRange: "If-Range",

  /**
   * Indicates where in a full body message a partial message belongs.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
   */
  ContentRange: "Content-Range",
} as const;

/**
 * Security
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security
 */
export const HttpHeaderSecurity = {
  /**
   * Allows a server to declare an embedder policy for a given document.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy
   */
  CrossOriginEmbedderPolicy: "Cross-Origin-Embedder-Policy",

  /**
   * Prevents other domains from opening/controlling a window.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
   */
  CrossOriginOpenerPolicy: "Cross-Origin-Opener-Policy",

  /**
   * Prevents other domains from reading the response of the resources to which this header is applied. See also CORP explainer article.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
   */
  CrossOriginResourcePolicy: "Cross-Origin-Resource-Policy",

  /**
   * Controls resources the user agent is allowed to load for a given page.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
   */
  ContentSecurityPolicy: "Content-Security-Policy",

  /**
   * Allows web developers to experiment with policies by monitoring, but not enforcing, their effects. These violation reports consist of JSON documents sent via an HTTP POST request to the specified URI.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only
   */
  ContentSecurityPolicyReportOnly: "Content-Security-Policy-Report-Only",

  /**
   * Provides a mechanism to allow and deny the use of browser features in a website's own frame, and in <iframe>s that it embeds.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
   */
  PermissionsPolicy: "Permissions-Policy",

  /**
   * Force communication using HTTPS instead of HTTP.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
   */
  StrictTransportSecurity: "Strict-Transport-Security",

  /**
   * Sends a signal to the server expressing the client's preference for an encrypted and authenticated response, and that it can successfully handle the upgrade-insecure-requests directive.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade-Insecure-Requests
   */
  UpgradeInsecureRequests: "Upgrade-Insecure-Requests",

  /**
   * Disables MIME sniffing and forces browser to use the type given in Content-Type.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
   */
  XContentTypeOptions: "X-Content-Type-Options",

  /**
   * Indicates whether a browser should be allowed to render a page in a <frame>, <iframe>, <embed> or <object>.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
   */
  XFrameOptions: "X-Frame-Options",

  /**
   * Specifies if a cross-domain policy file (crossdomain.xml) is allowed. The file may define a policy to grant clients, such as Adobe's Flash Player (now obsolete), Adobe Acrobat, Microsoft Silverlight (now obsolete), or Apache Flex, permission to handle data across domains that would otherwise be restricted due to the Same-Origin Policy. See the Cross-domain Policy File Specification for more information.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Permitted-Cross-Domain-Policies
   */
  XPermittedCrossDomainPolicies: "X-Permitted-Cross-Domain-Policies",

  /**
   * May be set by hosting environments or other frameworks and contains information about them while not providing any usefulness to the application or its visitors. Unset this header to avoid exposing potential vulnerabilities.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Powered-By
   */
  XPoweredBy: "X-Powered-By",

  /**
   * Enables cross-site scripting filtering.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
   */
  XXssProtection: "X-XSS-Protection",
} as const;

/**
 * Fetch metadata request headers
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#fetch_metadata_request_headers
 */
export const HttpHeaderFetchMetadataRequestHeaders = {
  /**
   * Indicates the relationship between a request initiator's origin and its target's origin. It is a Structured Header whose value is a token with possible values cross-site, same-origin, same-site, and none.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site
   */
  SecFetchSite: "Sec-Fetch-Site",

  /**
   * Indicates the request's mode to a server. It is a Structured Header whose value is a token with possible values cors, navigate, no-cors, same-origin, and websocket.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Mode
   */
  SecFetchMode: "Sec-Fetch-Mode",

  /**
   * Indicates whether or not a navigation request was triggered by user activation. It is a Structured Header whose value is a boolean so possible values are ?0 for false and ?1 for true.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-User
   */
  SecFetchUser: "Sec-Fetch-User",

  /**
   * Indicates the request's destination. It is a Structured Header whose value is a token with possible values audio, audioworklet, document, embed, empty, font, image, manifest, object, paintworklet, report, script, serviceworker, sharedworker, style, track, video, worker, and xslt.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Dest
   */
  SecFetchDest: "Sec-Fetch-Dest",

  /**
   * Indicates the purpose of the request, when the purpose is something other than immediate use by the user-agent. The header currently has one possible value, prefetch, which indicates that the resource is being fetched preemptively for a possible future navigation.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Purpose
   */
  SecPurpose: "Sec-Purpose",

  /**
   * A request header sent in preemptive request to fetch() a resource during service worker boot. The value, which is set with NavigationPreloadManager.setHeaderValue(), can be used to inform a server that a different resource should be returned than in a normal fetch() operation.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Service-Worker-Navigation-Preload
   */
  ServiceWorkerNavigationPreload: "Service-Worker-Navigation-Preload",
} as const;

/**
 * Server-sent events
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#server-sent_events
 */
export const HttpHeaderServerSentEvents = {
  /**
   * Used to specify a server endpoint for the browser to send warning and error reports to.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Report-To
   */
  ReportTo: "Report-To",
} as const;

/**
 * Transfer coding
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#transfer_coding
 */
export const HttpHeaderTransferCoding = {
  /**
   * Specifies the form of encoding used to safely transfer the resource to the user.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding
   */
  TransferEncoding: "Transfer-Encoding",

  /**
   * Specifies the transfer encodings the user agent is willing to accept.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/TE
   */
  TE: "TE",

  /**
   * Allows the sender to include additional fields at the end of chunked message.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Trailer
   */
  Trailer: "Trailer",
} as const;

/**
 * Other
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#other
 */
export const HttpHeaderOther = {
  /**
   * Used to list alternate ways to reach this service.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Alt-Svc
   */
  AltSvc: "Alt-Svc",

  /**
   * Used to identify the alternative service in use.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Alt-Used
   */
  AltUsed: "Alt-Used",

  /**
   * Contains the date and time at which the message was originated.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Date
   */
  Date: "Date",

  /**
   * This entity-header field provides a means for serializing one or more links in HTTP headers. It is semantically equivalent to the HTML <link> element.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link
   */
  Link: "Link",

  /**
   * Indicates how long the user agent should wait before making a follow-up request.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
   */
  RetryAfter: "Retry-After",

  /**
   * Communicates one or more metrics and descriptions for the given request-response cycle.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing
   */
  ServerTiming: "Server-Timing",

  /**
   * Used to remove the path restriction by including this header in the response of the Service Worker script.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Service-Worker-Allowed
   */
  ServiceWorkerAllowed: "Service-Worker-Allowed",

  /**
   * Links generated code to a source map.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/SourceMap
   */
  SourceMap: "SourceMap",

  /**
   * This HTTP/1.1 (only) header can be used to upgrade an already established client/server connection to a different protocol (over the same transport protocol). For example, it can be used by a client to upgrade a connection from HTTP 1.1 to HTTP 2.0, or an HTTP or HTTPS connection into a WebSocket.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade
   */
  Upgrade: "Upgrade",
} as const;

/**
 * HTTP headers
 *
 * A collection of non-experimental HTTP headers.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 */
export const HttpHeader = {
  ...HttpHeaderAuthentication,
  ...HttpHeaderCaching,
  ...HttpHeaderConditionals,
  ...HttpHeaderConnectionManagement,
  ...HttpHeaderContentNegotiation,
  ...HttpHeaderControls,
  ...HttpHeaderCookies,
  ...HttpHeaderCORS,
  ...HttpHeaderDownloads,
  ...HttpHeaderMessageBodyInformation,
  ...HttpHeaderProxies,
  ...HttpHeaderRedirects,
  ...HttpHeaderRequestContext,
  ...HttpHeaderResponseContext,
  ...HttpHeaderRangeRequests,
  ...HttpHeaderSecurity,
  ...HttpHeaderFetchMetadataRequestHeaders,
  ...HttpHeaderServerSentEvents,
  ...HttpHeaderTransferCoding,
  ...HttpHeaderOther,
};
