// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-fmt-ignore-file
// deno-lint-ignore-file
import { nextTick } from "./_next_tick.ts";
import { stdio } from "./_process/stdio.mjs";

/* esm.sh - esbuild bundle(readable-stream@4.1.0) es2022 production */
const __Process$ = { nextTick, stdio };import { Buffer as __Buffer$ } from "./buffer.ts";import __string_decoder$ from "./string_decoder.ts";import __events$ from "./events.ts";import __buffer$ from "./buffer.ts";var ri=Object.create;var Lt=Object.defineProperty;var ii=Object.getOwnPropertyDescriptor;var oi=Object.getOwnPropertyNames;var li=Object.getPrototypeOf,fi=Object.prototype.hasOwnProperty;var $=(e=>typeof require!="undefined"?require:typeof Proxy!="undefined"?new Proxy(e,{get:(t,n)=>(typeof require!="undefined"?require:t)[n]}):e)(function(e){if(typeof require!="undefined")return require.apply(this,arguments);throw new Error('Dynamic require of "'+e+'" is not supported')});var _=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var ai=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of oi(t))!fi.call(e,i)&&i!==n&&Lt(e,i,{get:()=>t[i],enumerable:!(r=ii(t,i))||r.enumerable});return e};var si=(e,t,n)=>(n=e!=null?ri(li(e)):{},ai(t||!e||!e.__esModule?Lt(n,"default",{value:e,enumerable:!0}):n,e));var T=_((Ia,Pt)=>{"use strict";Pt.exports={ArrayIsArray(e){return Array.isArray(e)},ArrayPrototypeIncludes(e,t){return e.includes(t)},ArrayPrototypeIndexOf(e,t){return e.indexOf(t)},ArrayPrototypeJoin(e,t){return e.join(t)},ArrayPrototypeMap(e,t){return e.map(t)},ArrayPrototypePop(e,t){return e.pop(t)},ArrayPrototypePush(e,t){return e.push(t)},ArrayPrototypeSlice(e,t,n){return e.slice(t,n)},Error,FunctionPrototypeCall(e,t,...n){return e.call(t,...n)},FunctionPrototypeSymbolHasInstance(e,t){return Function.prototype[Symbol.hasInstance].call(e,t)},MathFloor:Math.floor,Number,NumberIsInteger:Number.isInteger,NumberIsNaN:Number.isNaN,NumberMAX_SAFE_INTEGER:Number.MAX_SAFE_INTEGER,NumberMIN_SAFE_INTEGER:Number.MIN_SAFE_INTEGER,NumberParseInt:Number.parseInt,ObjectDefineProperties(e,t){return Object.defineProperties(e,t)},ObjectDefineProperty(e,t,n){return Object.defineProperty(e,t,n)},ObjectGetOwnPropertyDescriptor(e,t){return Object.getOwnPropertyDescriptor(e,t)},ObjectKeys(e){return Object.keys(e)},ObjectSetPrototypeOf(e,t){return Object.setPrototypeOf(e,t)},Promise,PromisePrototypeCatch(e,t){return e.catch(t)},PromisePrototypeThen(e,t,n){return e.then(t,n)},PromiseReject(e){return Promise.reject(e)},ReflectApply:Reflect.apply,RegExpPrototypeTest(e,t){return e.test(t)},SafeSet:Set,String,StringPrototypeSlice(e,t,n){return e.slice(t,n)},StringPrototypeToLowerCase(e){return e.toLowerCase()},StringPrototypeToUpperCase(e){return e.toUpperCase()},StringPrototypeTrim(e){return e.trim()},Symbol,SymbolAsyncIterator:Symbol.asyncIterator,SymbolHasInstance:Symbol.hasInstance,SymbolIterator:Symbol.iterator,TypedArrayPrototypeSet(e,t,n){return e.set(t,n)},Uint8Array}});var W=_((Na,Ue)=>{"use strict";var ui=__buffer$,di=Object.getPrototypeOf(async function(){}).constructor,qt=globalThis.Blob||ui.Blob,ci=typeof qt<"u"?function(t){return t instanceof qt}:function(t){return!1},Be=class extends Error{constructor(t){if(!Array.isArray(t))throw new TypeError(`Expected input to be an Array, got ${typeof t}`);let n="";for(let r=0;r<t.length;r++)n+=`    ${t[r].stack}
`;super(n),this.name="AggregateError",this.errors=t}};Ue.exports={AggregateError:Be,once(e){let t=!1;return function(...n){t||(t=!0,e.apply(this,n))}},createDeferredPromise:function(){let e,t;return{promise:new Promise((r,i)=>{e=r,t=i}),resolve:e,reject:t}},promisify(e){return new Promise((t,n)=>{e((r,...i)=>r?n(r):t(...i))})},debuglog(){return function(){}},format(e,...t){return e.replace(/%([sdifj])/g,function(...[n,r]){let i=t.shift();return r==="f"?i.toFixed(6):r==="j"?JSON.stringify(i):r==="s"&&typeof i=="object"?`${i.constructor!==Object?i.constructor.name:""} {}`.trim():i.toString()})},inspect(e){switch(typeof e){case"string":if(e.includes("'"))if(e.includes('"')){if(!e.includes("`")&&!e.includes("${"))return`\`${e}\``}else return`"${e}"`;return`'${e}'`;case"number":return isNaN(e)?"NaN":Object.is(e,-0)?String(e):e;case"bigint":return`${String(e)}n`;case"boolean":case"undefined":return String(e);case"object":return"{}"}},types:{isAsyncFunction(e){return e instanceof di},isArrayBufferView(e){return ArrayBuffer.isView(e)}},isBlob:ci};Ue.exports.promisify.custom=Symbol.for("nodejs.util.promisify.custom")});var D=_((Ma,Ct)=>{"use strict";var{format:hi,inspect:ye,AggregateError:bi}=W(),pi=globalThis.AggregateError||bi,wi=Symbol("kIsNodeError"),yi=["string","function","number","object","Function","Object","boolean","bigint","symbol"],gi=/^([A-Z][a-z0-9]*)+$/,_i="__node_internal_",ge={};function z(e,t){if(!e)throw new ge.ERR_INTERNAL_ASSERTION(t)}function kt(e){let t="",n=e.length,r=e[0]==="-"?1:0;for(;n>=r+4;n-=3)t=`_${e.slice(n-3,n)}${t}`;return`${e.slice(0,n)}${t}`}function Si(e,t,n){if(typeof t=="function")return z(t.length<=n.length,`Code: ${e}; The provided arguments length (${n.length}) does not match the required ones (${t.length}).`),t(...n);let r=(t.match(/%[dfijoOs]/g)||[]).length;return z(r===n.length,`Code: ${e}; The provided arguments length (${n.length}) does not match the required ones (${r}).`),n.length===0?t:hi(t,...n)}function N(e,t,n){n||(n=Error);class r extends n{constructor(...o){super(Si(e,t,o))}toString(){return`${this.name} [${e}]: ${this.message}`}}Object.defineProperties(r.prototype,{name:{value:n.name,writable:!0,enumerable:!1,configurable:!0},toString:{value(){return`${this.name} [${e}]: ${this.message}`},writable:!0,enumerable:!1,configurable:!0}}),r.prototype.code=e,r.prototype[wi]=!0,ge[e]=r}function Wt(e){let t=_i+e.name;return Object.defineProperty(e,"name",{value:t}),e}function Ei(e,t){if(e&&t&&e!==t){if(Array.isArray(t.errors))return t.errors.push(e),t;let n=new pi([t,e],t.message);return n.code=t.code,n}return e||t}var Ge=class extends Error{constructor(t="The operation was aborted",n=void 0){if(n!==void 0&&typeof n!="object")throw new ge.ERR_INVALID_ARG_TYPE("options","Object",n);super(t,n),this.code="ABORT_ERR",this.name="AbortError"}};N("ERR_ASSERTION","%s",Error);N("ERR_INVALID_ARG_TYPE",(e,t,n)=>{z(typeof e=="string","'name' must be a string"),Array.isArray(t)||(t=[t]);let r="The ";e.endsWith(" argument")?r+=`${e} `:r+=`"${e}" ${e.includes(".")?"property":"argument"} `,r+="must be ";let i=[],o=[],l=[];for(let a of t)z(typeof a=="string","All expected entries have to be of type string"),yi.includes(a)?i.push(a.toLowerCase()):gi.test(a)?o.push(a):(z(a!=="object",'The value "object" should be written as "Object"'),l.push(a));if(o.length>0){let a=i.indexOf("object");a!==-1&&(i.splice(i,a,1),o.push("Object"))}if(i.length>0){switch(i.length){case 1:r+=`of type ${i[0]}`;break;case 2:r+=`one of type ${i[0]} or ${i[1]}`;break;default:{let a=i.pop();r+=`one of type ${i.join(", ")}, or ${a}`}}(o.length>0||l.length>0)&&(r+=" or ")}if(o.length>0){switch(o.length){case 1:r+=`an instance of ${o[0]}`;break;case 2:r+=`an instance of ${o[0]} or ${o[1]}`;break;default:{let a=o.pop();r+=`an instance of ${o.join(", ")}, or ${a}`}}l.length>0&&(r+=" or ")}switch(l.length){case 0:break;case 1:l[0].toLowerCase()!==l[0]&&(r+="an "),r+=`${l[0]}`;break;case 2:r+=`one of ${l[0]} or ${l[1]}`;break;default:{let a=l.pop();r+=`one of ${l.join(", ")}, or ${a}`}}if(n==null)r+=`. Received ${n}`;else if(typeof n=="function"&&n.name)r+=`. Received function ${n.name}`;else if(typeof n=="object"){var s;(s=n.constructor)!==null&&s!==void 0&&s.name?r+=`. Received an instance of ${n.constructor.name}`:r+=`. Received ${ye(n,{depth:-1})}`}else{let a=ye(n,{colors:!1});a.length>25&&(a=`${a.slice(0,25)}...`),r+=`. Received type ${typeof n} (${a})`}return r},TypeError);N("ERR_INVALID_ARG_VALUE",(e,t,n="is invalid")=>{let r=ye(t);return r.length>128&&(r=r.slice(0,128)+"..."),`The ${e.includes(".")?"property":"argument"} '${e}' ${n}. Received ${r}`},TypeError);N("ERR_INVALID_RETURN_VALUE",(e,t,n)=>{var r;let i=n!=null&&(r=n.constructor)!==null&&r!==void 0&&r.name?`instance of ${n.constructor.name}`:`type ${typeof n}`;return`Expected ${e} to be returned from the "${t}" function but got ${i}.`},TypeError);N("ERR_MISSING_ARGS",(...e)=>{z(e.length>0,"At least one arg needs to be specified");let t,n=e.length;switch(e=(Array.isArray(e)?e:[e]).map(r=>`"${r}"`).join(" or "),n){case 1:t+=`The ${e[0]} argument`;break;case 2:t+=`The ${e[0]} and ${e[1]} arguments`;break;default:{let r=e.pop();t+=`The ${e.join(", ")}, and ${r} arguments`}break}return`${t} must be specified`},TypeError);N("ERR_OUT_OF_RANGE",(e,t,n)=>{z(t,'Missing "range" argument');let r;return Number.isInteger(n)&&Math.abs(n)>2**32?r=kt(String(n)):typeof n=="bigint"?(r=String(n),(n>2n**32n||n<-(2n**32n))&&(r=kt(r)),r+="n"):r=ye(n),`The value of "${e}" is out of range. It must be ${t}. Received ${r}`},RangeError);N("ERR_MULTIPLE_CALLBACK","Callback called multiple times",Error);N("ERR_METHOD_NOT_IMPLEMENTED","The %s method is not implemented",Error);N("ERR_STREAM_ALREADY_FINISHED","Cannot call %s after a stream was finished",Error);N("ERR_STREAM_CANNOT_PIPE","Cannot pipe, not readable",Error);N("ERR_STREAM_DESTROYED","Cannot call %s after a stream was destroyed",Error);N("ERR_STREAM_NULL_VALUES","May not write null values to stream",TypeError);N("ERR_STREAM_PREMATURE_CLOSE","Premature close",Error);N("ERR_STREAM_PUSH_AFTER_EOF","stream.push() after EOF",Error);N("ERR_STREAM_UNSHIFT_AFTER_END_EVENT","stream.unshift() after end event",Error);N("ERR_STREAM_WRITE_AFTER_END","write after end",Error);N("ERR_UNKNOWN_ENCODING","Unknown encoding: %s",TypeError);Ct.exports={AbortError:Ge,aggregateTwoErrors:Wt(Ei),hideStackFrames:Wt,codes:ge}});var ue=_((Da,Ht)=>{"use strict";var{ArrayIsArray:$t,ArrayPrototypeIncludes:Ri,ArrayPrototypeJoin:Ai,ArrayPrototypeMap:mi,NumberIsInteger:He,NumberMAX_SAFE_INTEGER:Ti,NumberMIN_SAFE_INTEGER:Ii,NumberParseInt:Ni,RegExpPrototypeTest:Mi,String:Di,StringPrototypeToUpperCase:xi,StringPrototypeTrim:Oi}=T(),{hideStackFrames:q,codes:{ERR_SOCKET_BAD_PORT:Li,ERR_INVALID_ARG_TYPE:O,ERR_INVALID_ARG_VALUE:_e,ERR_OUT_OF_RANGE:H,ERR_UNKNOWN_SIGNAL:jt}}=D(),{normalizeEncoding:Pi}=W(),{isAsyncFunction:qi,isArrayBufferView:ki}=W().types,vt={};function Ft(e){return e===(e|0)}function Bt(e){return e===e>>>0}var Wi=/^[0-7]+$/,Ci="must be a 32-bit unsigned integer or an octal string";function ji(e,t,n){if(typeof e>"u"&&(e=n),typeof e=="string"){if(!Mi(Wi,e))throw new _e(t,e,Ci);e=Ni(e,8)}return Ut(e,t,0,2**32-1),e}var vi=q((e,t,n=Ii,r=Ti)=>{if(typeof e!="number")throw new O(t,"number",e);if(!He(e))throw new H(t,"an integer",e);if(e<n||e>r)throw new H(t,`>= ${n} && <= ${r}`,e)}),Ut=q((e,t,n=-2147483648,r=2147483647)=>{if(typeof e!="number")throw new O(t,"number",e);if(!Ft(e))throw He(e)?new H(t,`>= ${n} && <= ${r}`,e):new H(t,"an integer",e);if(e<n||e>r)throw new H(t,`>= ${n} && <= ${r}`,e)}),$i=q((e,t,n)=>{if(typeof e!="number")throw new O(t,"number",e);if(!Bt(e)){if(!He(e))throw new H(t,"an integer",e);let r=n?1:0;throw new H(t,`>= ${r} && < 4294967296`,e)}if(n&&e===0)throw new H(t,">= 1 && < 4294967296",e)});function Gt(e,t){if(typeof e!="string")throw new O(t,"string",e)}function Fi(e,t){if(typeof e!="number")throw new O(t,"number",e)}var Bi=q((e,t,n)=>{if(!Ri(n,e)){let r=Ai(mi(n,o=>typeof o=="string"?`'${o}'`:Di(o)),", "),i="must be one of: "+r;throw new _e(t,e,i)}});function Ui(e,t){if(typeof e!="boolean")throw new O(t,"boolean",e)}var Gi=q((e,t,n)=>{let r=n==null,i=r?!1:n.allowArray,o=r?!1:n.allowFunction;if(!(r?!1:n.nullable)&&e===null||!i&&$t(e)||typeof e!="object"&&(!o||typeof e!="function"))throw new O(t,"Object",e)}),Hi=q((e,t,n=0)=>{if(!$t(e))throw new O(t,"Array",e);if(e.length<n){let r=`must be longer than ${n}`;throw new _e(t,e,r)}});function Vi(e,t="signal"){if(Gt(e,t),vt[e]===void 0)throw vt[xi(e)]!==void 0?new jt(e+" (signals must use all capital letters)"):new jt(e)}var Yi=q((e,t="buffer")=>{if(!ki(e))throw new O(t,["Buffer","TypedArray","DataView"],e)});function Ki(e,t){let n=Pi(t),r=e.length;if(n==="hex"&&r%2!==0)throw new _e("encoding",t,`is invalid for data of length ${r}`)}function zi(e,t="Port",n=!0){if(typeof e!="number"&&typeof e!="string"||typeof e=="string"&&Oi(e).length===0||+e!==+e>>>0||e>65535||e===0&&!n)throw new Li(t,e,n);return e|0}var Xi=q((e,t)=>{if(e!==void 0&&(e===null||typeof e!="object"||!("aborted"in e)))throw new O(t,"AbortSignal",e)}),Ji=q((e,t)=>{if(typeof e!="function")throw new O(t,"Function",e)}),Qi=q((e,t)=>{if(typeof e!="function"||qi(e))throw new O(t,"Function",e)}),Zi=q((e,t)=>{if(e!==void 0)throw new O(t,"undefined",e)});Ht.exports={isInt32:Ft,isUint32:Bt,parseFileMode:ji,validateArray:Hi,validateBoolean:Ui,validateBuffer:Yi,validateEncoding:Ki,validateFunction:Ji,validateInt32:Ut,validateInteger:vi,validateNumber:Fi,validateObject:Gi,validateOneOf:Bi,validatePlainFunction:Qi,validatePort:zi,validateSignalName:Vi,validateString:Gt,validateUint32:$i,validateUndefined:Zi,validateAbortSignal:Xi}});var V=_((xa,rn)=>{"use strict";var{Symbol:Se,SymbolAsyncIterator:Vt,SymbolIterator:Yt}=T(),Kt=Se("kDestroyed"),zt=Se("kIsErrored"),Ve=Se("kIsReadable"),Xt=Se("kIsDisturbed");function Ee(e,t=!1){var n;return!!(e&&typeof e.pipe=="function"&&typeof e.on=="function"&&(!t||typeof e.pause=="function"&&typeof e.resume=="function")&&(!e._writableState||((n=e._readableState)===null||n===void 0?void 0:n.readable)!==!1)&&(!e._writableState||e._readableState))}function Re(e){var t;return!!(e&&typeof e.write=="function"&&typeof e.on=="function"&&(!e._readableState||((t=e._writableState)===null||t===void 0?void 0:t.writable)!==!1))}function eo(e){return!!(e&&typeof e.pipe=="function"&&e._readableState&&typeof e.on=="function"&&typeof e.write=="function")}function X(e){return e&&(e._readableState||e._writableState||typeof e.write=="function"&&typeof e.on=="function"||typeof e.pipe=="function"&&typeof e.on=="function")}function to(e,t){return e==null?!1:t===!0?typeof e[Vt]=="function":t===!1?typeof e[Yt]=="function":typeof e[Vt]=="function"||typeof e[Yt]=="function"}function Ae(e){if(!X(e))return null;let t=e._writableState,n=e._readableState,r=t||n;return!!(e.destroyed||e[Kt]||r!=null&&r.destroyed)}function Jt(e){if(!Re(e))return null;if(e.writableEnded===!0)return!0;let t=e._writableState;return t!=null&&t.errored?!1:typeof t?.ended!="boolean"?null:t.ended}function no(e,t){if(!Re(e))return null;if(e.writableFinished===!0)return!0;let n=e._writableState;return n!=null&&n.errored?!1:typeof n?.finished!="boolean"?null:!!(n.finished||t===!1&&n.ended===!0&&n.length===0)}function ro(e){if(!Ee(e))return null;if(e.readableEnded===!0)return!0;let t=e._readableState;return!t||t.errored?!1:typeof t?.ended!="boolean"?null:t.ended}function Qt(e,t){if(!Ee(e))return null;let n=e._readableState;return n!=null&&n.errored?!1:typeof n?.endEmitted!="boolean"?null:!!(n.endEmitted||t===!1&&n.ended===!0&&n.length===0)}function Zt(e){return e&&e[Ve]!=null?e[Ve]:typeof e?.readable!="boolean"?null:Ae(e)?!1:Ee(e)&&e.readable&&!Qt(e)}function en(e){return typeof e?.writable!="boolean"?null:Ae(e)?!1:Re(e)&&e.writable&&!Jt(e)}function io(e,t){return X(e)?Ae(e)?!0:!(t?.readable!==!1&&Zt(e)||t?.writable!==!1&&en(e)):null}function oo(e){var t,n;return X(e)?e.writableErrored?e.writableErrored:(t=(n=e._writableState)===null||n===void 0?void 0:n.errored)!==null&&t!==void 0?t:null:null}function lo(e){var t,n;return X(e)?e.readableErrored?e.readableErrored:(t=(n=e._readableState)===null||n===void 0?void 0:n.errored)!==null&&t!==void 0?t:null:null}function fo(e){if(!X(e))return null;if(typeof e.closed=="boolean")return e.closed;let t=e._writableState,n=e._readableState;return typeof t?.closed=="boolean"||typeof n?.closed=="boolean"?t?.closed||n?.closed:typeof e._closed=="boolean"&&tn(e)?e._closed:null}function tn(e){return typeof e._closed=="boolean"&&typeof e._defaultKeepAlive=="boolean"&&typeof e._removedConnection=="boolean"&&typeof e._removedContLen=="boolean"}function nn(e){return typeof e._sent100=="boolean"&&tn(e)}function ao(e){var t;return typeof e._consuming=="boolean"&&typeof e._dumped=="boolean"&&((t=e.req)===null||t===void 0?void 0:t.upgradeOrConnect)===void 0}function so(e){if(!X(e))return null;let t=e._writableState,n=e._readableState,r=t||n;return!r&&nn(e)||!!(r&&r.autoDestroy&&r.emitClose&&r.closed===!1)}function uo(e){var t;return!!(e&&((t=e[Xt])!==null&&t!==void 0?t:e.readableDidRead||e.readableAborted))}function co(e){var t,n,r,i,o,l,s,a,f,c;return!!(e&&((t=(n=(r=(i=(o=(l=e[zt])!==null&&l!==void 0?l:e.readableErrored)!==null&&o!==void 0?o:e.writableErrored)!==null&&i!==void 0?i:(s=e._readableState)===null||s===void 0?void 0:s.errorEmitted)!==null&&r!==void 0?r:(a=e._writableState)===null||a===void 0?void 0:a.errorEmitted)!==null&&n!==void 0?n:(f=e._readableState)===null||f===void 0?void 0:f.errored)!==null&&t!==void 0?t:(c=e._writableState)===null||c===void 0?void 0:c.errored))}rn.exports={kDestroyed:Kt,isDisturbed:uo,kIsDisturbed:Xt,isErrored:co,kIsErrored:zt,isReadable:Zt,kIsReadable:Ve,isClosed:fo,isDestroyed:Ae,isDuplexNodeStream:eo,isFinished:io,isIterable:to,isReadableNodeStream:Ee,isReadableEnded:ro,isReadableFinished:Qt,isReadableErrored:lo,isNodeStream:X,isWritable:en,isWritableNodeStream:Re,isWritableEnded:Jt,isWritableFinished:no,isWritableErrored:oo,isServerRequest:ao,isServerResponse:nn,willEmitClose:so}});var Y=_((Oa,Ke)=>{"use strict";var{AbortError:ho,codes:bo}=D(),{ERR_INVALID_ARG_TYPE:po,ERR_STREAM_PREMATURE_CLOSE:on}=bo,{once:ln}=W(),{validateAbortSignal:wo,validateFunction:yo,validateObject:go}=ue(),{Promise:_o}=T(),{isClosed:So,isReadable:fn,isReadableNodeStream:Ye,isReadableFinished:an,isReadableErrored:Eo,isWritable:sn,isWritableNodeStream:un,isWritableFinished:dn,isWritableErrored:Ro,isNodeStream:Ao,willEmitClose:mo}=V();function To(e){return e.setHeader&&typeof e.abort=="function"}var Io=()=>{};function cn(e,t,n){var r,i;arguments.length===2?(n=t,t={}):t==null?t={}:go(t,"options"),yo(n,"callback"),wo(t.signal,"options.signal"),n=ln(n);let o=(r=t.readable)!==null&&r!==void 0?r:Ye(e),l=(i=t.writable)!==null&&i!==void 0?i:un(e);if(!Ao(e))throw new po("stream","Stream",e);let s=e._writableState,a=e._readableState,f=()=>{e.writable||p()},c=mo(e)&&Ye(e)===o&&un(e)===l,u=dn(e,!1),p=()=>{u=!0,e.destroyed&&(c=!1),!(c&&(!e.readable||o))&&(!o||d)&&n.call(e)},d=an(e,!1),b=()=>{d=!0,e.destroyed&&(c=!1),!(c&&(!e.writable||l))&&(!l||u)&&n.call(e)},M=R=>{n.call(e,R)},g=So(e),h=()=>{g=!0;let R=Ro(e)||Eo(e);if(R&&typeof R!="boolean")return n.call(e,R);if(o&&!d&&Ye(e,!0)&&!an(e,!1))return n.call(e,new on);if(l&&!u&&!dn(e,!1))return n.call(e,new on);n.call(e)},S=()=>{e.req.on("finish",p)};To(e)?(e.on("complete",p),c||e.on("abort",h),e.req?S():e.on("request",S)):l&&!s&&(e.on("end",f),e.on("close",f)),!c&&typeof e.aborted=="boolean"&&e.on("aborted",h),e.on("end",b),e.on("finish",p),t.error!==!1&&e.on("error",M),e.on("close",h),g?__Process$.nextTick(h):s!=null&&s.errorEmitted||a!=null&&a.errorEmitted?c||__Process$.nextTick(h):(!o&&(!c||fn(e))&&(u||sn(e)===!1)||!l&&(!c||sn(e))&&(d||fn(e)===!1)||a&&e.req&&e.aborted)&&__Process$.nextTick(h);let x=()=>{n=Io,e.removeListener("aborted",h),e.removeListener("complete",p),e.removeListener("abort",h),e.removeListener("request",S),e.req&&e.req.removeListener("finish",p),e.removeListener("end",f),e.removeListener("close",f),e.removeListener("finish",p),e.removeListener("end",b),e.removeListener("error",M),e.removeListener("close",h)};if(t.signal&&!g){let R=()=>{let G=n;x(),G.call(e,new ho(void 0,{cause:t.signal.reason}))};if(t.signal.aborted)__Process$.nextTick(R);else{let G=n;n=ln((...L)=>{t.signal.removeEventListener("abort",R),G.apply(e,L)}),t.signal.addEventListener("abort",R)}}return x}function No(e,t){return new _o((n,r)=>{cn(e,t,i=>{i?r(i):n()})})}Ke.exports=cn;Ke.exports.finished=No});var Sn=_((La,Je)=>{"use strict";var wn=globalThis.AbortController,{codes:{ERR_INVALID_ARG_TYPE:de,ERR_MISSING_ARGS:Mo,ERR_OUT_OF_RANGE:Do},AbortError:C}=D(),{validateAbortSignal:te,validateInteger:xo,validateObject:ne}=ue(),Oo=T().Symbol("kWeak"),{finished:Lo}=Y(),{ArrayPrototypePush:Po,MathFloor:qo,Number:ko,NumberIsNaN:Wo,Promise:hn,PromiseReject:bn,PromisePrototypeCatch:Co,Symbol:yn}=T(),me=yn("kEmpty"),pn=yn("kEof");function Te(e,t){if(typeof e!="function")throw new de("fn",["Function","AsyncFunction"],e);t!=null&&ne(t,"options"),t?.signal!=null&&te(t.signal,"options.signal");let n=1;return t?.concurrency!=null&&(n=qo(t.concurrency)),xo(n,"concurrency",1),async function*(){var i,o;let l=new wn,s=this,a=[],f=l.signal,c={signal:f},u=()=>l.abort();t!=null&&(i=t.signal)!==null&&i!==void 0&&i.aborted&&u(),t==null||(o=t.signal)===null||o===void 0||o.addEventListener("abort",u);let p,d,b=!1;function M(){b=!0}async function g(){try{for await(let x of s){var h;if(b)return;if(f.aborted)throw new C;try{x=e(x,c)}catch(R){x=bn(R)}x!==me&&(typeof((h=x)===null||h===void 0?void 0:h.catch)=="function"&&x.catch(M),a.push(x),p&&(p(),p=null),!b&&a.length&&a.length>=n&&await new hn(R=>{d=R}))}a.push(pn)}catch(x){let R=bn(x);Co(R,M),a.push(R)}finally{var S;b=!0,p&&(p(),p=null),t==null||(S=t.signal)===null||S===void 0||S.removeEventListener("abort",u)}}g();try{for(;;){for(;a.length>0;){let h=await a[0];if(h===pn)return;if(f.aborted)throw new C;h!==me&&(yield h),a.shift(),d&&(d(),d=null)}await new hn(h=>{p=h})}}finally{l.abort(),b=!0,d&&(d(),d=null)}}.call(this)}function jo(e=void 0){return e!=null&&ne(e,"options"),e?.signal!=null&&te(e.signal,"options.signal"),async function*(){let n=0;for await(let i of this){var r;if(e!=null&&(r=e.signal)!==null&&r!==void 0&&r.aborted)throw new C({cause:e.signal.reason});yield[n++,i]}}.call(this)}async function gn(e,t=void 0){for await(let n of Xe.call(this,e,t))return!0;return!1}async function vo(e,t=void 0){if(typeof e!="function")throw new de("fn",["Function","AsyncFunction"],e);return!await gn.call(this,async(...n)=>!await e(...n),t)}async function $o(e,t){for await(let n of Xe.call(this,e,t))return n}async function Fo(e,t){if(typeof e!="function")throw new de("fn",["Function","AsyncFunction"],e);async function n(r,i){return await e(r,i),me}for await(let r of Te.call(this,n,t));}function Xe(e,t){if(typeof e!="function")throw new de("fn",["Function","AsyncFunction"],e);async function n(r,i){return await e(r,i)?r:me}return Te.call(this,n,t)}var ze=class extends Mo{constructor(){super("reduce"),this.message="Reduce of an empty stream requires an initial value"}};async function Bo(e,t,n){var r;if(typeof e!="function")throw new de("reducer",["Function","AsyncFunction"],e);n!=null&&ne(n,"options"),n?.signal!=null&&te(n.signal,"options.signal");let i=arguments.length>1;if(n!=null&&(r=n.signal)!==null&&r!==void 0&&r.aborted){let f=new C(void 0,{cause:n.signal.reason});throw this.once("error",()=>{}),await Lo(this.destroy(f)),f}let o=new wn,l=o.signal;if(n!=null&&n.signal){let f={once:!0,[Oo]:this};n.signal.addEventListener("abort",()=>o.abort(),f)}let s=!1;try{for await(let f of this){var a;if(s=!0,n!=null&&(a=n.signal)!==null&&a!==void 0&&a.aborted)throw new C;i?t=await e(t,f,{signal:l}):(t=f,i=!0)}if(!s&&!i)throw new ze}finally{o.abort()}return t}async function Uo(e){e!=null&&ne(e,"options"),e?.signal!=null&&te(e.signal,"options.signal");let t=[];for await(let r of this){var n;if(e!=null&&(n=e.signal)!==null&&n!==void 0&&n.aborted)throw new C(void 0,{cause:e.signal.reason});Po(t,r)}return t}function Go(e,t){let n=Te.call(this,e,t);return async function*(){for await(let i of n)yield*i}.call(this)}function _n(e){if(e=ko(e),Wo(e))return 0;if(e<0)throw new Do("number",">= 0",e);return e}function Ho(e,t=void 0){return t!=null&&ne(t,"options"),t?.signal!=null&&te(t.signal,"options.signal"),e=_n(e),async function*(){var r;if(t!=null&&(r=t.signal)!==null&&r!==void 0&&r.aborted)throw new C;for await(let o of this){var i;if(t!=null&&(i=t.signal)!==null&&i!==void 0&&i.aborted)throw new C;e--<=0&&(yield o)}}.call(this)}function Vo(e,t=void 0){return t!=null&&ne(t,"options"),t?.signal!=null&&te(t.signal,"options.signal"),e=_n(e),async function*(){var r;if(t!=null&&(r=t.signal)!==null&&r!==void 0&&r.aborted)throw new C;for await(let o of this){var i;if(t!=null&&(i=t.signal)!==null&&i!==void 0&&i.aborted)throw new C;if(e-- >0)yield o;else return}}.call(this)}Je.exports.streamReturningOperators={asIndexedPairs:jo,drop:Ho,filter:Xe,flatMap:Go,map:Te,take:Vo};Je.exports.promiseReturningOperators={every:vo,forEach:Fo,reduce:Bo,toArray:Uo,some:gn,find:$o}});var J=_((Pa,Mn)=>{"use strict";var{aggregateTwoErrors:Yo,codes:{ERR_MULTIPLE_CALLBACK:Ko},AbortError:zo}=D(),{Symbol:An}=T(),{kDestroyed:Xo,isDestroyed:Jo,isFinished:Qo,isServerRequest:Zo}=V(),mn=An("kDestroy"),Qe=An("kConstruct");function Tn(e,t,n){e&&(e.stack,t&&!t.errored&&(t.errored=e),n&&!n.errored&&(n.errored=e))}function el(e,t){let n=this._readableState,r=this._writableState,i=r||n;return r&&r.destroyed||n&&n.destroyed?(typeof t=="function"&&t(),this):(Tn(e,r,n),r&&(r.destroyed=!0),n&&(n.destroyed=!0),i.constructed?En(this,e,t):this.once(mn,function(o){En(this,Yo(o,e),t)}),this)}function En(e,t,n){let r=!1;function i(o){if(r)return;r=!0;let l=e._readableState,s=e._writableState;Tn(o,s,l),s&&(s.closed=!0),l&&(l.closed=!0),typeof n=="function"&&n(o),o?__Process$.nextTick(tl,e,o):__Process$.nextTick(In,e)}try{e._destroy(t||null,i)}catch(o){i(o)}}function tl(e,t){Ze(e,t),In(e)}function In(e){let t=e._readableState,n=e._writableState;n&&(n.closeEmitted=!0),t&&(t.closeEmitted=!0),(n&&n.emitClose||t&&t.emitClose)&&e.emit("close")}function Ze(e,t){let n=e._readableState,r=e._writableState;r&&r.errorEmitted||n&&n.errorEmitted||(r&&(r.errorEmitted=!0),n&&(n.errorEmitted=!0),e.emit("error",t))}function nl(){let e=this._readableState,t=this._writableState;e&&(e.constructed=!0,e.closed=!1,e.closeEmitted=!1,e.destroyed=!1,e.errored=null,e.errorEmitted=!1,e.reading=!1,e.ended=e.readable===!1,e.endEmitted=e.readable===!1),t&&(t.constructed=!0,t.destroyed=!1,t.closed=!1,t.closeEmitted=!1,t.errored=null,t.errorEmitted=!1,t.finalCalled=!1,t.prefinished=!1,t.ended=t.writable===!1,t.ending=t.writable===!1,t.finished=t.writable===!1)}function et(e,t,n){let r=e._readableState,i=e._writableState;if(i&&i.destroyed||r&&r.destroyed)return this;r&&r.autoDestroy||i&&i.autoDestroy?e.destroy(t):t&&(t.stack,i&&!i.errored&&(i.errored=t),r&&!r.errored&&(r.errored=t),n?__Process$.nextTick(Ze,e,t):Ze(e,t))}function rl(e,t){if(typeof e._construct!="function")return;let n=e._readableState,r=e._writableState;n&&(n.constructed=!1),r&&(r.constructed=!1),e.once(Qe,t),!(e.listenerCount(Qe)>1)&&__Process$.nextTick(il,e)}function il(e){let t=!1;function n(r){if(t){et(e,r??new Ko);return}t=!0;let i=e._readableState,o=e._writableState,l=o||i;i&&(i.constructed=!0),o&&(o.constructed=!0),l.destroyed?e.emit(mn,r):r?et(e,r,!0):__Process$.nextTick(ol,e)}try{e._construct(n)}catch(r){n(r)}}function ol(e){e.emit(Qe)}function Rn(e){return e&&e.setHeader&&typeof e.abort=="function"}function Nn(e){e.emit("close")}function ll(e,t){e.emit("error",t),__Process$.nextTick(Nn,e)}function fl(e,t){!e||Jo(e)||(!t&&!Qo(e)&&(t=new zo),Zo(e)?(e.socket=null,e.destroy(t)):Rn(e)?e.abort():Rn(e.req)?e.req.abort():typeof e.destroy=="function"?e.destroy(t):typeof e.close=="function"?e.close():t?__Process$.nextTick(ll,e):__Process$.nextTick(Nn,e),e.destroyed||(e[Xo]=!0))}Mn.exports={construct:rl,destroyer:fl,destroy:el,undestroy:nl,errorOrDestroy:et}});var Me=_((qa,xn)=>{"use strict";var{ArrayIsArray:al,ObjectSetPrototypeOf:Dn}=T(),{EventEmitter:Ie}=__events$;function Ne(e){Ie.call(this,e)}Dn(Ne.prototype,Ie.prototype);Dn(Ne,Ie);Ne.prototype.pipe=function(e,t){let n=this;function r(c){e.writable&&e.write(c)===!1&&n.pause&&n.pause()}n.on("data",r);function i(){n.readable&&n.resume&&n.resume()}e.on("drain",i),!e._isStdio&&(!t||t.end!==!1)&&(n.on("end",l),n.on("close",s));let o=!1;function l(){o||(o=!0,e.end())}function s(){o||(o=!0,typeof e.destroy=="function"&&e.destroy())}function a(c){f(),Ie.listenerCount(this,"error")===0&&this.emit("error",c)}tt(n,"error",a),tt(e,"error",a);function f(){n.removeListener("data",r),e.removeListener("drain",i),n.removeListener("end",l),n.removeListener("close",s),n.removeListener("error",a),e.removeListener("error",a),n.removeListener("end",f),n.removeListener("close",f),e.removeListener("close",f)}return n.on("end",f),n.on("close",f),e.on("close",f),e.emit("pipe",n),e};function tt(e,t,n){if(typeof e.prependListener=="function")return e.prependListener(t,n);!e._events||!e._events[t]?e.on(t,n):al(e._events[t])?e._events[t].unshift(n):e._events[t]=[n,e._events[t]]}xn.exports={Stream:Ne,prependListener:tt}});var xe=_((ka,De)=>{"use strict";var{AbortError:sl,codes:ul}=D(),dl=Y(),{ERR_INVALID_ARG_TYPE:On}=ul,cl=(e,t)=>{if(typeof e!="object"||!("aborted"in e))throw new On(t,"AbortSignal",e)};function hl(e){return!!(e&&typeof e.pipe=="function")}De.exports.addAbortSignal=function(t,n){if(cl(t,"signal"),!hl(n))throw new On("stream","stream.Stream",n);return De.exports.addAbortSignalNoValidate(t,n)};De.exports.addAbortSignalNoValidate=function(e,t){if(typeof e!="object"||!("aborted"in e))return t;let n=()=>{t.destroy(new sl(void 0,{cause:e.reason}))};return e.aborted?n():(e.addEventListener("abort",n),dl(t,()=>e.removeEventListener("abort",n))),t}});var qn=_((Ca,Pn)=>{"use strict";var{StringPrototypeSlice:Ln,SymbolIterator:bl,TypedArrayPrototypeSet:Oe,Uint8Array:pl}=T(),{inspect:wl}=W();Pn.exports=class{constructor(){this.head=null,this.tail=null,this.length=0}push(t){let n={data:t,next:null};this.length>0?this.tail.next=n:this.head=n,this.tail=n,++this.length}unshift(t){let n={data:t,next:this.head};this.length===0&&(this.tail=n),this.head=n,++this.length}shift(){if(this.length===0)return;let t=this.head.data;return this.length===1?this.head=this.tail=null:this.head=this.head.next,--this.length,t}clear(){this.head=this.tail=null,this.length=0}join(t){if(this.length===0)return"";let n=this.head,r=""+n.data;for(;(n=n.next)!==null;)r+=t+n.data;return r}concat(t){if(this.length===0)return __Buffer$.alloc(0);let n=__Buffer$.allocUnsafe(t>>>0),r=this.head,i=0;for(;r;)Oe(n,r.data,i),i+=r.data.length,r=r.next;return n}consume(t,n){let r=this.head.data;if(t<r.length){let i=r.slice(0,t);return this.head.data=r.slice(t),i}return t===r.length?this.shift():n?this._getString(t):this._getBuffer(t)}first(){return this.head.data}*[bl](){for(let t=this.head;t;t=t.next)yield t.data}_getString(t){let n="",r=this.head,i=0;do{let o=r.data;if(t>o.length)n+=o,t-=o.length;else{t===o.length?(n+=o,++i,r.next?this.head=r.next:this.head=this.tail=null):(n+=Ln(o,0,t),this.head=r,r.data=Ln(o,t));break}++i}while((r=r.next)!==null);return this.length-=i,n}_getBuffer(t){let n=__Buffer$.allocUnsafe(t),r=t,i=this.head,o=0;do{let l=i.data;if(t>l.length)Oe(n,l,r-t),t-=l.length;else{t===l.length?(Oe(n,l,r-t),++o,i.next?this.head=i.next:this.head=this.tail=null):(Oe(n,new pl(l.buffer,l.byteOffset,t),r-t),this.head=i,i.data=l.slice(t));break}++o}while((i=i.next)!==null);return this.length-=o,n}[Symbol.for("nodejs.util.inspect.custom")](t,n){return wl(this,{...n,depth:0,customInspect:!1})}}});var nt=_((ja,Wn)=>{"use strict";var{MathFloor:yl,NumberIsInteger:gl}=T(),{ERR_INVALID_ARG_VALUE:_l}=D().codes;function Sl(e,t,n){return e.highWaterMark!=null?e.highWaterMark:t?e[n]:null}function kn(e){return e?16:16*1024}function El(e,t,n,r){let i=Sl(t,r,n);if(i!=null){if(!gl(i)||i<0){let o=r?`options.${n}`:"options.highWaterMark";throw new _l(o,i)}return yl(i)}return kn(e.objectMode)}Wn.exports={getHighWaterMark:El,getDefaultHighWaterMark:kn}});var rt=_((va,vn)=>{"use strict";var{PromisePrototypeThen:Rl,SymbolAsyncIterator:Cn,SymbolIterator:jn}=T(),{ERR_INVALID_ARG_TYPE:Al,ERR_STREAM_NULL_VALUES:ml}=D().codes;function Tl(e,t,n){let r;if(typeof t=="string"||t instanceof __Buffer$)return new e({objectMode:!0,...n,read(){this.push(t),this.push(null)}});let i;if(t&&t[Cn])i=!0,r=t[Cn]();else if(t&&t[jn])i=!1,r=t[jn]();else throw new Al("iterable",["Iterable"],t);let o=new e({objectMode:!0,highWaterMark:1,...n}),l=!1;o._read=function(){l||(l=!0,a())},o._destroy=function(f,c){Rl(s(f),()=>__Process$.nextTick(c,f),u=>__Process$.nextTick(c,u||f))};async function s(f){let c=f!=null,u=typeof r.throw=="function";if(c&&u){let{value:p,done:d}=await r.throw(f);if(await p,d)return}if(typeof r.return=="function"){let{value:p}=await r.return();await p}}async function a(){for(;;){try{let{value:f,done:c}=i?await r.next():r.next();if(c)o.push(null);else{let u=f&&typeof f.then=="function"?await f:f;if(u===null)throw l=!1,new ml;if(o.push(u))continue;l=!1}}catch(f){o.destroy(f)}break}}return o}vn.exports=Tl});var ce=_(($a,Qn)=>{"use strict";var{ArrayPrototypeIndexOf:Il,NumberIsInteger:Nl,NumberIsNaN:Ml,NumberParseInt:Dl,ObjectDefineProperties:Bn,ObjectKeys:xl,ObjectSetPrototypeOf:Un,Promise:Ol,SafeSet:Ll,SymbolAsyncIterator:Pl,Symbol:ql}=T();Qn.exports=w;w.ReadableState=at;var{EventEmitter:kl}=__events$,{Stream:K,prependListener:Wl}=Me(),{addAbortSignal:Cl}=xe(),jl=Y(),y=W().debuglog("stream",e=>{y=e}),vl=qn(),ie=J(),{getHighWaterMark:$l,getDefaultHighWaterMark:Fl}=nt(),{aggregateTwoErrors:$n,codes:{ERR_INVALID_ARG_TYPE:Bl,ERR_METHOD_NOT_IMPLEMENTED:Ul,ERR_OUT_OF_RANGE:Gl,ERR_STREAM_PUSH_AFTER_EOF:Hl,ERR_STREAM_UNSHIFT_AFTER_END_EVENT:Vl}}=D(),{validateObject:Yl}=ue(),Q=ql("kPaused"),{StringDecoder:Gn}=__string_decoder$,Kl=rt();Un(w.prototype,K.prototype);Un(w,K);var it=()=>{},{errorOrDestroy:re}=ie;function at(e,t,n){typeof n!="boolean"&&(n=t instanceof j()),this.objectMode=!!(e&&e.objectMode),n&&(this.objectMode=this.objectMode||!!(e&&e.readableObjectMode)),this.highWaterMark=e?$l(this,e,"readableHighWaterMark",n):Fl(!1),this.buffer=new vl,this.length=0,this.pipes=[],this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.constructed=!0,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this[Q]=null,this.errorEmitted=!1,this.emitClose=!e||e.emitClose!==!1,this.autoDestroy=!e||e.autoDestroy!==!1,this.destroyed=!1,this.errored=null,this.closed=!1,this.closeEmitted=!1,this.defaultEncoding=e&&e.defaultEncoding||"utf8",this.awaitDrainWriters=null,this.multiAwaitDrain=!1,this.readingMore=!1,this.dataEmitted=!1,this.decoder=null,this.encoding=null,e&&e.encoding&&(this.decoder=new Gn(e.encoding),this.encoding=e.encoding)}function w(e){if(!(this instanceof w))return new w(e);let t=this instanceof j();this._readableState=new at(e,this,t),e&&(typeof e.read=="function"&&(this._read=e.read),typeof e.destroy=="function"&&(this._destroy=e.destroy),typeof e.construct=="function"&&(this._construct=e.construct),e.signal&&!t&&Cl(e.signal,this)),K.call(this,e),ie.construct(this,()=>{this._readableState.needReadable&&Le(this,this._readableState)})}w.prototype.destroy=ie.destroy;w.prototype._undestroy=ie.undestroy;w.prototype._destroy=function(e,t){t(e)};w.prototype[kl.captureRejectionSymbol]=function(e){this.destroy(e)};w.prototype.push=function(e,t){return Hn(this,e,t,!1)};w.prototype.unshift=function(e,t){return Hn(this,e,t,!0)};function Hn(e,t,n,r){y("readableAddChunk",t);let i=e._readableState,o;if(i.objectMode||(typeof t=="string"?(n=n||i.defaultEncoding,i.encoding!==n&&(r&&i.encoding?t=__Buffer$.from(t,n).toString(i.encoding):(t=__Buffer$.from(t,n),n=""))):t instanceof __Buffer$?n="":K._isUint8Array(t)?(t=K._uint8ArrayToBuffer(t),n=""):t!=null&&(o=new Bl("chunk",["string","Buffer","Uint8Array"],t))),o)re(e,o);else if(t===null)i.reading=!1,Jl(e,i);else if(i.objectMode||t&&t.length>0)if(r)if(i.endEmitted)re(e,new Vl);else{if(i.destroyed||i.errored)return!1;ot(e,i,t,!0)}else if(i.ended)re(e,new Hl);else{if(i.destroyed||i.errored)return!1;i.reading=!1,i.decoder&&!n?(t=i.decoder.write(t),i.objectMode||t.length!==0?ot(e,i,t,!1):Le(e,i)):ot(e,i,t,!1)}else r||(i.reading=!1,Le(e,i));return!i.ended&&(i.length<i.highWaterMark||i.length===0)}function ot(e,t,n,r){t.flowing&&t.length===0&&!t.sync&&e.listenerCount("data")>0?(t.multiAwaitDrain?t.awaitDrainWriters.clear():t.awaitDrainWriters=null,t.dataEmitted=!0,e.emit("data",n)):(t.length+=t.objectMode?1:n.length,r?t.buffer.unshift(n):t.buffer.push(n),t.needReadable&&Pe(e)),Le(e,t)}w.prototype.isPaused=function(){let e=this._readableState;return e[Q]===!0||e.flowing===!1};w.prototype.setEncoding=function(e){let t=new Gn(e);this._readableState.decoder=t,this._readableState.encoding=this._readableState.decoder.encoding;let n=this._readableState.buffer,r="";for(let i of n)r+=t.write(i);return n.clear(),r!==""&&n.push(r),this._readableState.length=r.length,this};var zl=1073741824;function Xl(e){if(e>zl)throw new Gl("size","<= 1GiB",e);return e--,e|=e>>>1,e|=e>>>2,e|=e>>>4,e|=e>>>8,e|=e>>>16,e++,e}function Fn(e,t){return e<=0||t.length===0&&t.ended?0:t.objectMode?1:Ml(e)?t.flowing&&t.length?t.buffer.first().length:t.length:e<=t.length?e:t.ended?t.length:0}w.prototype.read=function(e){y("read",e),e===void 0?e=NaN:Nl(e)||(e=Dl(e,10));let t=this._readableState,n=e;if(e>t.highWaterMark&&(t.highWaterMark=Xl(e)),e!==0&&(t.emittedReadable=!1),e===0&&t.needReadable&&((t.highWaterMark!==0?t.length>=t.highWaterMark:t.length>0)||t.ended))return y("read: emitReadable",t.length,t.ended),t.length===0&&t.ended?lt(this):Pe(this),null;if(e=Fn(e,t),e===0&&t.ended)return t.length===0&&lt(this),null;let r=t.needReadable;if(y("need readable",r),(t.length===0||t.length-e<t.highWaterMark)&&(r=!0,y("length less than watermark",r)),t.ended||t.reading||t.destroyed||t.errored||!t.constructed)r=!1,y("reading, ended or constructing",r);else if(r){y("do read"),t.reading=!0,t.sync=!0,t.length===0&&(t.needReadable=!0);try{this._read(t.highWaterMark)}catch(o){re(this,o)}t.sync=!1,t.reading||(e=Fn(n,t))}let i;return e>0?i=Xn(e,t):i=null,i===null?(t.needReadable=t.length<=t.highWaterMark,e=0):(t.length-=e,t.multiAwaitDrain?t.awaitDrainWriters.clear():t.awaitDrainWriters=null),t.length===0&&(t.ended||(t.needReadable=!0),n!==e&&t.ended&&lt(this)),i!==null&&!t.errorEmitted&&!t.closeEmitted&&(t.dataEmitted=!0,this.emit("data",i)),i};function Jl(e,t){if(y("onEofChunk"),!t.ended){if(t.decoder){let n=t.decoder.end();n&&n.length&&(t.buffer.push(n),t.length+=t.objectMode?1:n.length)}t.ended=!0,t.sync?Pe(e):(t.needReadable=!1,t.emittedReadable=!0,Vn(e))}}function Pe(e){let t=e._readableState;y("emitReadable",t.needReadable,t.emittedReadable),t.needReadable=!1,t.emittedReadable||(y("emitReadable",t.flowing),t.emittedReadable=!0,__Process$.nextTick(Vn,e))}function Vn(e){let t=e._readableState;y("emitReadable_",t.destroyed,t.length,t.ended),!t.destroyed&&!t.errored&&(t.length||t.ended)&&(e.emit("readable"),t.emittedReadable=!1),t.needReadable=!t.flowing&&!t.ended&&t.length<=t.highWaterMark,Kn(e)}function Le(e,t){!t.readingMore&&t.constructed&&(t.readingMore=!0,__Process$.nextTick(Ql,e,t))}function Ql(e,t){for(;!t.reading&&!t.ended&&(t.length<t.highWaterMark||t.flowing&&t.length===0);){let n=t.length;if(y("maybeReadMore read 0"),e.read(0),n===t.length)break}t.readingMore=!1}w.prototype._read=function(e){throw new Ul("_read()")};w.prototype.pipe=function(e,t){let n=this,r=this._readableState;r.pipes.length===1&&(r.multiAwaitDrain||(r.multiAwaitDrain=!0,r.awaitDrainWriters=new Ll(r.awaitDrainWriters?[r.awaitDrainWriters]:[]))),r.pipes.push(e),y("pipe count=%d opts=%j",r.pipes.length,t);let o=(!t||t.end!==!1)&&e!==__Process$.stdout&&e!==__Process$.stderr?s:g;r.endEmitted?__Process$.nextTick(o):n.once("end",o),e.on("unpipe",l);function l(h,S){y("onunpipe"),h===n&&S&&S.hasUnpiped===!1&&(S.hasUnpiped=!0,c())}function s(){y("onend"),e.end()}let a,f=!1;function c(){y("cleanup"),e.removeListener("close",b),e.removeListener("finish",M),a&&e.removeListener("drain",a),e.removeListener("error",d),e.removeListener("unpipe",l),n.removeListener("end",s),n.removeListener("end",g),n.removeListener("data",p),f=!0,a&&r.awaitDrainWriters&&(!e._writableState||e._writableState.needDrain)&&a()}function u(){f||(r.pipes.length===1&&r.pipes[0]===e?(y("false write response, pause",0),r.awaitDrainWriters=e,r.multiAwaitDrain=!1):r.pipes.length>1&&r.pipes.includes(e)&&(y("false write response, pause",r.awaitDrainWriters.size),r.awaitDrainWriters.add(e)),n.pause()),a||(a=Zl(n,e),e.on("drain",a))}n.on("data",p);function p(h){y("ondata");let S=e.write(h);y("dest.write",S),S===!1&&u()}function d(h){if(y("onerror",h),g(),e.removeListener("error",d),e.listenerCount("error")===0){let S=e._writableState||e._readableState;S&&!S.errorEmitted?re(e,h):e.emit("error",h)}}Wl(e,"error",d);function b(){e.removeListener("finish",M),g()}e.once("close",b);function M(){y("onfinish"),e.removeListener("close",b),g()}e.once("finish",M);function g(){y("unpipe"),n.unpipe(e)}return e.emit("pipe",n),e.writableNeedDrain===!0?r.flowing&&u():r.flowing||(y("pipe resume"),n.resume()),e};function Zl(e,t){return function(){let r=e._readableState;r.awaitDrainWriters===t?(y("pipeOnDrain",1),r.awaitDrainWriters=null):r.multiAwaitDrain&&(y("pipeOnDrain",r.awaitDrainWriters.size),r.awaitDrainWriters.delete(t)),(!r.awaitDrainWriters||r.awaitDrainWriters.size===0)&&e.listenerCount("data")&&e.resume()}}w.prototype.unpipe=function(e){let t=this._readableState,n={hasUnpiped:!1};if(t.pipes.length===0)return this;if(!e){let i=t.pipes;t.pipes=[],this.pause();for(let o=0;o<i.length;o++)i[o].emit("unpipe",this,{hasUnpiped:!1});return this}let r=Il(t.pipes,e);return r===-1?this:(t.pipes.splice(r,1),t.pipes.length===0&&this.pause(),e.emit("unpipe",this,n),this)};w.prototype.on=function(e,t){let n=K.prototype.on.call(this,e,t),r=this._readableState;return e==="data"?(r.readableListening=this.listenerCount("readable")>0,r.flowing!==!1&&this.resume()):e==="readable"&&!r.endEmitted&&!r.readableListening&&(r.readableListening=r.needReadable=!0,r.flowing=!1,r.emittedReadable=!1,y("on readable",r.length,r.reading),r.length?Pe(this):r.reading||__Process$.nextTick(ef,this)),n};w.prototype.addListener=w.prototype.on;w.prototype.removeListener=function(e,t){let n=K.prototype.removeListener.call(this,e,t);return e==="readable"&&__Process$.nextTick(Yn,this),n};w.prototype.off=w.prototype.removeListener;w.prototype.removeAllListeners=function(e){let t=K.prototype.removeAllListeners.apply(this,arguments);return(e==="readable"||e===void 0)&&__Process$.nextTick(Yn,this),t};function Yn(e){let t=e._readableState;t.readableListening=e.listenerCount("readable")>0,t.resumeScheduled&&t[Q]===!1?t.flowing=!0:e.listenerCount("data")>0?e.resume():t.readableListening||(t.flowing=null)}function ef(e){y("readable nexttick read 0"),e.read(0)}w.prototype.resume=function(){let e=this._readableState;return e.flowing||(y("resume"),e.flowing=!e.readableListening,tf(this,e)),e[Q]=!1,this};function tf(e,t){t.resumeScheduled||(t.resumeScheduled=!0,__Process$.nextTick(nf,e,t))}function nf(e,t){y("resume",t.reading),t.reading||e.read(0),t.resumeScheduled=!1,e.emit("resume"),Kn(e),t.flowing&&!t.reading&&e.read(0)}w.prototype.pause=function(){return y("call pause flowing=%j",this._readableState.flowing),this._readableState.flowing!==!1&&(y("pause"),this._readableState.flowing=!1,this.emit("pause")),this._readableState[Q]=!0,this};function Kn(e){let t=e._readableState;for(y("flow",t.flowing);t.flowing&&e.read()!==null;);}w.prototype.wrap=function(e){let t=!1;e.on("data",r=>{!this.push(r)&&e.pause&&(t=!0,e.pause())}),e.on("end",()=>{this.push(null)}),e.on("error",r=>{re(this,r)}),e.on("close",()=>{this.destroy()}),e.on("destroy",()=>{this.destroy()}),this._read=()=>{t&&e.resume&&(t=!1,e.resume())};let n=xl(e);for(let r=1;r<n.length;r++){let i=n[r];this[i]===void 0&&typeof e[i]=="function"&&(this[i]=e[i].bind(e))}return this};w.prototype[Pl]=function(){return zn(this)};w.prototype.iterator=function(e){return e!==void 0&&Yl(e,"options"),zn(this,e)};function zn(e,t){typeof e.read!="function"&&(e=w.wrap(e,{objectMode:!0}));let n=rf(e,t);return n.stream=e,n}async function*rf(e,t){let n=it;function r(l){this===e?(n(),n=it):n=l}e.on("readable",r);let i,o=jl(e,{writable:!1},l=>{i=l?$n(i,l):null,n(),n=it});try{for(;;){let l=e.destroyed?null:e.read();if(l!==null)yield l;else{if(i)throw i;if(i===null)return;await new Ol(r)}}}catch(l){throw i=$n(i,l),i}finally{(i||t?.destroyOnReturn!==!1)&&(i===void 0||e._readableState.autoDestroy)?ie.destroyer(e,null):(e.off("readable",r),o())}}Bn(w.prototype,{readable:{get(){let e=this._readableState;return!!e&&e.readable!==!1&&!e.destroyed&&!e.errorEmitted&&!e.endEmitted},set(e){this._readableState&&(this._readableState.readable=!!e)}},readableDidRead:{enumerable:!1,get:function(){return this._readableState.dataEmitted}},readableAborted:{enumerable:!1,get:function(){return!!(this._readableState.readable!==!1&&(this._readableState.destroyed||this._readableState.errored)&&!this._readableState.endEmitted)}},readableHighWaterMark:{enumerable:!1,get:function(){return this._readableState.highWaterMark}},readableBuffer:{enumerable:!1,get:function(){return this._readableState&&this._readableState.buffer}},readableFlowing:{enumerable:!1,get:function(){return this._readableState.flowing},set:function(e){this._readableState&&(this._readableState.flowing=e)}},readableLength:{enumerable:!1,get(){return this._readableState.length}},readableObjectMode:{enumerable:!1,get(){return this._readableState?this._readableState.objectMode:!1}},readableEncoding:{enumerable:!1,get(){return this._readableState?this._readableState.encoding:null}},errored:{enumerable:!1,get(){return this._readableState?this._readableState.errored:null}},closed:{get(){return this._readableState?this._readableState.closed:!1}},destroyed:{enumerable:!1,get(){return this._readableState?this._readableState.destroyed:!1},set(e){!this._readableState||(this._readableState.destroyed=e)}},readableEnded:{enumerable:!1,get(){return this._readableState?this._readableState.endEmitted:!1}}});Bn(at.prototype,{pipesCount:{get(){return this.pipes.length}},paused:{get(){return this[Q]!==!1},set(e){this[Q]=!!e}}});w._fromList=Xn;function Xn(e,t){if(t.length===0)return null;let n;return t.objectMode?n=t.buffer.shift():!e||e>=t.length?(t.decoder?n=t.buffer.join(""):t.buffer.length===1?n=t.buffer.first():n=t.buffer.concat(t.length),t.buffer.clear()):n=t.buffer.consume(e,t.decoder),n}function lt(e){let t=e._readableState;y("endReadable",t.endEmitted),t.endEmitted||(t.ended=!0,__Process$.nextTick(of,t,e))}function of(e,t){if(y("endReadableNT",e.endEmitted,e.length),!e.errored&&!e.closeEmitted&&!e.endEmitted&&e.length===0){if(e.endEmitted=!0,t.emit("end"),t.writable&&t.allowHalfOpen===!1)__Process$.nextTick(lf,t);else if(e.autoDestroy){let n=t._writableState;(!n||n.autoDestroy&&(n.finished||n.writable===!1))&&t.destroy()}}}function lf(e){e.writable&&!e.writableEnded&&!e.destroyed&&e.end()}w.from=function(e,t){return Kl(w,e,t)};var ft;function Jn(){return ft===void 0&&(ft={}),ft}w.fromWeb=function(e,t){return Jn().newStreamReadableFromReadableStream(e,t)};w.toWeb=function(e){return Jn().newReadableStreamFromStreamReadable(e)};w.wrap=function(e,t){var n,r;return new w({objectMode:(n=(r=e.readableObjectMode)!==null&&r!==void 0?r:e.objectMode)!==null&&n!==void 0?n:!0,...t,destroy(i,o){ie.destroyer(e,i),o(i)}}).wrap(e)}});var pt=_((Fa,ur)=>{"use strict";var{ArrayPrototypeSlice:tr,Error:ff,FunctionPrototypeSymbolHasInstance:nr,ObjectDefineProperty:rr,ObjectDefineProperties:af,ObjectSetPrototypeOf:ir,StringPrototypeToLowerCase:sf,Symbol:uf,SymbolHasInstance:df}=T();ur.exports=E;E.WritableState=pe;var{EventEmitter:cf}=__events$,he=Me().Stream,We=J(),{addAbortSignal:hf}=xe(),{getHighWaterMark:bf,getDefaultHighWaterMark:pf}=nt(),{ERR_INVALID_ARG_TYPE:wf,ERR_METHOD_NOT_IMPLEMENTED:yf,ERR_MULTIPLE_CALLBACK:or,ERR_STREAM_CANNOT_PIPE:gf,ERR_STREAM_DESTROYED:be,ERR_STREAM_ALREADY_FINISHED:_f,ERR_STREAM_NULL_VALUES:Sf,ERR_STREAM_WRITE_AFTER_END:Ef,ERR_UNKNOWN_ENCODING:lr}=D().codes,{errorOrDestroy:oe}=We;ir(E.prototype,he.prototype);ir(E,he);function dt(){}var le=uf("kOnFinished");function pe(e,t,n){typeof n!="boolean"&&(n=t instanceof j()),this.objectMode=!!(e&&e.objectMode),n&&(this.objectMode=this.objectMode||!!(e&&e.writableObjectMode)),this.highWaterMark=e?bf(this,e,"writableHighWaterMark",n):pf(!1),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1;let r=!!(e&&e.decodeStrings===!1);this.decodeStrings=!r,this.defaultEncoding=e&&e.defaultEncoding||"utf8",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=Af.bind(void 0,t),this.writecb=null,this.writelen=0,this.afterWriteTickInfo=null,ke(this),this.pendingcb=0,this.constructed=!0,this.prefinished=!1,this.errorEmitted=!1,this.emitClose=!e||e.emitClose!==!1,this.autoDestroy=!e||e.autoDestroy!==!1,this.errored=null,this.closed=!1,this.closeEmitted=!1,this[le]=[]}function ke(e){e.buffered=[],e.bufferedIndex=0,e.allBuffers=!0,e.allNoop=!0}pe.prototype.getBuffer=function(){return tr(this.buffered,this.bufferedIndex)};rr(pe.prototype,"bufferedRequestCount",{get(){return this.buffered.length-this.bufferedIndex}});function E(e){let t=this instanceof j();if(!t&&!nr(E,this))return new E(e);this._writableState=new pe(e,this,t),e&&(typeof e.write=="function"&&(this._write=e.write),typeof e.writev=="function"&&(this._writev=e.writev),typeof e.destroy=="function"&&(this._destroy=e.destroy),typeof e.final=="function"&&(this._final=e.final),typeof e.construct=="function"&&(this._construct=e.construct),e.signal&&hf(e.signal,this)),he.call(this,e),We.construct(this,()=>{let n=this._writableState;n.writing||ht(this,n),bt(this,n)})}rr(E,df,{value:function(e){return nr(this,e)?!0:this!==E?!1:e&&e._writableState instanceof pe}});E.prototype.pipe=function(){oe(this,new gf)};function fr(e,t,n,r){let i=e._writableState;if(typeof n=="function")r=n,n=i.defaultEncoding;else{if(!n)n=i.defaultEncoding;else if(n!=="buffer"&&!__Buffer$.isEncoding(n))throw new lr(n);typeof r!="function"&&(r=dt)}if(t===null)throw new Sf;if(!i.objectMode)if(typeof t=="string")i.decodeStrings!==!1&&(t=__Buffer$.from(t,n),n="buffer");else if(t instanceof __Buffer$)n="buffer";else if(he._isUint8Array(t))t=he._uint8ArrayToBuffer(t),n="buffer";else throw new wf("chunk",["string","Buffer","Uint8Array"],t);let o;return i.ending?o=new Ef:i.destroyed&&(o=new be("write")),o?(__Process$.nextTick(r,o),oe(e,o,!0),o):(i.pendingcb++,Rf(e,i,t,n,r))}E.prototype.write=function(e,t,n){return fr(this,e,t,n)===!0};E.prototype.cork=function(){this._writableState.corked++};E.prototype.uncork=function(){let e=this._writableState;e.corked&&(e.corked--,e.writing||ht(this,e))};E.prototype.setDefaultEncoding=function(t){if(typeof t=="string"&&(t=sf(t)),!__Buffer$.isEncoding(t))throw new lr(t);return this._writableState.defaultEncoding=t,this};function Rf(e,t,n,r,i){let o=t.objectMode?1:n.length;t.length+=o;let l=t.length<t.highWaterMark;return l||(t.needDrain=!0),t.writing||t.corked||t.errored||!t.constructed?(t.buffered.push({chunk:n,encoding:r,callback:i}),t.allBuffers&&r!=="buffer"&&(t.allBuffers=!1),t.allNoop&&i!==dt&&(t.allNoop=!1)):(t.writelen=o,t.writecb=i,t.writing=!0,t.sync=!0,e._write(n,r,t.onwrite),t.sync=!1),l&&!t.errored&&!t.destroyed}function Zn(e,t,n,r,i,o,l){t.writelen=r,t.writecb=l,t.writing=!0,t.sync=!0,t.destroyed?t.onwrite(new be("write")):n?e._writev(i,t.onwrite):e._write(i,o,t.onwrite),t.sync=!1}function er(e,t,n,r){--t.pendingcb,r(n),ct(t),oe(e,n)}function Af(e,t){let n=e._writableState,r=n.sync,i=n.writecb;if(typeof i!="function"){oe(e,new or);return}n.writing=!1,n.writecb=null,n.length-=n.writelen,n.writelen=0,t?(t.stack,n.errored||(n.errored=t),e._readableState&&!e._readableState.errored&&(e._readableState.errored=t),r?__Process$.nextTick(er,e,n,t,i):er(e,n,t,i)):(n.buffered.length>n.bufferedIndex&&ht(e,n),r?n.afterWriteTickInfo!==null&&n.afterWriteTickInfo.cb===i?n.afterWriteTickInfo.count++:(n.afterWriteTickInfo={count:1,cb:i,stream:e,state:n},__Process$.nextTick(mf,n.afterWriteTickInfo)):ar(e,n,1,i))}function mf({stream:e,state:t,count:n,cb:r}){return t.afterWriteTickInfo=null,ar(e,t,n,r)}function ar(e,t,n,r){for(!t.ending&&!e.destroyed&&t.length===0&&t.needDrain&&(t.needDrain=!1,e.emit("drain"));n-- >0;)t.pendingcb--,r();t.destroyed&&ct(t),bt(e,t)}function ct(e){if(e.writing)return;for(let i=e.bufferedIndex;i<e.buffered.length;++i){var t;let{chunk:o,callback:l}=e.buffered[i],s=e.objectMode?1:o.length;e.length-=s,l((t=e.errored)!==null&&t!==void 0?t:new be("write"))}let n=e[le].splice(0);for(let i=0;i<n.length;i++){var r;n[i]((r=e.errored)!==null&&r!==void 0?r:new be("end"))}ke(e)}function ht(e,t){if(t.corked||t.bufferProcessing||t.destroyed||!t.constructed)return;let{buffered:n,bufferedIndex:r,objectMode:i}=t,o=n.length-r;if(!o)return;let l=r;if(t.bufferProcessing=!0,o>1&&e._writev){t.pendingcb-=o-1;let s=t.allNoop?dt:f=>{for(let c=l;c<n.length;++c)n[c].callback(f)},a=t.allNoop&&l===0?n:tr(n,l);a.allBuffers=t.allBuffers,Zn(e,t,!0,t.length,a,"",s),ke(t)}else{do{let{chunk:s,encoding:a,callback:f}=n[l];n[l++]=null;let c=i?1:s.length;Zn(e,t,!1,c,s,a,f)}while(l<n.length&&!t.writing);l===n.length?ke(t):l>256?(n.splice(0,l),t.bufferedIndex=0):t.bufferedIndex=l}t.bufferProcessing=!1}E.prototype._write=function(e,t,n){if(this._writev)this._writev([{chunk:e,encoding:t}],n);else throw new yf("_write()")};E.prototype._writev=null;E.prototype.end=function(e,t,n){let r=this._writableState;typeof e=="function"?(n=e,e=null,t=null):typeof t=="function"&&(n=t,t=null);let i;if(e!=null){let o=fr(this,e,t);o instanceof ff&&(i=o)}return r.corked&&(r.corked=1,this.uncork()),i||(!r.errored&&!r.ending?(r.ending=!0,bt(this,r,!0),r.ended=!0):r.finished?i=new _f("end"):r.destroyed&&(i=new be("end"))),typeof n=="function"&&(i||r.finished?__Process$.nextTick(n,i):r[le].push(n)),this};function qe(e){return e.ending&&!e.destroyed&&e.constructed&&e.length===0&&!e.errored&&e.buffered.length===0&&!e.finished&&!e.writing&&!e.errorEmitted&&!e.closeEmitted}function Tf(e,t){let n=!1;function r(i){if(n){oe(e,i??or());return}if(n=!0,t.pendingcb--,i){let o=t[le].splice(0);for(let l=0;l<o.length;l++)o[l](i);oe(e,i,t.sync)}else qe(t)&&(t.prefinished=!0,e.emit("prefinish"),t.pendingcb++,__Process$.nextTick(ut,e,t))}t.sync=!0,t.pendingcb++;try{e._final(r)}catch(i){r(i)}t.sync=!1}function If(e,t){!t.prefinished&&!t.finalCalled&&(typeof e._final=="function"&&!t.destroyed?(t.finalCalled=!0,Tf(e,t)):(t.prefinished=!0,e.emit("prefinish")))}function bt(e,t,n){qe(t)&&(If(e,t),t.pendingcb===0&&(n?(t.pendingcb++,__Process$.nextTick((r,i)=>{qe(i)?ut(r,i):i.pendingcb--},e,t)):qe(t)&&(t.pendingcb++,ut(e,t))))}function ut(e,t){t.pendingcb--,t.finished=!0;let n=t[le].splice(0);for(let r=0;r<n.length;r++)n[r]();if(e.emit("finish"),t.autoDestroy){let r=e._readableState;(!r||r.autoDestroy&&(r.endEmitted||r.readable===!1))&&e.destroy()}}af(E.prototype,{closed:{get(){return this._writableState?this._writableState.closed:!1}},destroyed:{get(){return this._writableState?this._writableState.destroyed:!1},set(e){this._writableState&&(this._writableState.destroyed=e)}},writable:{get(){let e=this._writableState;return!!e&&e.writable!==!1&&!e.destroyed&&!e.errored&&!e.ending&&!e.ended},set(e){this._writableState&&(this._writableState.writable=!!e)}},writableFinished:{get(){return this._writableState?this._writableState.finished:!1}},writableObjectMode:{get(){return this._writableState?this._writableState.objectMode:!1}},writableBuffer:{get(){return this._writableState&&this._writableState.getBuffer()}},writableEnded:{get(){return this._writableState?this._writableState.ending:!1}},writableNeedDrain:{get(){let e=this._writableState;return e?!e.destroyed&&!e.ending&&e.needDrain:!1}},writableHighWaterMark:{get(){return this._writableState&&this._writableState.highWaterMark}},writableCorked:{get(){return this._writableState?this._writableState.corked:0}},writableLength:{get(){return this._writableState&&this._writableState.length}},errored:{enumerable:!1,get(){return this._writableState?this._writableState.errored:null}},writableAborted:{enumerable:!1,get:function(){return!!(this._writableState.writable!==!1&&(this._writableState.destroyed||this._writableState.errored)&&!this._writableState.finished)}}});var Nf=We.destroy;E.prototype.destroy=function(e,t){let n=this._writableState;return!n.destroyed&&(n.bufferedIndex<n.buffered.length||n[le].length)&&__Process$.nextTick(ct,n),Nf.call(this,e,t),this};E.prototype._undestroy=We.undestroy;E.prototype._destroy=function(e,t){t(e)};E.prototype[cf.captureRejectionSymbol]=function(e){this.destroy(e)};var st;function sr(){return st===void 0&&(st={}),st}E.fromWeb=function(e,t){return sr().newStreamWritableFromWritableStream(e,t)};E.toWeb=function(e){return sr().newWritableStreamFromStreamWritable(e)}});var Rr=_((Ba,Er)=>{"use strict";var Mf=__buffer$,{isReadable:Df,isWritable:xf,isIterable:dr,isNodeStream:Of,isReadableNodeStream:cr,isWritableNodeStream:hr,isDuplexNodeStream:Lf}=V(),br=Y(),{AbortError:Sr,codes:{ERR_INVALID_ARG_TYPE:Pf,ERR_INVALID_RETURN_VALUE:pr}}=D(),{destroyer:fe}=J(),qf=j(),kf=ce(),{createDeferredPromise:wr}=W(),yr=rt(),gr=globalThis.Blob||Mf.Blob,Wf=typeof gr<"u"?function(t){return t instanceof gr}:function(t){return!1},Cf=globalThis.AbortController,{FunctionPrototypeCall:_r}=T(),Z=class extends qf{constructor(t){super(t),t?.readable===!1&&(this._readableState.readable=!1,this._readableState.ended=!0,this._readableState.endEmitted=!0),t?.writable===!1&&(this._writableState.writable=!1,this._writableState.ending=!0,this._writableState.ended=!0,this._writableState.finished=!0)}};Er.exports=function e(t,n){if(Lf(t))return t;if(cr(t))return Ce({readable:t});if(hr(t))return Ce({writable:t});if(Of(t))return Ce({writable:!1,readable:!1});if(typeof t=="function"){let{value:i,write:o,final:l,destroy:s}=jf(t);if(dr(i))return yr(Z,i,{objectMode:!0,write:o,final:l,destroy:s});let a=i?.then;if(typeof a=="function"){let f,c=_r(a,i,u=>{if(u!=null)throw new pr("nully","body",u)},u=>{fe(f,u)});return f=new Z({objectMode:!0,readable:!1,write:o,final(u){l(async()=>{try{await c,__Process$.nextTick(u,null)}catch(p){__Process$.nextTick(u,p)}})},destroy:s})}throw new pr("Iterable, AsyncIterable or AsyncFunction",n,i)}if(Wf(t))return e(t.arrayBuffer());if(dr(t))return yr(Z,t,{objectMode:!0,writable:!1});if(typeof t?.writable=="object"||typeof t?.readable=="object"){let i=t!=null&&t.readable?cr(t?.readable)?t?.readable:e(t.readable):void 0,o=t!=null&&t.writable?hr(t?.writable)?t?.writable:e(t.writable):void 0;return Ce({readable:i,writable:o})}let r=t?.then;if(typeof r=="function"){let i;return _r(r,t,o=>{o!=null&&i.push(o),i.push(null)},o=>{fe(i,o)}),i=new Z({objectMode:!0,writable:!1,read(){}})}throw new Pf(n,["Blob","ReadableStream","WritableStream","Stream","Iterable","AsyncIterable","Function","{ readable, writable } pair","Promise"],t)};function jf(e){let{promise:t,resolve:n}=wr(),r=new Cf,i=r.signal;return{value:e(async function*(){for(;;){let l=t;t=null;let{chunk:s,done:a,cb:f}=await l;if(__Process$.nextTick(f),a)return;if(i.aborted)throw new Sr(void 0,{cause:i.reason});({promise:t,resolve:n}=wr()),yield s}}(),{signal:i}),write(l,s,a){let f=n;n=null,f({chunk:l,done:!1,cb:a})},final(l){let s=n;n=null,s({done:!0,cb:l})},destroy(l,s){r.abort(),s(l)}}}function Ce(e){let t=e.readable&&typeof e.readable.read!="function"?kf.wrap(e.readable):e.readable,n=e.writable,r=!!Df(t),i=!!xf(n),o,l,s,a,f;function c(u){let p=a;a=null,p?p(u):u?f.destroy(u):!r&&!i&&f.destroy()}return f=new Z({readableObjectMode:!!(t!=null&&t.readableObjectMode),writableObjectMode:!!(n!=null&&n.writableObjectMode),readable:r,writable:i}),i&&(br(n,u=>{i=!1,u&&fe(t,u),c(u)}),f._write=function(u,p,d){n.write(u,p)?d():o=d},f._final=function(u){n.end(),l=u},n.on("drain",function(){if(o){let u=o;o=null,u()}}),n.on("finish",function(){if(l){let u=l;l=null,u()}})),r&&(br(t,u=>{r=!1,u&&fe(t,u),c(u)}),t.on("readable",function(){if(s){let u=s;s=null,u()}}),t.on("end",function(){f.push(null)}),f._read=function(){for(;;){let u=t.read();if(u===null){s=f._read;return}if(!f.push(u))return}}),f._destroy=function(u,p){!u&&a!==null&&(u=new Sr),s=null,o=null,l=null,a===null?p(u):(a=p,fe(n,u),fe(t,u))},f}});var j=_((Ua,Tr)=>{"use strict";var{ObjectDefineProperties:vf,ObjectGetOwnPropertyDescriptor:F,ObjectKeys:$f,ObjectSetPrototypeOf:Ar}=T();Tr.exports=k;var gt=ce(),P=pt();Ar(k.prototype,gt.prototype);Ar(k,gt);{let e=$f(P.prototype);for(let t=0;t<e.length;t++){let n=e[t];k.prototype[n]||(k.prototype[n]=P.prototype[n])}}function k(e){if(!(this instanceof k))return new k(e);gt.call(this,e),P.call(this,e),e?(this.allowHalfOpen=e.allowHalfOpen!==!1,e.readable===!1&&(this._readableState.readable=!1,this._readableState.ended=!0,this._readableState.endEmitted=!0),e.writable===!1&&(this._writableState.writable=!1,this._writableState.ending=!0,this._writableState.ended=!0,this._writableState.finished=!0)):this.allowHalfOpen=!0}vf(k.prototype,{writable:F(P.prototype,"writable"),writableHighWaterMark:F(P.prototype,"writableHighWaterMark"),writableObjectMode:F(P.prototype,"writableObjectMode"),writableBuffer:F(P.prototype,"writableBuffer"),writableLength:F(P.prototype,"writableLength"),writableFinished:F(P.prototype,"writableFinished"),writableCorked:F(P.prototype,"writableCorked"),writableEnded:F(P.prototype,"writableEnded"),writableNeedDrain:F(P.prototype,"writableNeedDrain"),destroyed:{get(){return this._readableState===void 0||this._writableState===void 0?!1:this._readableState.destroyed&&this._writableState.destroyed},set(e){this._readableState&&this._writableState&&(this._readableState.destroyed=e,this._writableState.destroyed=e)}}});var wt;function mr(){return wt===void 0&&(wt={}),wt}k.fromWeb=function(e,t){return mr().newStreamDuplexFromReadableWritablePair(e,t)};k.toWeb=function(e){return mr().newReadableWritablePairFromDuplex(e)};var yt;k.from=function(e){return yt||(yt=Rr()),yt(e,"body")}});var Et=_((Ga,Nr)=>{"use strict";var{ObjectSetPrototypeOf:Ir,Symbol:Ff}=T();Nr.exports=B;var{ERR_METHOD_NOT_IMPLEMENTED:Bf}=D().codes,St=j();Ir(B.prototype,St.prototype);Ir(B,St);var we=Ff("kCallback");function B(e){if(!(this instanceof B))return new B(e);St.call(this,e),this._readableState.sync=!1,this[we]=null,e&&(typeof e.transform=="function"&&(this._transform=e.transform),typeof e.flush=="function"&&(this._flush=e.flush)),this.on("prefinish",Uf)}function _t(e){typeof this._flush=="function"&&!this.destroyed?this._flush((t,n)=>{if(t){e?e(t):this.destroy(t);return}n!=null&&this.push(n),this.push(null),e&&e()}):(this.push(null),e&&e())}function Uf(){this._final!==_t&&_t.call(this)}B.prototype._final=_t;B.prototype._transform=function(e,t,n){throw new Bf("_transform()")};B.prototype._write=function(e,t,n){let r=this._readableState,i=this._writableState,o=r.length;this._transform(e,t,(l,s)=>{if(l){n(l);return}s!=null&&this.push(s),i.ended||o===r.length||r.length<r.highWaterMark||r.highWaterMark===0||r.length===0?n():this[we]=n})};B.prototype._read=function(){if(this[we]){let e=this[we];this[we]=null,e()}}});var At=_((Ha,Dr)=>{"use strict";var{ObjectSetPrototypeOf:Mr}=T();Dr.exports=ae;var Rt=Et();Mr(ae.prototype,Rt.prototype);Mr(ae,Rt);function ae(e){if(!(this instanceof ae))return new ae(e);Rt.call(this,e)}ae.prototype._transform=function(e,t,n){n(null,e)}});var ve=_((Va,Wr)=>{"use strict";var{ArrayIsArray:Gf,Promise:Hf,SymbolAsyncIterator:Vf}=T(),je=Y(),{once:Yf}=W(),Kf=J(),xr=j(),{aggregateTwoErrors:zf,codes:{ERR_INVALID_ARG_TYPE:qr,ERR_INVALID_RETURN_VALUE:mt,ERR_MISSING_ARGS:Xf,ERR_STREAM_DESTROYED:Jf},AbortError:Qf}=D(),{validateFunction:Zf,validateAbortSignal:ea}=ue(),{isIterable:se,isReadable:Tt,isReadableNodeStream:Mt,isNodeStream:Or}=V(),ta=globalThis.AbortController,It,Nt;function Lr(e,t,n){let r=!1;e.on("close",()=>{r=!0});let i=je(e,{readable:t,writable:n},o=>{r=!o});return{destroy:o=>{r||(r=!0,Kf.destroyer(e,o||new Jf("pipe")))},cleanup:i}}function na(e){return Zf(e[e.length-1],"streams[stream.length - 1]"),e.pop()}function ra(e){if(se(e))return e;if(Mt(e))return ia(e);throw new qr("val",["Readable","Iterable","AsyncIterable"],e)}async function*ia(e){Nt||(Nt=ce()),yield*Nt.prototype[Vf].call(e)}async function Pr(e,t,n,{end:r}){let i,o=null,l=f=>{if(f&&(i=f),o){let c=o;o=null,c()}},s=()=>new Hf((f,c)=>{i?c(i):o=()=>{i?c(i):f()}});t.on("drain",l);let a=je(t,{readable:!1},l);try{t.writableNeedDrain&&await s();for await(let f of e)t.write(f)||await s();r&&t.end(),await s(),n()}catch(f){n(i!==f?zf(i,f):f)}finally{a(),t.off("drain",l)}}function oa(...e){return kr(e,Yf(na(e)))}function kr(e,t,n){if(e.length===1&&Gf(e[0])&&(e=e[0]),e.length<2)throw new Xf("streams");let r=new ta,i=r.signal,o=n?.signal,l=[];ea(o,"options.signal");function s(){d(new Qf)}o?.addEventListener("abort",s);let a,f,c=[],u=0;function p(g){d(g,--u===0)}function d(g,h){if(g&&(!a||a.code==="ERR_STREAM_PREMATURE_CLOSE")&&(a=g),!(!a&&!h)){for(;c.length;)c.shift()(a);o?.removeEventListener("abort",s),r.abort(),h&&(a||l.forEach(S=>S()),__Process$.nextTick(t,a,f))}}let b;for(let g=0;g<e.length;g++){let h=e[g],S=g<e.length-1,x=g>0,R=S||n?.end!==!1,G=g===e.length-1;if(Or(h)){let L=function(v){v&&v.name!=="AbortError"&&v.code!=="ERR_STREAM_PREMATURE_CLOSE"&&p(v)};if(R){let{destroy:v,cleanup:Fe}=Lr(h,S,x);c.push(v),Tt(h)&&G&&l.push(Fe)}h.on("error",L),Tt(h)&&G&&l.push(()=>{h.removeListener("error",L)})}if(g===0)if(typeof h=="function"){if(b=h({signal:i}),!se(b))throw new mt("Iterable, AsyncIterable or Stream","source",b)}else se(h)||Mt(h)?b=h:b=xr.from(h);else if(typeof h=="function")if(b=ra(b),b=h(b,{signal:i}),S){if(!se(b,!0))throw new mt("AsyncIterable",`transform[${g-1}]`,b)}else{var M;It||(It=At());let L=new It({objectMode:!0}),v=(M=b)===null||M===void 0?void 0:M.then;if(typeof v=="function")u++,v.call(b,ee=>{f=ee,ee!=null&&L.write(ee),R&&L.end(),__Process$.nextTick(p)},ee=>{L.destroy(ee),__Process$.nextTick(p,ee)});else if(se(b,!0))u++,Pr(b,L,p,{end:R});else throw new mt("AsyncIterable or Promise","destination",b);b=L;let{destroy:Fe,cleanup:ni}=Lr(b,!1,!0);c.push(Fe),G&&l.push(ni)}else if(Or(h)){if(Mt(b)){u+=2;let L=la(b,h,p,{end:R});Tt(h)&&G&&l.push(L)}else if(se(b))u++,Pr(b,h,p,{end:R});else throw new qr("val",["Readable","Iterable","AsyncIterable"],b);b=h}else b=xr.from(h)}return(i!=null&&i.aborted||o!=null&&o.aborted)&&__Process$.nextTick(s),b}function la(e,t,n,{end:r}){return e.pipe(t,{end:r}),r?e.once("end",()=>t.end()):n(),je(e,{readable:!0,writable:!1},i=>{let o=e._readableState;i&&i.code==="ERR_STREAM_PREMATURE_CLOSE"&&o&&o.ended&&!o.errored&&!o.errorEmitted?e.once("end",n).once("error",n):n(i)}),je(t,{readable:!1,writable:!0},n)}Wr.exports={pipelineImpl:kr,pipeline:oa}});var Fr=_((Ya,$r)=>{"use strict";var{pipeline:fa}=ve(),$e=j(),{destroyer:aa}=J(),{isNodeStream:sa,isReadable:Cr,isWritable:jr}=V(),{AbortError:ua,codes:{ERR_INVALID_ARG_VALUE:vr,ERR_MISSING_ARGS:da}}=D();$r.exports=function(...t){if(t.length===0)throw new da("streams");if(t.length===1)return $e.from(t[0]);let n=[...t];if(typeof t[0]=="function"&&(t[0]=$e.from(t[0])),typeof t[t.length-1]=="function"){let d=t.length-1;t[d]=$e.from(t[d])}for(let d=0;d<t.length;++d)if(!!sa(t[d])){if(d<t.length-1&&!Cr(t[d]))throw new vr(`streams[${d}]`,n[d],"must be readable");if(d>0&&!jr(t[d]))throw new vr(`streams[${d}]`,n[d],"must be writable")}let r,i,o,l,s;function a(d){let b=l;l=null,b?b(d):d?s.destroy(d):!p&&!u&&s.destroy()}let f=t[0],c=fa(t,a),u=!!jr(f),p=!!Cr(c);return s=new $e({writableObjectMode:!!(f!=null&&f.writableObjectMode),readableObjectMode:!!(c!=null&&c.writableObjectMode),writable:u,readable:p}),u&&(s._write=function(d,b,M){f.write(d,b)?M():r=M},s._final=function(d){f.end(),i=d},f.on("drain",function(){if(r){let d=r;r=null,d()}}),c.on("finish",function(){if(i){let d=i;i=null,d()}})),p&&(c.on("readable",function(){if(o){let d=o;o=null,d()}}),c.on("end",function(){s.push(null)}),s._read=function(){for(;;){let d=c.read();if(d===null){o=s._read;return}if(!s.push(d))return}}),s._destroy=function(d,b){!d&&l!==null&&(d=new ua),o=null,r=null,i=null,l===null?b(d):(l=b,aa(c,d))},s}});var Dt=_((Ka,Br)=>{"use strict";var{ArrayPrototypePop:ca,Promise:ha}=T(),{isIterable:ba,isNodeStream:pa}=V(),{pipelineImpl:wa}=ve(),{finished:ya}=Y();function ga(...e){return new ha((t,n)=>{let r,i,o=e[e.length-1];if(o&&typeof o=="object"&&!pa(o)&&!ba(o)){let l=ca(e);r=l.signal,i=l.end}wa(e,(l,s)=>{l?n(l):t(s)},{signal:r,end:i})})}Br.exports={finished:ya,pipeline:ga}});var Qr=_((za,Jr)=>{"use strict";var{ObjectDefineProperty:U,ObjectKeys:Hr,ReflectApply:Vr}=T(),{promisify:{custom:Yr}}=W(),{streamReturningOperators:Ur,promiseReturningOperators:Gr}=Sn(),{codes:{ERR_ILLEGAL_CONSTRUCTOR:Kr}}=D(),_a=Fr(),{pipeline:zr}=ve(),{destroyer:Sa}=J(),Xr=Y(),xt=Dt(),Ot=V(),A=Jr.exports=Me().Stream;A.isDisturbed=Ot.isDisturbed;A.isErrored=Ot.isErrored;A.isReadable=Ot.isReadable;A.Readable=ce();for(let e of Hr(Ur)){let n=function(...r){if(new.target)throw Kr();return A.Readable.from(Vr(t,this,r))},t=Ur[e];U(n,"name",{value:t.name}),U(n,"length",{value:t.length}),U(A.Readable.prototype,e,{value:n,enumerable:!1,configurable:!0,writable:!0})}for(let e of Hr(Gr)){let n=function(...r){if(new.target)throw Kr();return Vr(t,this,r)},t=Gr[e];U(n,"name",{value:t.name}),U(n,"length",{value:t.length}),U(A.Readable.prototype,e,{value:n,enumerable:!1,configurable:!0,writable:!0})}A.Writable=pt();A.Duplex=j();A.Transform=Et();A.PassThrough=At();A.pipeline=zr;var{addAbortSignal:Ea}=xe();A.addAbortSignal=Ea;A.finished=Xr;A.destroy=Sa;A.compose=_a;U(A,"promises",{configurable:!0,enumerable:!0,get(){return xt}});U(zr,Yr,{enumerable:!0,get(){return xt.pipeline}});U(Xr,Yr,{enumerable:!0,get(){return xt.finished}});A.Stream=A;A._isUint8Array=function(t){return t instanceof Uint8Array};A._uint8ArrayToBuffer=function(t){return __Buffer$.from(t.buffer,t.byteOffset,t.byteLength)}});var Zr=_((Xa,m)=>{"use strict";var I=Qr(),Ra=Dt(),Aa=I.Readable.destroy;m.exports=I.Readable;m.exports._uint8ArrayToBuffer=I._uint8ArrayToBuffer;m.exports._isUint8Array=I._isUint8Array;m.exports.isDisturbed=I.isDisturbed;m.exports.isErrored=I.isErrored;m.exports.isReadable=I.isReadable;m.exports.Readable=I.Readable;m.exports.Writable=I.Writable;m.exports.Duplex=I.Duplex;m.exports.Transform=I.Transform;m.exports.PassThrough=I.PassThrough;m.exports.addAbortSignal=I.addAbortSignal;m.exports.finished=I.finished;m.exports.destroy=I.destroy;m.exports.destroy=Aa;m.exports.pipeline=I.pipeline;m.exports.compose=I.compose;Object.defineProperty(I,"promises",{configurable:!0,enumerable:!0,get(){return Ra}});m.exports.Stream=I.Stream;m.exports.default=m.exports});var ti=si(Zr()),Ja=!0,{_uint8ArrayToBuffer:Qa,_isUint8Array:Za,isDisturbed:es,isErrored:ts,isReadable:ns,Readable:rs,Writable:is,Duplex:os,Transform:ls,PassThrough:fs,addAbortSignal:as,finished:ss,destroy:us,pipeline:ds,compose:cs,Stream:hs}=ti,{default:ei,...ma}=ti,bs=ei!==void 0?ei:ma;export{os as Duplex,fs as PassThrough,rs as Readable,hs as Stream,ls as Transform,is as Writable,Ja as __esModule,Za as _isUint8Array,Qa as _uint8ArrayToBuffer,as as addAbortSignal,cs as compose,bs as default,us as destroy,ss as finished,es as isDisturbed,ts as isErrored,ns as isReadable,ds as pipeline};
/* End esm.sh bundle */

