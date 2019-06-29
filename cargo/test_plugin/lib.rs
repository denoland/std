use deno::{PinnedBuf, Op, CoreOp};

#[macro_use]
extern crate deno;

fn op_test_op(
  data: &[u8],
  zero_copy: Option<PinnedBuf>,
) -> CoreOp {
    let data_str = std::str::from_utf8(&data[..]).unwrap();
    let return_str = match zero_copy {
        Some(buf) => {
            let buf_str = std::str::from_utf8(&buf[..]).unwrap();
            format!("Hello from native bindings. data: {} | zero_copy: {}", data_str, buf_str)
        }
        None => {
            format!("Hello from native bindings. data: {} | zero_copy: NONE", data_str)
        }
    };
    Op::Sync(return_str.as_bytes().into())
}

declare_plugin_op!(test_op, op_test_op);