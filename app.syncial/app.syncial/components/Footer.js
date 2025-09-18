import { FaTelegramPlane } from 'react-icons/fa';
import { FaXTwitter,FaLinkedinIn } from "react-icons/fa6";
import { LuMail } from "react-icons/lu";
import { FiGithub } from "react-icons/fi";


export default function Footer() {
  return (
    <footer className="bg-[#0f0f0f] text-white py-6 border-t border-rose-500">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-rose-100 mb-2 md:mb-0 text-center md:text-left">
          © {new Date().getFullYear()} Syncial.xyz All rights reserved.
        </p>

        <div className="flex space-x-6">
          <a href="https://x.com/syncialxyz" target="_blank" rel="noopener noreferrer" className="hover:text-[#ED3968] transition">
            <FaXTwitter size={20} />
          </a>
          <a href="https://t.me/syncial" target="_blank" rel="noopener noreferrer" className="hover:text-[#ED3968] transition">
            <FaTelegramPlane size={20} />
          </a>
          <a href="mailto:hey.syncial@gmail.com" className="hover:text-[#ED3968] transition">
            <LuMail size={20} />
          </a>
          <a href="https://www.linkedin.com/company/syncial" target="_blank" rel="noopener noreferrer" className="hover:text-[#ED3968] transition">
            <FaLinkedinIn size={20} />
          </a>
          <a href="https://github.com/Syncial" target="_blank" rel="noopener noreferrer" className="hover:text-[#ED3968] transition">
            <FiGithub size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