// The following code implements Readable.fromWeb(), Writable.fromWeb(), and
// Duplex.fromWeb(). These functions are not properly implemented in the
// readable-stream module yet. This can be removed once the following upstream
// issue is resolved: https://github.com/nodejs/readable-stream/issues/482

import {
  AbortError,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_STREAM_PREMATURE_CLOSE,
} from "./internal/errors.ts";
import { destroy } from "./internal/streams/destroy.mjs";
import finished from "./internal/streams/end-of-stream.mjs";
import {
  isDestroyed,
  isReadable,
  isReadableEnded,
  isWritable,
  isWritableEnded,
} from "./internal/streams/utils.mjs";
import { createDeferredPromise, kEmptyObject } from "./internal/util.mjs";
import { validateBoolean, validateObject } from "./internal/validators.mjs";

const process = __Process$;
const Buffer = __Buffer$;
const Readable = rs;
const Writable = is;
const Duplex = os;

function isReadableStream(object) {
  return object instanceof ReadableStream;
}

function isWritableStream(object) {
  return object instanceof WritableStream;
}

Readable.fromWeb = function (
  readableStream,
  options = kEmptyObject,
) {
  if (!isReadableStream(readableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "readableStream",
      "ReadableStream",
      readableStream,
    );
  }

  validateObject(options, "options");
  const {
    highWaterMark,
    encoding,
    objectMode = false,
    signal,
  } = options;

  if (encoding !== undefined && !Buffer.isEncoding(encoding)) {
    throw new ERR_INVALID_ARG_VALUE(encoding, "options.encoding");
  }
  validateBoolean(objectMode, "options.objectMode");

  const reader = readableStream.getReader();
  let closed = false;

  const readable = new Readable({
    objectMode,
    highWaterMark,
    encoding,
    signal,

    read() {
      reader.read().then(
        (chunk) => {
          if (chunk.done) {
            readable.push(null);
          } else {
            readable.push(chunk.value);
          }
        },
        (error) => destroy.call(readable, error),
      );
    },

    destroy(error, callback) {
      function done() {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error;
          });
        }
      }

      if (!closed) {
        reader.cancel(error).then(done, done);
        return;
      }

      done();
    },
  });

  reader.closed.then(
    () => {
      closed = true;
      if (!isReadableEnded(readable)) {
        readable.push(null);
      }
    },
    (error) => {
      closed = true;
      destroy.call(readable, error);
    },
  );

  return readable;
};

