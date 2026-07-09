"use client"
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react"
import { fetchCreator } from '@/actions/userAction';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { data: session } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter();

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 flex h-[5rem] items-center justify-between px-4 sm:px-6 md:px-10 py-4 border-b border-b-white/20 bg-black/30 backdrop-blur-md transition-all duration-300">

      <div className="md:text-xl text-[1.2rem] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
        Get Me A Kofi
      </div>

      <ul className="hidden md:flex items-center gap-10 text-sm font-medium text-white">
        <li className="hover:text-gray-300 cursor-pointer transition-colors">Home</li>
        <li className="hover:text-gray-300 cursor-pointer transition-colors">About</li>
        <li className="hover:text-gray-300 cursor-pointer transition-colors">Contact</li>
      </ul>

      <div className="flex items-center gap-2">
        {!session && <>  <Link href="/login">
          <button className="md:px-3 md:py-1 font-medium text-white md:hover:text-gray-300 text-[0.8rem] transition-colors">
            Login
          </button>
        </Link>

          <Link href="/login">
            <button className="md:flex md:px-5 md:py-2 px-2 py-2 text-[0.8rem] font-semibold text-black bg-white rounded-full hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5">
              Sign Up
            </button>
          </Link>
        </>
        }
        {session && <>
          <div ref={dropdownRef} className="relative">
          <button id="dropdownInformationButton" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="relative md:px-4 px-2 py-3 md:py-2.5 text-sm font-medium text-white rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-1 focus:ring-white inline-flex items-center gap-1" type="button">
            {session.user.name}
            <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
          </button>

          <div id="dropdownInformation" className={`${isDropdownOpen ? "block" : "hidden"} absolute top-full mt-2 md:left-0 -left-[9rem] z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg w-72`}>
            <div className="p-2">
              <div className={`flex items-center px-2.5 p-2 space-x-1.5 text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>
                <img width={32} height={32} className="rounded-full" src={session.user.image} alt="Rounded avatar" />
                <div className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session.user.name}</div>
                  <div className={`truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{session.user.email}</div>
                </div>
              </div>
            </div>
            <ul className={`px-2 pb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} aria-labelledby="dropdownInformationButton">
              <li>
                <span className={`inline-flex items-center w-full cursor-pointer p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}
                onClick={async()=>{
                  let a = await fetch('/api/profile',{
                    method:'GET',
                  });
                  if(a.ok){
                    let data = await a.json();
                    router.replace(`/${data.user?.username}`);
                  }
                }}>
                  <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 6H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6m6-11h1a2 2 0 0 1 2 2v2M7 15h6m6-6v6m-3-3h6" /></svg>
                  Your Page
                </span>
              </li>
              <li>
                <Link href="/dashboard" className={`inline-flex items-center w-full p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}>
                  <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  Dashboard
                </Link>
              </li>
              <li className={`flex items-center w-full p-2 rounded mb-1.5 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <span className={`inline-flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 0 1-.5-17.986V3c-.354.966-.5 1.911-.5 3a9 9 0 0 0 9 9c.239 0 .254.018.488 0A9.004 9.004 0 0 1 12 21Z" /></svg>
                  Dark mode
                </span>
                <label className="inline-flex items-center cursor-pointer ms-auto">
                  <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} className="sr-only peer" />
                  <div className={`relative w-9 h-5 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer transition-colors`}>
                    <div className={`absolute top-[2px] start-[2px] bg-white rounded-full h-4 w-4 transition-transform ${isDarkMode ? 'translate-x-full' : ''}`}></div>
                  </div>
                  <span className="ms-3 text-sm font-medium sr-only">Toggle dark mode</span>
                </label>
              </li>
              <li className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-1.5`}>
                <Link href="/earnings" className={`inline-flex items-center w-full p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}>
                  <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m10.051 8.102-3.778.322-1.994 1.994a.94.94 0 0 0 .533 1.6l2.698.316m8.39 1.617-.322 3.78-1.994 1.994a.94.94 0 0 1-1.595-.533l-.4-2.652m8.166-11.174a1.366 1.366 0 0 0-1.12-1.12c-1.616-.279-4.906-.623-6.38.853-1.671 1.672-5.211 8.015-6.31 10.023a.932.932 0 0 0 .162 1.111l.828.835.833.832a.932.932 0 0 0 1.111.163c2.008-1.102 8.35-4.642 10.021-6.312 1.475-1.478 1.133-4.77.855-6.385Zm-2.961 3.722a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0Z" /></svg>
                  Earnings
                </Link>
              </li>
              <li>
                <button className={`inline-flex items-center w-full p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                  onClick={() => { setIsDropdownOpen(false); signOut(); }}>
                  <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2" /></svg>
                  Sign out
                </button>
              </li>
            </ul>
          </div>
          </div>

          <button className="hidden md:inline-flex px-5 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5" onClick={() => signOut()}>
            Sign Out
          </button>
        </>}
      </div>
    </nav>
  );
};

export default Navbar;