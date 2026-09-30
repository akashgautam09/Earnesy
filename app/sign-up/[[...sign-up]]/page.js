'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
    return (
        <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-hidden bg-[var(--background)] px-5 py-12 sm:px-8 lg:px-12">
            <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/login"
                forceRedirectUrl="/dashboard"
            />
        </main>
    )
}