Writable.fromWeb = function (
  writableStream,
  options = kEmptyObject,
) {
  if (!isWritableStream(writableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "writableStream",
      "WritableStream",
      writableStream,
    );
  }

  validateObject(options, "options");
  const {
    highWaterMark,
    decodeStrings = true,
    objectMode = false,
    signal,
  } = options;

  validateBoolean(objectMode, "options.objectMode");
  validateBoolean(decodeStrings, "options.decodeStrings");

  const writer = writableStream.getWriter();
  let closed = false;

  const writable = new Writable({
    highWaterMark,
    objectMode,
    decodeStrings,
    signal,

    writev(chunks, callback) {
      function done(error) {
        error = error.filter((e) => e);
        try {
          callback(error.length === 0 ? undefined : error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy.call(writable, error));
        }
      }

      writer.ready.then(
        () =>
          Promise.all(
            chunks.map((data) => writer.write(data.chunk)),
          ).then(done, done),
        done,
      );
    },

    write(chunk, encoding, callback) {
      if (typeof chunk === "string" && decodeStrings && !objectMode) {
        chunk = Buffer.from(chunk, encoding);
        chunk = new Uint8Array(
          chunk.buffer,
          chunk.byteOffset,
          chunk.byteLength,
        );
      }

      function done(error) {
        try {
          callback(error);
        } catch (error) {
          destroy(this, duplex, error);
        }
      }

      writer.ready.then(
        () => writer.write(chunk).then(done, done),
        done,
      );
    },

    destroy(error, callback) {
      function done() {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error;
          });
        }
      }

      if (!closed) {
        if (error != null) {
          writer.abort(error).then(done, done);
        } else {
          writer.close().then(done, done);
        }
        return;
      }

      done();
    },

    final(callback) {
      function done(error) {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy.call(writable, error));
        }
      }

      if (!closed) {
        writer.close().then(done, done);
      }
    },
  });

  writer.closed.then(
    () => {
      closed = true;
      if (!isWritableEnded(writable)) {
        destroy.call(writable, new ERR_STREAM_PREMATURE_CLOSE());
      }
    },
    (error) => {
      closed = true;
      destroy.call(writable, error);
    },
  );

  return writable;
};

