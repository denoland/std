# std/math

Provides math functions for generating distributions.

## Random Normal Distribution

A **Normal** or **Gaussian** distribution is a type of 
continuous probability distribution dependent on two
parameters:

**μ** - The **mean** 
**σ** - The **standard deviation**

This implementation makes use of the popular Box-Muller transform.

```ts
import { normalDistribution } from "https://deno.land/std@$STD_VERSION/math/distributions.ts";

const distribution = normalDistribution(100, 16, 0.003)
```

## Uniform Range

Generate an array of numbers uniformly spread across a range.

```ts
import { uniformRange } from "https://deno.land/std/math/distributions.ts";

const range = uniformRange(10, {
  min: 1,
  max: 10,
})
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```