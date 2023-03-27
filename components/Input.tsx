import { JSX } from "preact";
import { type ForwardedRef, forwardRef } from "preact/compat";

export default forwardRef((
  props: JSX.HTMLAttributes<HTMLInputElement>,
  ref: ForwardedRef<HTMLInputElement>,
) => (
  <input
    {...props}
    ref={ref}
    class={`px-3 py-2 bg-white rounded border-1 border-gray-300 shadow-md disabled:(opacity-50 cursor-not-allowed) ${
      props.class ?? ""
    }`}
  />
));
