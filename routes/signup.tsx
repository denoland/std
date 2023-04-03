import type { PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import AuthForm from "@/components/AuthForm.tsx";
import Notice from "@/components/Notice.tsx";
import Logo from "@/components/Logo.tsx";
import OAuthLoginButton from "@/components/OAuthLoginButton.tsx";
import * as Icons from "@/components/Icons.tsx";

export default function SignupPage(props: PageProps) {
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Signup" />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto space-y-8 w-72">
          <a href="/">
            <Logo />
          </a>
          {errorMessage === "User already registered" && (
            <Notice>{errorMessage}</Notice>
          )}
          <OAuthLoginButton provider="github" icon={Icons.GitHub} />
          <AuthForm type="Signup" />
          <div class="text-center text-gray-500 hover:text-black">
            <a href="/login">Already have an account? Log in</a>
          </div>
        </div>
      </div>
    </>
  );
}
