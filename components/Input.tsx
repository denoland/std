import { JSX } from "preact";
import { type ForwardedRef, forwardRef } from "preact/compat";

export default forwardRef((
  props: JSX.HTMLAttributes<HTMLInputElement>,
  ref: ForwardedRef<HTMLInputElement>,
) => (
  <input
    {...props}
    ref={ref}
    class={`px-4 py-2 bg-white rounded-full border-1 border-gray-300 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) ${
      props.class ?? ""
    }`}
  />
));
