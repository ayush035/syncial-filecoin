import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { Search, Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/public/logo.jpg";

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

          {/* Desktop Search Bar next to Logo */}
          <div className="hidden md:flex items-center bg-[#16030d] rounded-xl w-60 ml-6 px-2 h-11 outline outline-1 outline-[#39071f]">
            <Search className="text-[#563e4b] w-5 h-5 mr-2" />
            <input
              className="text-rose-100 bg-[#16030d] text-lg w-full h-full outline-none"
              placeholder="Search"
            />
          </div>
        </div>

        {/* Right: Connect button & mobile menu toggle */}
        <div className="flex items-center space-x-7">
        <div className="hidden md:flex text-lg text-[#ED3968] font-semibold hover:text-white ">
          <Link href={'/predict'}>Predict</Link>
            
          </div>
        <div className="hidden md:flex text-lg text-[#ED3968] font-semibold hover:text-white ">
          <Link href={'/discover'}>Discover</Link>
            
          </div>
        <div className="hidden md:flex text-lg text-[#ED3968] font-semibold hover:text-white ">
        <Link href={'/dashboard'}>Dashboard</Link>
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
    {/* Mobile Nav Links */}
    <div className="flex flex-col space-y-3 text-lg font-semibold">
      <Link href="/discover" className="text-[#ED3968] hover:text-white">
        Discover
      </Link>
      <Link href="/dashboard" className="text-[#ED3968] hover:text-white">
        Dashboard
      </Link>
    </div>

    {/* Mobile Connect Button */}
    <div>
      <ConnectButton />
    </div>

    {/* Mobile Search Bar */}
    {/* <div className="flex items-center bg-[#16030d] rounded-xl w-full px-2 h-11 outline outline-1 outline-[#39071f]">
      <Search className="text-[#563e4b] w-5 h-5 mr-2" />
      <input
        className="text-rose-100 bg-[#16030d] text-lg w-full h-full outline-none"
        placeholder="Search"
      />
    </div> */}
  </div>
)}
    </div>
  );
}