Duplex.fromWeb = function (pair, options = kEmptyObject) {
  validateObject(pair, "pair");
  const {
    readable: readableStream,
    writable: writableStream,
  } = pair;

  if (!isReadableStream(readableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "pair.readable",
      "ReadableStream",
      readableStream,
    );
  }
  if (!isWritableStream(writableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "pair.writable",
      "WritableStream",
      writableStream,
    );
  }

  validateObject(options, "options");
  const {
    allowHalfOpen = false,
    objectMode = false,
    encoding,
    decodeStrings = true,
    highWaterMark,
    signal,
  } = options;

  validateBoolean(objectMode, "options.objectMode");
  if (encoding !== undefined && !Buffer.isEncoding(encoding)) {
    throw new ERR_INVALID_ARG_VALUE(encoding, "options.encoding");
  }

  const writer = writableStream.getWriter();
  const reader = readableStream.getReader();
  let writableClosed = false;
  let readableClosed = false;

  const duplex = new Duplex({
    allowHalfOpen,
    highWaterMark,
    objectMode,
    encoding,
    decodeStrings,
    signal,

    writev(chunks, callback) {
      function done(error) {
        error = error.filter((e) => e);
        try {
          callback(error.length === 0 ? undefined : error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy(duplex, error));
        }
      }

      writer.ready.then(
        () =>
          Promise.all(
            chunks.map((data) => writer.write(data.chunk)),
          ).then(done, done),
        done,
      );
    },

    write(chunk, encoding, callback) {
      if (typeof chunk === "string" && decodeStrings && !objectMode) {
        chunk = Buffer.from(chunk, encoding);
        chunk = new Uint8Array(
          chunk.buffer,
          chunk.byteOffset,
          chunk.byteLength,
        );
      }

      function done(error) {
        try {
          callback(error);
        } catch (error) {
          destroy(duplex, error);
        }
      }

      writer.ready.then(
        () => writer.write(chunk).then(done, done),
        done,
      );
    },

    final(callback) {
      function done(error) {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy(duplex, error));
        }
      }

      if (!writableClosed) {
        writer.close().then(done, done);
      }
    },

    read() {
      reader.read().then(
        (chunk) => {
          if (chunk.done) {
            duplex.push(null);
          } else {
            duplex.push(chunk.value);
          }
        },
        (error) => destroy(duplex, error),
      );
    },

    destroy(error, callback) {
      function done() {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error;
          });
        }
      }

      async function closeWriter() {
        if (!writableClosed) {
          await writer.abort(error);
        }
      }

      async function closeReader() {
        if (!readableClosed) {
          await reader.cancel(error);
        }
      }

      if (!writableClosed || !readableClosed) {
        Promise.all([
          closeWriter(),
          closeReader(),
        ]).then(done, done);
        return;
      }

      done();
    },
  });

  writer.closed.then(
    () => {
      writableClosed = true;
      if (!isWritableEnded(duplex)) {
        destroy(duplex, new ERR_STREAM_PREMATURE_CLOSE());
      }
    },
    (error) => {
      writableClosed = true;
      readableClosed = true;
      destroy(duplex, error);
    },
  );

  reader.closed.then(
    () => {
      readableClosed = true;
      if (!isReadableEnded(duplex)) {
        duplex.push(null);
      }
    },
    (error) => {
      writableClosed = true;
      readableClosed = true;
      destroy(duplex, error);
    },
  );

  return duplex;
};

