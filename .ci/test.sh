echo $PATH
deno$DENO_EXE_SUFFIX run --allow-run --allow-write --allow-read --allow-env ./format.ts --check
export START_TIME=$(date +%s)
deno$DENO_EXE_SUFFIX run --allow-run --allow-net --allow-write --allow-read --allow-env --config=tsconfig.test.json ./testing/runner.ts --exclude node_modules
deno$DENO_EXE_SUFFIX run --allow-run --allow-read .ci/check_source_file_changes.ts $START_TIME
