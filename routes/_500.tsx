import Head from "@/components/Head.tsx";
import { ErrorPageProps } from "$fresh/server.ts";

export default function Error500Page(props: ErrorPageProps) {
  return (
    <>
      <Head title="Server error" />
      <div class="h-screen flex flex-col justify-center mx-auto max-w-7xl p-4 text-center space-y-4">
        <h1 class="text-4xl inline-block font-bold">Server error</h1>
        <p>500 internal error: {(props.error as Error).message}</p>
        <p class="text-xl text-blue-900">
          <a href="/">Return home</a>
        </p>
      </div>
    </>
  );
}
