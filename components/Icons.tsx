// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { JSX } from "preact";

export function GitHub(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Discord(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.16 4.50747C18.5996 3.79309 16.9523 3.28628 15.2603 3C15.0287 3.41393 14.8192 3.8398 14.6326 4.27584C12.8302 4.00424 10.9973 4.00424 9.19488 4.27584C9.00819 3.83984 8.79868 3.41398 8.56723 3C6.87405 3.2887 5.22569 3.79671 3.66374 4.51121C0.56287 9.099 -0.277728 13.5729 0.142571 17.9832C1.95852 19.3249 3.99108 20.3453 6.15191 21C6.63846 20.3456 7.069 19.6514 7.43896 18.9247C6.73628 18.6622 6.05807 18.3384 5.41219 17.957C5.58217 17.8337 5.74842 17.7067 5.90907 17.5834C7.78846 18.4673 9.83971 18.9255 11.9165 18.9255C13.9934 18.9255 16.0446 18.4673 17.924 17.5834C18.0865 17.7161 18.2528 17.8431 18.4209 17.957C17.7738 18.339 17.0943 18.6635 16.3904 18.9265C16.7599 19.6529 17.1905 20.3466 17.6774 21C19.8401 20.3479 21.8742 19.328 23.6905 17.9851C24.1837 12.8705 22.848 8.43773 20.16 4.50747ZM7.97134 15.2709C6.80011 15.2709 5.83248 14.208 5.83248 12.9004C5.83248 11.5928 6.76648 10.5205 7.9676 10.5205C9.16872 10.5205 10.1289 11.5928 10.1083 12.9004C10.0878 14.208 9.16499 15.2709 7.97134 15.2709ZM15.8617 15.2709C14.6886 15.2709 13.7248 14.208 13.7248 12.9004C13.7248 11.5928 14.6588 10.5205 15.8617 10.5205C17.0647 10.5205 18.0174 11.5928 17.9969 12.9004C17.9763 14.208 17.0554 15.2709 15.8617 15.2709Z"
      />
    </svg>
  );
}

export function Bell(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </svg>
  );
}

export function CircleFilled(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path
        d="M7 3.34a10 10 0 1 1 -4.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 4.995 -8.336z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Check(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

export function Rss(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2.5 3a.5.5 0 0 1 .5-.5h.5c5.523 0 10 4.477 10 10v.5a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5v-.5A8.5 8.5 0 0 0 3.5 4H3a.5.5 0 0 1-.5-.5V3Zm0 4.5A.5.5 0 0 1 3 7h.5A5.5 5.5 0 0 1 9 12.5v.5a.5.5 0 0 1-.5.5H8a.5.5 0 0 1-.5-.5v-.5a4 4 0 0 0-4-4H3a.5.5 0 0 1-.5-.5v-.5Zm0 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"
      >
      </path>
    </svg>
  );
}
