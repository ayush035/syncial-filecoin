import { motion } from 'framer-motion';



export default function SuccessModal({ onClose }) {
    return (
      <div className="fixed inset-0 z-50  bg-opacity-100  backdrop-blur-md flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="  text-white rounded-2xl p-10 max-w-lg mx-auto shadow-xl text-center"
        >
          <h1 className="text-4xl font-bold text-rose-100 mb-4">Congratulations 🎉</h1>
          <h2 className="text-3xl font-bold text-[#ED3968] mb-4">Welcome to Syncial Family!</h2>
          <p className="text-lg text-rose-100 mb-6">
            You are now onboarded and ready to post bangers! <br /> We're rolling out exciting features so keep an eye on our socials!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2  hover:bg-rose-500 rounded-full text-white font-semibold transition"
          >
            x
          </button>
        </motion.div>
      </div>
    );
  }

  