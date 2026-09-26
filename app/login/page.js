"use client"

import React, { Suspense, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa'

const GoogleMark = () => (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4] shadow-sm">G</span>
)

const GithubMark = () => (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-black text-sm font-bold text-white">&#8226;</span>
)

const LoginContent = () => {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const errorMessage = {
        OAuthSignin: 'The provider could not start sign-in. Check the OAuth app configuration.',
        OAuthCallback: 'The provider sign-in completed, but account setup failed. Please try again.',
        AccessDenied: 'This account could not be connected. Make sure the provider allows access to your email.',
    }[error]

    useEffect(() => {
        if (session) router.replace('/dashboard')
    }, [session, router])

{/* <div className="pointer-events-none absolute -right-24 top-12 -z-10 h-72 w-72 rounded-full bg-[var(--accent)] opacity-70 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-36 -left-24 -z-10 h-80 w-80 rounded-full bg-[#d9f1e7] opacity-70 blur-3xl" /> */}
    return (
        
        <main className="flex min-h-[calc(100vh-9rem)] items-center overflow-hidden bg-[var(--background)] px-5 pt-12 pb-12 sm:px-8 lg:px-12">
            <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_34px_rgba(0,0,0,0.08)]">
                <section className="flex min-h-[50px] flex-col justify-center p-7 sm:p-12 lg:p-14">
                    <div className="mx-auto w-full max-w-md">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Earnesy</p>
                        <h2 className="mt-4 text-2xl text-[var(--foreground)] sm:text-3xl leading-tight tracking-tight">Your next chapter starts here.</h2>
                        <p className="mt-5 max-w-sm text-base leading-7 text-[var(--muted-foreground)]">Create your free account and give your community an easy way to show up for your work.</p>

                        {errorMessage && (
                            <p className="mt-6 rounded-xl border border-[#e54b4f]/30 bg-[#e54b4f]/10 px-4 py-3 text-sm leading-6 text-[#a83235]">{errorMessage}</p>
                        )}

                        <div className="mt-7 space-y-3">
                            <button onClick={() => signIn('google')} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2">
                                <FcGoogle className="h-7 w-7" />
                                Continue with Google
                            </button>
                            <p className="text-center text-sm text-[var(--muted-foreground)] font-semibold">or</p>
                            <button onClick={() => signIn('github')} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2">
                                <FaGithub className="h-7 w-7 text-black" />
                                Continue with GitHub
                            </button>
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                            <span className="h-px flex-1 bg-[var(--border)]" />
                            <span>Simple, secure, creator-first</span>
                            <span className="h-px flex-1 bg-[var(--border)]" />
                        </div>
                        <p className="mt-8 text-center text-xs leading-5 text-[var(--muted-foreground)]">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
                    </div>
                </section>
            </div>
        </main>
    )
}

const Login = () => (
    <Suspense fallback={null}>
        <LoginContent />
    </Suspense>
)

export default Login
