'use client'

import { SignIn } from '@clerk/nextjs'

export default function Login() {
    return (
        <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-hidden bg-[var(--background)] px-5 py-12 sm:px-8 lg:px-12">
            <SignIn
                path="/login"
                routing="path"
                signUpUrl="/sign-up"
                forceRedirectUrl="/dashboard"
            />
        </main>
    )
}
