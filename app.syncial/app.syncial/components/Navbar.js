import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { Search, Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/public/logo.jpg";
import SearchFollowUser from "./SearchFollowUser";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="text-white flex flex-col">
      <nav className="flex justify-between items-center px-4 md:px-24 py-4 bg-black">
        {/* Left: Logo + Search bar */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src={logo}
              alt="Syncial Logo"
              className="w-28 h-auto md:w-[230px] md:h-auto"
            />
          </Link>
        </div>

        {/* Right: Connect button & mobile menu toggle */}
        <div className="flex items-center space-x-7">
          <div className="hidden md:flex text-lg text-[#ED3968] font-semibold hover:text-white">
            <Link href={'/predict'}>Predict</Link>
          </div>
          <div className="hidden md:flex text-lg text-[#ED3968] font-semibold hover:text-white">
            <Link href={'/discover'}>Discover</Link>
          </div>
          <div className="hidden md:flex text-lg text-[#ED3968] font-semibold hover:text-white">
            <Link href={'/dashboard'}>Dashboard</Link>
          </div>
          
          {/* Desktop Search */}
          <div className='hidden md:block'>
            <SearchFollowUser />
          </div>
     
          <div className="hidden md:block">
            <ConnectButton />
          </div>
         
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#ED3968]"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu (drawer) */}
      {mobileMenuOpen && (
        <div className="bg-[#16030d] text-white p-4 md:hidden space-y-4">
          {/* Mobile Search - Added at the top */}
          <div className="mb-4">
            <SearchFollowUser />
          </div>

          {/* Mobile Nav Links */}
          <div className="flex flex-col space-y-3 text-lg font-semibold">
            <Link 
              href="/predict" 
              className="text-[#ED3968] hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Predict
            </Link>
            <Link 
              href="/discover" 
              className="text-[#ED3968] hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Discover
            </Link>
            <Link 
              href="/dashboard" 
              className="text-[#ED3968] hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile Connect Button */}
          <div className="pt-2">
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  );
}