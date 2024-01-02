// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
interface PremiumBadgeProps {
  class?: string;
}

export function PremiumBadge(props: PremiumBadgeProps) {
  return (
    <svg
      width="30"
      height="30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={"0 0 30 30"}
      {...props}
    >
      <title>
        Deno Hunt premium user
      </title>
      <g clip-path="url(#prefix__clip0_802_86)">
        <path
          d="M15 0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15C0 6.716 6.716 0 15 0z"
          fill="url(#prefix__paint0_linear_802_86)"
        />
        <mask
          id="prefix__a"
          style="mask-type:alpha"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="30"
          height="30"
        >
          <path
            d="M15 .5C23.008.5 29.5 6.992 29.5 15S23.008 29.5 15 29.5.5 23.008.5 15 6.992.5 15 .5z"
            fill="#9E5656"
            stroke="#FF2B2B"
          />
        </mask>
        <g mask="url(#prefix__a)">
          <path
            d="M16.598 31.144l.142.978.98-.13c3.86-.517 7.42-2.443 10.024-5.34l.361-.402-.138-.523-2.614-9.86h0l-.003-.007c-.655-2.395-1.482-4.878-3.772-6.69h0C19.756 7.73 17.47 7 14.876 7 9.54 7 5 10.438 5 15.132c0 2.233 1.088 4.063 2.928 5.278 1.759 1.162 4.173 1.75 6.977 1.723a8.847 8.847 0 01.038.112l.029.11c.023.094.05.215.082.36.063.29.137.66.219 1.078.11.567.23 1.207.347 1.833.056.298.11.592.164.874l.042.22c.28 1.487.558 2.954.772 4.424z"
            fill="url(#prefix__paint1_linear_802_86)"
            stroke="#DF7F26"
            stroke-width="2"
          />
          <path
            d="M15.124 12a1.124 1.124 0 110 2.248 1.124 1.124 0 010-2.248z"
            fill="#DF7F26"
          />
        </g>
        <path
          d="M15 1c7.732 0 14 6.268 14 14s-6.268 14-14 14S1 22.732 1 15 7.268 1 15 1z"
          stroke="#AB5F1A"
          stroke-width="2"
        />
        <path
          d="M3.5 12C5 6.5 10 3.5 15 3M7.5 15.5c0-4 4.5-6.5 7-6.5M17 22l.5 3"
          stroke="#fff"
          stroke-width="2"
          stroke-linecap="round"
        />
      </g>
      <defs>
        <linearGradient
          id="prefix__paint0_linear_802_86"
          x1="6"
          y1="2.5"
          x2="23.5"
          y2="36.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFED8F" />
          <stop offset=".276" stop-color="#FFDF70" />
          <stop offset=".536" stop-color="#F8BB1E" />
          <stop offset=".781" stop-color="#FBEB5C" />
          <stop offset="1" stop-color="#FFEE93" />
        </linearGradient>
        <linearGradient
          id="prefix__paint1_linear_802_86"
          x1="14"
          y1="10.5"
          x2="28"
          y2="31"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFF3B7" />
          <stop offset=".422" stop-color="#FFCA63" />
          <stop offset="1" stop-color="#FAD258" />
        </linearGradient>
        <clipPath id="prefix__clip0_802_86">
          <path fill="#fff" d="M0 0h30v30H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}