// readable-stream attaches these to Readable, but Node.js core does not.
// Delete them here to better match Node.js core. These can be removed once
// https://github.com/nodejs/readable-stream/issues/485 is resolved.
delete Readable.Duplex;
delete Readable.PassThrough;
delete Readable.Readable;
delete Readable.Stream;
delete Readable.Transform;
delete Readable.Writable;
delete Readable._isUint8Array;
delete Readable._uint8ArrayToBuffer;
delete Readable.addAbortSignal;
delete Readable.compose;
delete Readable.destroy;
delete Readable.finished;
delete Readable.isDisturbed;
delete Readable.isErrored;
delete Readable.isReadable;
delete Readable.pipeline;

// The following code implements Readable.toWeb(), Writable.toWeb(), and
// Duplex.toWeb(). These functions are not properly implemented in the
// readable-stream module yet. This can be removed once the following upstream
// issue is resolved: https://github.com/nodejs/readable-stream/issues/482
function newReadableStreamFromStreamReadable(
  streamReadable,
  options = kEmptyObject,
) {
  // Not using the internal/streams/utils isReadableNodeStream utility
  // here because it will return false if streamReadable is a Duplex
  // whose readable option is false. For a Duplex that is not readable,
  // we want it to pass this check but return a closed ReadableStream.
  if (typeof streamReadable?._readableState !== "object") {
    throw new ERR_INVALID_ARG_TYPE(
      "streamReadable",
      "stream.Readable",
      streamReadable,
    );
  }

  if (isDestroyed(streamReadable) || !isReadable(streamReadable)) {
    const readable = new ReadableStream();
    readable.cancel();
    return readable;
  }

  const objectMode = streamReadable.readableObjectMode;
  const highWaterMark = streamReadable.readableHighWaterMark;

  const evaluateStrategyOrFallback = (strategy) => {
    // If there is a strategy available, use it
    if (strategy) {
      return strategy;
    }

    if (objectMode) {
      // When running in objectMode explicitly but no strategy, we just fall
      // back to CountQueuingStrategy
      return new CountQueuingStrategy({ highWaterMark });
    }

    // When not running in objectMode explicitly, we just fall
    // back to a minimal strategy that just specifies the highWaterMark
    // and no size algorithm. Using a ByteLengthQueuingStrategy here
    // is unnecessary.
    return { highWaterMark };
  };

  const strategy = evaluateStrategyOrFallback(options?.strategy);

  let controller;

  function onData(chunk) {
    // Copy the Buffer to detach it from the pool.
    if (Buffer.isBuffer(chunk) && !objectMode) {
      chunk = new Uint8Array(chunk);
    }
    controller.enqueue(chunk);
    if (controller.desiredSize <= 0) {
      streamReadable.pause();
    }
  }

  streamReadable.pause();

  const cleanup = finished(streamReadable, (error) => {
    if (error?.code === "ERR_STREAM_PREMATURE_CLOSE") {
      const err = new AbortError(undefined, { cause: error });
      error = err;
    }

    cleanup();
    // This is a protection against non-standard, legacy streams
    // that happen to emit an error event again after finished is called.
    streamReadable.on("error", () => {});
    if (error) {
      return controller.error(error);
    }
    controller.close();
  });

  streamReadable.on("data", onData);

  return new ReadableStream({
    start(c) {
      controller = c;
    },

    pull() {
      streamReadable.resume();
    },

    cancel(reason) {
      destroy(streamReadable, reason);
    },
  }, strategy);
}

