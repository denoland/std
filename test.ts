import {
  getRowPadding,
  resliceBufferWithPadding,
} from "./webgpu/row_padding.ts";

const input = new Uint8Array([0, 255, 0, 255, 120, 120, 120]);
console.log(resliceBufferWithPadding(input, 1, 1));
