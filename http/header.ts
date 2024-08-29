// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// This module is generated from {@link https://www.iana.org/assignments/http-fields/http-fields.xhtml#field-names | IANA Hypertext Transfer Protocol (HTTP) Field Name Registry}

/**
 * HTTP Headers with status permanent
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.iana.org/assignments/http-fields/http-fields.xhtml#field-names | IANA Hypertext Transfer Protocol (HTTP) Field Name Registry}
 */
export const HEADER = {
  /**
   * HTTP Header A-IM
   *
   * @see {@link https://www.iana.org/go/rfc3229 | RFC 3229: Delta encoding in HTTP}
   */
  AIm: "A-IM",

  /**
   * HTTP Header Accept
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 12.5.1: HTTP Semantics}
   */
  Accept: "Accept",

  /**
   * HTTP Header Accept-Additions
   *
   * @see {@link https://www.iana.org/go/rfc2324 | RFC 2324: Hyper Text Coffee Pot Control Protocol (HTCPCP/1.0)}
   */
  AcceptAdditions: "Accept-Additions",

  /**
   * HTTP Header Accept-CH
   *
   * @see {@link https://www.iana.org/go/rfc8942 | RFC 8942, Section 3.1: HTTP Client Hints}
   */
  AcceptCh: "Accept-CH",

  /**
   * HTTP Header Accept-Datetime
   *
   * @see {@link https://www.iana.org/go/rfc7089 | RFC 7089: HTTP Framework for Time-Based Access to Resource States -- Memento}
   */
  AcceptDatetime: "Accept-Datetime",

  /**
   * HTTP Header Accept-Encoding
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 12.5.3: HTTP Semantics}
   */
  AcceptEncoding: "Accept-Encoding",

  /**
   * HTTP Header Accept-Features
   *
   * @see {@link https://www.iana.org/go/rfc2295 | RFC 2295: Transparent Content Negotiation in HTTP}
   */
  AcceptFeatures: "Accept-Features",

  /**
   * HTTP Header Accept-Language
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 12.5.4: HTTP Semantics}
   */
  AcceptLanguage: "Accept-Language",

  /**
   * HTTP Header Accept-Patch
   *
   * @see {@link https://www.iana.org/go/rfc5789 | RFC 5789: PATCH Method for HTTP}
   */
  AcceptPatch: "Accept-Patch",

  /**
   * HTTP Header Accept-Post
   *
   * @see {@link https://www.w3.org/TR/ldp | Linked Data Platform 1.0}
   */
  AcceptPost: "Accept-Post",

  /**
   * HTTP Header Accept-Ranges
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 14.3: HTTP Semantics}
   */
  AcceptRanges: "Accept-Ranges",

  /**
   * HTTP Header Accept-Signature
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-message-signatures-19 | RFC-ietf-httpbis-message-signatures-19, Section 5.1: HTTP Message Signatures}
   */
  AcceptSignature: "Accept-Signature",

  /**
   * HTTP Header Access-Control-Allow-Credentials
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-allow-credentials | Fetch}
   */
  AccessControlAllowCredentials: "Access-Control-Allow-Credentials",

  /**
   * HTTP Header Access-Control-Allow-Headers
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-allow-headers | Fetch}
   */
  AccessControlAllowHeaders: "Access-Control-Allow-Headers",

  /**
   * HTTP Header Access-Control-Allow-Methods
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-allow-methods | Fetch}
   */
  AccessControlAllowMethods: "Access-Control-Allow-Methods",

  /**
   * HTTP Header Access-Control-Allow-Origin
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-allow-origin | Fetch}
   */
  AccessControlAllowOrigin: "Access-Control-Allow-Origin",

  /**
   * HTTP Header Access-Control-Expose-Headers
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-expose-headers | Fetch}
   */
  AccessControlExposeHeaders: "Access-Control-Expose-Headers",

  /**
   * HTTP Header Access-Control-Max-Age
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-max-age | Fetch}
   */
  AccessControlMaxAge: "Access-Control-Max-Age",

  /**
   * HTTP Header Access-Control-Request-Headers
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-request-headers | Fetch}
   */
  AccessControlRequestHeaders: "Access-Control-Request-Headers",

  /**
   * HTTP Header Access-Control-Request-Method
   *
   * @see {@link https://fetch.spec.whatwg.org/#http-access-control-request-method | Fetch}
   */
  AccessControlRequestMethod: "Access-Control-Request-Method",

  /**
   * HTTP Header Age
   *
   * @see {@link https://www.iana.org/go/rfc9111 | RFC9111, Section 5.1: HTTP Caching}
   */
  Age: "Age",

  /**
   * HTTP Header Allow
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.2.1: HTTP Semantics}
   */
  Allow: "Allow",

  /**
   * HTTP Header ALPN
   *
   * @see {@link https://www.iana.org/go/rfc7639 | RFC 7639, Section 2: The ALPN HTTP Header Field}
   */
  ALPN: "ALPN",

  /**
   * HTTP Header Alt-Svc
   *
   * @see {@link https://www.iana.org/go/rfc7838 | RFC 7838: HTTP Alternative Services}
   */
  AltSvc: "Alt-Svc",

  /**
   * HTTP Header Alt-Used
   *
   * @see {@link https://www.iana.org/go/rfc7838 | RFC 7838: HTTP Alternative Services}
   */
  AltUsed: "Alt-Used",

  /**
   * HTTP Header Alternates
   *
   * @see {@link https://www.iana.org/go/rfc2295 | RFC 2295: Transparent Content Negotiation in HTTP}
   */
  Alternates: "Alternates",

  /**
   * HTTP Header Apply-To-Redirect-Ref
   *
   * @see {@link https://www.iana.org/go/rfc4437 | RFC 4437: Web Distributed Authoring and Versioning (WebDAV) Redirect Reference Resources}
   */
  ApplyToRedirectRef: "Apply-To-Redirect-Ref",

  /**
   * HTTP Header Authentication-Control
   *
   * @see {@link https://www.iana.org/go/rfc8053 | RFC 8053, Section 4: HTTP Authentication Extensions for Interactive Clients}
   */
  AuthenticationControl: "Authentication-Control",

  /**
   * HTTP Header Authentication-Info
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 11.6.3: HTTP Semantics}
   */
  AuthenticationInfo: "Authentication-Info",

  /**
   * HTTP Header Authorization
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 11.6.2: HTTP Semantics}
   */
  Authorization: "Authorization",

  /**
   * HTTP Header Cache-Control
   *
   * @see {@link https://www.iana.org/go/rfc9111 | RFC9111, Section 5.2}
   */
  CacheControl: "Cache-Control",

  /**
   * HTTP Header Cache-Status
   *
   * @see {@link https://www.iana.org/go/rfc9211 | RFC9211: The Cache-Status HTTP Response Header Field}
   */
  CacheStatus: "Cache-Status",

  /**
   * HTTP Header Cal-Managed-ID
   *
   * @see {@link https://www.iana.org/go/rfc8607 | RFC 8607, Section 5.1: Calendaring Extensions to WebDAV (CalDAV): Managed Attachments}
   */
  CalManagedId: "Cal-Managed-ID",

  /**
   * HTTP Header CalDAV-Timezones
   *
   * @see {@link https://www.iana.org/go/rfc7809 | RFC 7809, Section 7.1: Calendaring Extensions to WebDAV (CalDAV): Time Zones by Reference}
   */
  CaldavTimezones: "CalDAV-Timezones",

  /**
   * HTTP Header Capsule-Protocol
   *
   * @see {@link https://www.iana.org/go/rfc9297 | RFC9297}
   */
  CapsuleProtocol: "Capsule-Protocol",

  /**
   * HTTP Header CDN-Cache-Control
   *
   * @see {@link https://www.iana.org/go/rfc9213 | RFC9213: Targeted HTTP Cache Control}
   */
  CdnCacheControl: "CDN-Cache-Control",

  /**
   * HTTP Header CDN-Loop
   *
   * @see {@link https://www.iana.org/go/rfc8586 | RFC 8586: Loop Detection in Content Delivery Networks (CDNs)}
   */
  CdnLoop: "CDN-Loop",

  /**
   * HTTP Header Cert-Not-After
   *
   * @see {@link https://www.iana.org/go/rfc8739 | RFC 8739, Section 3.3: Support for Short-Term, Automatically Renewed (STAR) Certificates in the Automated Certificate Management Environment (ACME)}
   */
  CertNotAfter: "Cert-Not-After",

  /**
   * HTTP Header Cert-Not-Before
   *
   * @see {@link https://www.iana.org/go/rfc8739 | RFC 8739, Section 3.3: Support for Short-Term, Automatically Renewed (STAR) Certificates in the Automated Certificate Management Environment (ACME)}
   */
  CertNotBefore: "Cert-Not-Before",

  /**
   * HTTP Header Clear-Site-Data
   *
   * @see {@link https://w3.org/TR/clear-site-data/#header | Clear Site Data}
   */
  ClearSiteData: "Clear-Site-Data",

  /**
   * HTTP Header Client-Cert
   *
   * @see {@link https://www.iana.org/go/rfc9440 | RFC9440, Section 2: Client-Cert HTTP Header Field}
   */
  ClientCert: "Client-Cert",

  /**
   * HTTP Header Client-Cert-Chain
   *
   * @see {@link https://www.iana.org/go/rfc9440 | RFC9440, Section 2: Client-Cert HTTP Header Field}
   */
  ClientCertChain: "Client-Cert-Chain",

  /**
   * HTTP Header Close
   *
   * @see {@link https://www.iana.org/go/rfc9112 | RFC9112, Section 9.6: HTTP/1.1}
   */
  Close: "Close",

  /**
   * HTTP Header Connection
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 7.6.1: HTTP Semantics}
   */
  Connection: "Connection",

  /**
   * HTTP Header Content-Digest
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-digest-headers-13 | RFC-ietf-httpbis-digest-headers-13, Section 2: Digest Fields}
   */
  ContentDigest: "Content-Digest",

  /**
 * HTTP Header Content-Disposition
 *
 * @see {@link https://www.iana.org/go/rfc6266 | RFC 6266: Use of the Content-Disposition Header Field in the
        Hypertext Transfer Protocol (HTTP)}
 */
  ContentDisposition: "Content-Disposition",

  /**
   * HTTP Header Content-Encoding
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.4: HTTP Semantics}
   */
  ContentEncoding: "Content-Encoding",

  /**
   * HTTP Header Content-Language
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.5: HTTP Semantics}
   */
  ContentLanguage: "Content-Language",

  /**
   * HTTP Header Content-Length
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.6: HTTP Semantics}
   */
  ContentLength: "Content-Length",

  /**
   * HTTP Header Content-Location
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.7: HTTP Semantics}
   */
  ContentLocation: "Content-Location",

  /**
   * HTTP Header Content-Range
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 14.4: HTTP Semantics}
   */
  ContentRange: "Content-Range",

  /**
   * HTTP Header Content-Security-Policy
   *
   * @see {@link https://www.w3.org/TR/CSP/#csp-header | Content Security Policy Level 3}
   */
  ContentSecurityPolicy: "Content-Security-Policy",

  /**
   * HTTP Header Content-Security-Policy-Report-Only
   *
   * @see {@link https://www.w3.org/TR/CSP/#cspro-header | Content Security Policy Level 3}
   */
  ContentSecurityPolicyReportOnly: "Content-Security-Policy-Report-Only",

  /**
   * HTTP Header Content-Type
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.3: HTTP Semantics}
   */
  ContentType: "Content-Type",

  /**
   * HTTP Header Cookie
   *
   * @see {@link https://www.iana.org/go/rfc6265 | RFC 6265: HTTP State Management Mechanism}
   */
  Cookie: "Cookie",

  /**
   * HTTP Header Cross-Origin-Embedder-Policy
   *
   * @see {@link https://html.spec.whatwg.org/multipage/origin.html#cross-origin-embedder-policy | HTML}
   */
  CrossOriginEmbedderPolicy: "Cross-Origin-Embedder-Policy",

  /**
   * HTTP Header Cross-Origin-Embedder-Policy-Report-Only
   *
   * @see {@link https://html.spec.whatwg.org/multipage/origin.html#cross-origin-embedder-policy-report-only | HTML}
   */
  CrossOriginEmbedderPolicyReportOnly:
    "Cross-Origin-Embedder-Policy-Report-Only",

  /**
   * HTTP Header Cross-Origin-Opener-Policy
   *
   * @see {@link https://html.spec.whatwg.org/multipage/origin.html#cross-origin-opener-policy-2 | HTML}
   */
  CrossOriginOpenerPolicy: "Cross-Origin-Opener-Policy",

  /**
   * HTTP Header Cross-Origin-Opener-Policy-Report-Only
   *
   * @see {@link https://html.spec.whatwg.org/multipage/origin.html#cross-origin-opener-policy-report-only | HTML}
   */
  CrossOriginOpenerPolicyReportOnly: "Cross-Origin-Opener-Policy-Report-Only",

  /**
   * HTTP Header Cross-Origin-Resource-Policy
   *
   * @see {@link https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header | Fetch}
   */
  CrossOriginResourcePolicy: "Cross-Origin-Resource-Policy",

  /**
   * HTTP Header DASL
   *
   * @see {@link https://www.iana.org/go/rfc5323 | RFC 5323: Web Distributed Authoring and Versioning (WebDAV) SEARCH}
   */
  DASL: "DASL",

  /**
   * HTTP Header Date
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 6.6.1: HTTP Semantics}
   */
  Date: "Date",

  /**
   * HTTP Header DAV
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  DAV: "DAV",

  /**
   * HTTP Header Delta-Base
   *
   * @see {@link https://www.iana.org/go/rfc3229 | RFC 3229: Delta encoding in HTTP}
   */
  DeltaBase: "Delta-Base",

  /**
   * HTTP Header Depth
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  Depth: "Depth",

  /**
   * HTTP Header Destination
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  Destination: "Destination",

  /**
   * HTTP Header DPoP
   *
   * @see {@link https://www.iana.org/go/rfc9449 | RFC9449: OAuth 2.0 Demonstrating Proof of Possession (DPoP)}
   */
  DPoP: "DPoP",

  /**
   * HTTP Header DPoP-Nonce
   *
   * @see {@link https://www.iana.org/go/rfc9449 | RFC9449: OAuth 2.0 Demonstrating Proof of Possession (DPoP)}
   */
  DpopNonce: "DPoP-Nonce",

  /**
   * HTTP Header Early-Data
   *
   * @see {@link https://www.iana.org/go/rfc8470 | RFC 8470: Using Early Data in HTTP}
   */
  EarlyData: "Early-Data",

  /**
   * HTTP Header ETag
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.8.3: HTTP Semantics}
   */
  ETag: "ETag",

  /**
   * HTTP Header Expect
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.1.1: HTTP Semantics}
   */
  Expect: "Expect",

  /**
   * HTTP Header Expires
   *
   * @see {@link https://www.iana.org/go/rfc9111 | RFC9111, Section 5.3: HTTP Caching}
   */
  Expires: "Expires",

  /**
   * HTTP Header Forwarded
   *
   * @see {@link https://www.iana.org/go/rfc7239 | RFC 7239: Forwarded HTTP Extension}
   */
  Forwarded: "Forwarded",

  /**
   * HTTP Header From
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.1.2: HTTP Semantics}
   */
  From: "From",

  /**
   * HTTP Header Hobareg
   *
   * @see {@link https://www.iana.org/go/rfc7486 | RFC 7486, Section 6.1.1: HTTP Origin-Bound Authentication (HOBA)}
   */
  Hobareg: "Hobareg",

  /**
   * HTTP Header Host
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 7.2: HTTP Semantics}
   */
  Host: "Host",

  /**
   * HTTP Header If
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  If: "If",

  /**
   * HTTP Header If-Match
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 13.1.1: HTTP Semantics}
   */
  IfMatch: "If-Match",

  /**
   * HTTP Header If-Modified-Since
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 13.1.3: HTTP Semantics}
   */
  IfModifiedSince: "If-Modified-Since",

  /**
   * HTTP Header If-None-Match
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 13.1.2: HTTP Semantics}
   */
  IfNoneMatch: "If-None-Match",

  /**
   * HTTP Header If-Range
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 13.1.5: HTTP Semantics}
   */
  IfRange: "If-Range",

  /**
   * HTTP Header If-Schedule-Tag-Match
   *
   * @see {@link https://www.iana.org/go/rfc6638 |  RFC 6338: Scheduling Extensions to CalDAV}
   */
  IfScheduleTagMatch: "If-Schedule-Tag-Match",

  /**
   * HTTP Header If-Unmodified-Since
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 13.1.4: HTTP Semantics}
   */
  IfUnmodifiedSince: "If-Unmodified-Since",

  /**
   * HTTP Header IM
   *
   * @see {@link https://www.iana.org/go/rfc3229 | RFC 3229: Delta encoding in HTTP}
   */
  IM: "IM",

  /**
   * HTTP Header Include-Referred-Token-Binding-ID
   *
   * @see {@link https://www.iana.org/go/rfc8473 | RFC 8473: Token Binding over HTTP}
   */
  IncludeReferredTokenBindingId: "Include-Referred-Token-Binding-ID",

  /**
   * HTTP Header Keep-Alive
   *
   * @see {@link https://www.iana.org/go/rfc2068 | RFC 2068: Hypertext Transfer Protocol -- HTTP/1.1}
   */
  KeepAlive: "Keep-Alive",

  /**
   * HTTP Header Label
   *
   * @see {@link https://www.iana.org/go/rfc3253 | RFC 3253: Versioning Extensions to WebDAV: (Web Distributed Authoring and Versioning)}
   */
  Label: "Label",

  /**
   * HTTP Header Last-Event-ID
   *
   * @see {@link https://html.spec.whatwg.org/multipage/server-sent-events.html#last-event-id | HTML}
   */
  LastEventId: "Last-Event-ID",

  /**
   * HTTP Header Last-Modified
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 8.8.2: HTTP Semantics}
   */
  LastModified: "Last-Modified",

  /**
   * HTTP Header Link
   *
   * @see {@link https://www.iana.org/go/rfc8288 | RFC 8288: Web Linking}
   */
  Link: "Link",

  /**
   * HTTP Header Location
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.2.2: HTTP Semantics}
   */
  Location: "Location",

  /**
   * HTTP Header Lock-Token
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  LockToken: "Lock-Token",

  /**
   * HTTP Header Max-Forwards
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 7.6.2: HTTP Semantics}
   */
  MaxForwards: "Max-Forwards",

  /**
   * HTTP Header Memento-Datetime
   *
   * @see {@link https://www.iana.org/go/rfc7089 | RFC 7089: HTTP Framework for Time-Based Access to Resource States -- Memento}
   */
  MementoDatetime: "Memento-Datetime",

  /**
   * HTTP Header Meter
   *
   * @see {@link https://www.iana.org/go/rfc2227 | RFC 2227: Simple Hit-Metering and Usage-Limiting for HTTP}
   */
  Meter: "Meter",

  /**
   * HTTP Header MIME-Version
   *
   * @see {@link https://www.iana.org/go/rfc9112 | RFC9112, Appendix B.1: HTTP/1.1}
   */
  MimeVersion: "MIME-Version",

  /**
   * HTTP Header Negotiate
   *
   * @see {@link https://www.iana.org/go/rfc2295 | RFC 2295: Transparent Content Negotiation in HTTP}
   */
  Negotiate: "Negotiate",

  /**
   * HTTP Header NEL
   *
   * @see {@link https://www.w3.org/TR/network-error-logging/ | Network Error Logging}
   */
  NEL: "NEL",

  /**
   * HTTP Header OData-EntityId
   *
   * @see {@link http://docs.oasis-open.org/odata/odata/v4.01/csprd05/part1-protocol/odata-v4.01-csprd05-part1-protocol.html#_Toc14172735 | OData Version 4.01 Part 1: Protocol}
   * @see {@link #OASIS | OASIS}
   * @see {@link #Chet_Ensign | Chet_Ensign}
   */
  OdataEntityid: "OData-EntityId",

  /**
   * HTTP Header OData-Isolation
   *
   * @see {@link http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_HeaderIsolationODataIsolation | OData Version 4.01 Part 1: Protocol}
   * @see {@link #OASIS | OASIS}
   * @see {@link #Chet_Ensign | Chet_Ensign}
   */
  OdataIsolation: "OData-Isolation",

  /**
   * HTTP Header OData-MaxVersion
   *
   * @see {@link http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_HeaderODataMaxVersion | OData Version 4.01 Part 1: Protocol}
   * @see {@link #OASIS | OASIS}
   * @see {@link #Chet_Ensign | Chet_Ensign}
   */
  OdataMaxversion: "OData-MaxVersion",

  /**
   * HTTP Header OData-Version
   *
   * @see {@link http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_HeaderODataVersion | OData Version 4.01 Part 1: Protocol}
   * @see {@link #OASIS | OASIS}
   * @see {@link #Chet_Ensign | Chet_Ensign}
   */
  OdataVersion: "OData-Version",

  /**
   * HTTP Header Optional-WWW-Authenticate
   *
   * @see {@link https://www.iana.org/go/rfc8053 | RFC 8053, Section 3: HTTP Authentication Extensions for Interactive Clients}
   */
  OptionalWwwAuthenticate: "Optional-WWW-Authenticate",

  /**
   * HTTP Header Ordering-Type
   *
   * @see {@link https://www.iana.org/go/rfc3648 | RFC 3648: Web Distributed Authoring and Versioning (WebDAV) Ordered Collections Protocol}
   */
  OrderingType: "Ordering-Type",

  /**
   * HTTP Header Origin
   *
   * @see {@link https://www.iana.org/go/rfc6454 | RFC 6454: The Web Origin Concept}
   */
  Origin: "Origin",

  /**
   * HTTP Header Origin-Agent-Cluster
   *
   * @see {@link https://html.spec.whatwg.org/multipage/origin.html#origin-agent-cluster | HTML}
   */
  OriginAgentCluster: "Origin-Agent-Cluster",

  /**
   * HTTP Header OSCORE
   *
   * @see {@link https://www.iana.org/go/rfc8613 | RFC 8613, Section 11.1: Object Security for Constrained RESTful Environments (OSCORE)}
   */
  OSCORE: "OSCORE",

  /**
   * HTTP Header OSLC-Core-Version
   *
   * @see {@link https://docs.oasis-open-projects.org/oslc-op/core/v3.0/oslc-core.html | OASIS Project Specification 01}
   * @see {@link #OASIS | OASIS}
   * @see {@link #Chet_Ensign | Chet_Ensign}
   */
  OslcCoreVersion: "OSLC-Core-Version",

  /**
   * HTTP Header Overwrite
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  Overwrite: "Overwrite",

  /**
   * HTTP Header Ping-From
   *
   * @see {@link https://html.spec.whatwg.org/multipage/links.html#ping-from | HTML}
   */
  PingFrom: "Ping-From",

  /**
   * HTTP Header Ping-To
   *
   * @see {@link https://html.spec.whatwg.org/multipage/links.html#ping-to | HTML}
   */
  PingTo: "Ping-To",

  /**
   * HTTP Header Position
   *
   * @see {@link https://www.iana.org/go/rfc3648 | RFC 3648: Web Distributed Authoring and Versioning (WebDAV) Ordered Collections Protocol}
   */
  Position: "Position",

  /**
   * HTTP Header Prefer
   *
   * @see {@link https://www.iana.org/go/rfc7240 | RFC 7240: Prefer Header for HTTP}
   */
  Prefer: "Prefer",

  /**
   * HTTP Header Preference-Applied
   *
   * @see {@link https://www.iana.org/go/rfc7240 | RFC 7240: Prefer Header for HTTP}
   */
  PreferenceApplied: "Preference-Applied",

  /**
   * HTTP Header Priority
   *
   * @see {@link https://www.iana.org/go/rfc9218 | RFC9218: Extensible Prioritization Scheme for HTTP}
   */
  Priority: "Priority",

  /**
   * HTTP Header Proxy-Authenticate
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 11.7.1: HTTP Semantics}
   */
  ProxyAuthenticate: "Proxy-Authenticate",

  /**
   * HTTP Header Proxy-Authentication-Info
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 11.7.3: HTTP Semantics}
   */
  ProxyAuthenticationInfo: "Proxy-Authentication-Info",

  /**
   * HTTP Header Proxy-Authorization
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 11.7.2: HTTP Semantics}
   */
  ProxyAuthorization: "Proxy-Authorization",

  /**
   * HTTP Header Proxy-Status
   *
   * @see {@link https://www.iana.org/go/rfc9209 | RFC9209: The Proxy-Status HTTP Response Header Field}
   */
  ProxyStatus: "Proxy-Status",

  /**
   * HTTP Header Public-Key-Pins
   *
   * @see {@link https://www.iana.org/go/rfc7469 | RFC 7469: Public Key Pinning Extension for HTTP}
   */
  PublicKeyPins: "Public-Key-Pins",

  /**
   * HTTP Header Public-Key-Pins-Report-Only
   *
   * @see {@link https://www.iana.org/go/rfc7469 | RFC 7469: Public Key Pinning Extension for HTTP}
   */
  PublicKeyPinsReportOnly: "Public-Key-Pins-Report-Only",

  /**
   * HTTP Header Range
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 14.2: HTTP Semantics}
   */
  Range: "Range",

  /**
   * HTTP Header Redirect-Ref
   *
   * @see {@link https://www.iana.org/go/rfc4437 | RFC 4437: Web Distributed Authoring and Versioning (WebDAV) Redirect Reference Resources}
   */
  RedirectRef: "Redirect-Ref",

  /**
   * HTTP Header Referer
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.1.3: HTTP Semantics}
   */
  Referer: "Referer",

  /**
   * HTTP Header Refresh
   *
   * @see {@link https://html.spec.whatwg.org/multipage/browsing-the-web.html#refresh | HTML}
   */
  Refresh: "Refresh",

  /**
   * HTTP Header Replay-Nonce
   *
   * @see {@link https://www.iana.org/go/rfc8555 | RFC 8555, Section 6.5.1: Automatic Certificate Management Environment (ACME)}
   */
  ReplayNonce: "Replay-Nonce",

  /**
   * HTTP Header Repr-Digest
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-digest-headers-13 | RFC-ietf-httpbis-digest-headers-13, Section 3: Digest Fields}
   */
  ReprDigest: "Repr-Digest",

  /**
   * HTTP Header Retry-After
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.2.3: HTTP Semantics}
   */
  RetryAfter: "Retry-After",

  /**
   * HTTP Header Schedule-Reply
   *
   * @see {@link https://www.iana.org/go/rfc6638 | RFC 6638: Scheduling Extensions to CalDAV}
   */
  ScheduleReply: "Schedule-Reply",

  /**
   * HTTP Header Schedule-Tag
   *
   * @see {@link https://www.iana.org/go/rfc6638 | RFC 6338: Scheduling Extensions to CalDAV}
   */
  ScheduleTag: "Schedule-Tag",

  /**
   * HTTP Header Sec-Purpose
   *
   * @see {@link https://fetch.spec.whatwg.org/#sec-purpose-header | Fetch}
   */
  SecPurpose: "Sec-Purpose",

  /**
   * HTTP Header Sec-Token-Binding
   *
   * @see {@link https://www.iana.org/go/rfc8473 | RFC 8473: Token Binding over HTTP}
   */
  SecTokenBinding: "Sec-Token-Binding",

  /**
   * HTTP Header Sec-WebSocket-Accept
   *
   * @see {@link https://www.iana.org/go/rfc6455 | RFC 6455: The WebSocket Protocol}
   */
  SecWebsocketAccept: "Sec-WebSocket-Accept",

  /**
   * HTTP Header Sec-WebSocket-Extensions
   *
   * @see {@link https://www.iana.org/go/rfc6455 | RFC 6455: The WebSocket Protocol}
   */
  SecWebsocketExtensions: "Sec-WebSocket-Extensions",

  /**
   * HTTP Header Sec-WebSocket-Key
   *
   * @see {@link https://www.iana.org/go/rfc6455 | RFC 6455: The WebSocket Protocol}
   */
  SecWebsocketKey: "Sec-WebSocket-Key",

  /**
   * HTTP Header Sec-WebSocket-Protocol
   *
   * @see {@link https://www.iana.org/go/rfc6455 | RFC 6455: The WebSocket Protocol}
   */
  SecWebsocketProtocol: "Sec-WebSocket-Protocol",

  /**
   * HTTP Header Sec-WebSocket-Version
   *
   * @see {@link https://www.iana.org/go/rfc6455 | RFC 6455: The WebSocket Protocol}
   */
  SecWebsocketVersion: "Sec-WebSocket-Version",

  /**
   * HTTP Header Server
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.2.4: HTTP Semantics}
   */
  Server: "Server",

  /**
   * HTTP Header Server-Timing
   *
   * @see {@link https://www.w3.org/TR/server-timing/ | Server Timing}
   */
  ServerTiming: "Server-Timing",

  /**
   * HTTP Header Set-Cookie
   *
   * @see {@link https://www.iana.org/go/rfc6265 | RFC 6265: HTTP State Management Mechanism}
   */
  SetCookie: "Set-Cookie",

  /**
   * HTTP Header Signature
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-message-signatures-19 | RFC-ietf-httpbis-message-signatures-19, Section 4.2: HTTP Message Signatures}
   */
  Signature: "Signature",

  /**
   * HTTP Header Signature-Input
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-message-signatures-19 | RFC-ietf-httpbis-message-signatures-19, Section 4.1: HTTP Message Signatures}
   */
  SignatureInput: "Signature-Input",

  /**
   * HTTP Header SLUG
   *
   * @see {@link https://www.iana.org/go/rfc5023 | RFC 5023: The Atom Publishing Protocol}
   */
  SLUG: "SLUG",

  /**
   * HTTP Header SoapAction
   *
   * @see {@link https://www.w3.org/TR/2000/NOTE-SOAP-20000508 | Simple Object Access Protocol (SOAP) 1.1}
   */
  SoapAction: "SoapAction",

  /**
   * HTTP Header Status-URI
   *
   * @see {@link https://www.iana.org/go/rfc2518 | RFC 2518: HTTP Extensions for Distributed Authoring -- WEBDAV}
   */
  StatusUri: "Status-URI",

  /**
   * HTTP Header Strict-Transport-Security
   *
   * @see {@link https://www.iana.org/go/rfc6797 | RFC 6797: HTTP Strict Transport Security (HSTS)}
   */
  StrictTransportSecurity: "Strict-Transport-Security",

  /**
   * HTTP Header Sunset
   *
   * @see {@link https://www.iana.org/go/rfc8594 | RFC 8594: The Sunset HTTP Header Field}
   */
  Sunset: "Sunset",

  /**
   * HTTP Header TCN
   *
   * @see {@link https://www.iana.org/go/rfc2295 | RFC 2295: Transparent Content Negotiation in HTTP}
   */
  TCN: "TCN",

  /**
   * HTTP Header TE
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.1.4: HTTP Semantics}
   */
  TE: "TE",

  /**
   * HTTP Header Timeout
   *
   * @see {@link https://www.iana.org/go/rfc4918 | RFC 4918: HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)}
   */
  Timeout: "Timeout",

  /**
   * HTTP Header Topic
   *
   * @see {@link https://www.iana.org/go/rfc8030 | RFC 8030, Section 5.4: Generic Event Delivery Using HTTP Push}
   */
  Topic: "Topic",

  /**
   * HTTP Header Traceparent
   *
   * @see {@link https://www.w3.org/TR/trace-context/#traceparent-header | Trace Context}
   */
  Traceparent: "Traceparent",

  /**
   * HTTP Header Tracestate
   *
   * @see {@link https://www.w3.org/TR/trace-context/#tracestate-header | Trace Context}
   */
  Tracestate: "Tracestate",

  /**
   * HTTP Header Trailer
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 6.6.2: HTTP Semantics}
   */
  Trailer: "Trailer",

  /**
   * HTTP Header Transfer-Encoding
   *
   * @see {@link https://www.iana.org/go/rfc9112 | RFC9112, Section 6.1: HTTP Semantics}
   */
  TransferEncoding: "Transfer-Encoding",

  /**
   * HTTP Header TTL
   *
   * @see {@link https://www.iana.org/go/rfc8030 | RFC 8030, Section 5.2: Generic Event Delivery Using HTTP Push}
   */
  TTL: "TTL",

  /**
   * HTTP Header Upgrade
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 7.8: HTTP Semantics}
   */
  Upgrade: "Upgrade",

  /**
   * HTTP Header Urgency
   *
   * @see {@link https://www.iana.org/go/rfc8030 | RFC 8030, Section 5.3: Generic Event Delivery Using HTTP Push}
   */
  Urgency: "Urgency",

  /**
   * HTTP Header User-Agent
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 10.1.5: HTTP Semantics}
   */
  UserAgent: "User-Agent",

  /**
   * HTTP Header Variant-Vary
   *
   * @see {@link https://www.iana.org/go/rfc2295 | RFC 2295: Transparent Content Negotiation in HTTP}
   */
  VariantVary: "Variant-Vary",

  /**
   * HTTP Header Vary
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 12.5.5: HTTP Semantics}
   */
  Vary: "Vary",

  /**
   * HTTP Header Via
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 7.6.3: HTTP Semantics}
   */
  Via: "Via",

  /**
   * HTTP Header Want-Content-Digest
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-digest-headers-13 | RFC-ietf-httpbis-digest-headers-13, Section 4: Digest Fields}
   */
  WantContentDigest: "Want-Content-Digest",

  /**
   * HTTP Header Want-Repr-Digest
   *
   * @see {@link https://www.iana.org/go/draft-ietf-httpbis-digest-headers-13 | RFC-ietf-httpbis-digest-headers-13, Section 4: Digest Fields}
   */
  WantReprDigest: "Want-Repr-Digest",

  /**
   * HTTP Header WWW-Authenticate
   *
   * @see {@link https://www.iana.org/go/rfc9110 | RFC9110, Section 11.6.1: HTTP Semantics}
   */
  WwwAuthenticate: "WWW-Authenticate",

  /**
   * HTTP Header X-Content-Type-Options
   *
   * @see {@link https://fetch.spec.whatwg.org/#x-content-type-options-header | Fetch}
   */
  XContentTypeOptions: "X-Content-Type-Options",

  /**
   * HTTP Header X-Frame-Options
   *
   * @see {@link https://html.spec.whatwg.org/multipage/browsing-the-web.html#x-frame-options | HTML}
   */
  XFrameOptions: "X-Frame-Options",
} as const;

/**
 * A HTTP Header
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type Header = typeof HEADER[keyof typeof HEADER];
