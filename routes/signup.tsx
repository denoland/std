import type { PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import AuthForm from "@/components/AuthForm.tsx";
import Notice from "@/components/Notice.tsx";

export default function SignupPage(props: PageProps) {
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Signup" />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto space-y-8 w-72">
          <a href="/">
            <img
              src="/logo.webp"
              alt="Logo"
              class="h-24 w-auto mb-8 mx-auto"
            />
          </a>
          {errorMessage && <Notice message={errorMessage} color="yellow" />}
          <AuthForm type="Signup" />
          <div class="text-center text-gray-500 hover:text-black">
            <a href="/login">Already have an account? Log in</a>
          </div>
        </div>
      </div>
    </>
  );
}