function newWritableStreamFromStreamWritable(streamWritable) {
  // Not using the internal/streams/utils isWritableNodeStream utility
  // here because it will return false if streamWritable is a Duplex
  // whose writable option is false. For a Duplex that is not writable,
  // we want it to pass this check but return a closed WritableStream.
  if (typeof streamWritable?._writableState !== "object") {
    throw new ERR_INVALID_ARG_TYPE(
      "streamWritable",
      "stream.Writable",
      streamWritable,
    );
  }

  if (isDestroyed(streamWritable) || !isWritable(streamWritable)) {
    const writable = new WritableStream();
    writable.close();
    return writable;
  }

  const highWaterMark = streamWritable.writableHighWaterMark;
  const strategy = streamWritable.writableObjectMode
    ? new CountQueuingStrategy({ highWaterMark })
    : { highWaterMark };

  let controller;
  let backpressurePromise;
  let closed;

  function onDrain() {
    if (backpressurePromise !== undefined) {
      backpressurePromise.resolve();
    }
  }

  const cleanup = finished(streamWritable, (error) => {
    if (error?.code === "ERR_STREAM_PREMATURE_CLOSE") {
      const err = new AbortError(undefined, { cause: error });
      error = err;
    }

    cleanup();
    // This is a protection against non-standard, legacy streams
    // that happen to emit an error event again after finished is called.
    streamWritable.on("error", () => {});
    if (error != null) {
      if (backpressurePromise !== undefined) {
        backpressurePromise.reject(error);
      }
      // If closed is not undefined, the error is happening
      // after the WritableStream close has already started.
      // We need to reject it here.
      if (closed !== undefined) {
        closed.reject(error);
        closed = undefined;
      }
      controller.error(error);
      controller = undefined;
      return;
    }

    if (closed !== undefined) {
      closed.resolve();
      closed = undefined;
      return;
    }
    controller.error(new AbortError());
    controller = undefined;
  });

  streamWritable.on("drain", onDrain);

  return new WritableStream({
    start(c) {
      controller = c;
    },

    async write(chunk) {
      if (streamWritable.writableNeedDrain || !streamWritable.write(chunk)) {
        backpressurePromise = createDeferredPromise();
        return backpressurePromise.promise.finally(() => {
          backpressurePromise = undefined;
        });
      }
    },

    abort(reason) {
      destroy(streamWritable, reason);
    },

    close() {
      if (closed === undefined && !isWritableEnded(streamWritable)) {
        closed = createDeferredPromise();
        streamWritable.end();
        return closed.promise;
      }

      controller = undefined;
      return Promise.resolve();
    },
  }, strategy);
}

function newReadableWritablePairFromDuplex(duplex) {
  // Not using the internal/streams/utils isWritableNodeStream and
  // isReadableNodestream utilities here because they will return false
  // if the duplex was created with writable or readable options set to
  // false. Instead, we'll check the readable and writable state after
  // and return closed WritableStream or closed ReadableStream as
  // necessary.
  if (
    typeof duplex?._writableState !== "object" ||
    typeof duplex?._readableState !== "object"
  ) {
    throw new ERR_INVALID_ARG_TYPE("duplex", "stream.Duplex", duplex);
  }

  if (isDestroyed(duplex)) {
    const writable = new WritableStream();
    const readable = new ReadableStream();
    writable.close();
    readable.cancel();
    return { readable, writable };
  }

  const writable = isWritable(duplex)
    ? newWritableStreamFromStreamWritable(duplex)
    : new WritableStream();

  if (!isWritable(duplex)) {
    writable.close();
  }

  const readable = isReadable(duplex)
    ? newReadableStreamFromStreamReadable(duplex)
    : new ReadableStream();

  if (!isReadable(duplex)) {
    readable.cancel();
  }

  return { writable, readable };
}

Readable.toWeb = newReadableStreamFromStreamReadable;
Writable.toWeb = newWritableStreamFromStreamWritable;
Duplex.toWeb = newReadableWritablePairFromDuplex;
