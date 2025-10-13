import { BiLogoGmail } from 'react-icons/bi';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6';

export default function BotNac() {
  return (
    <nav className="px-2 max-w-2xl h-14 border-t-1 border-gray-600 mx-auto">
      <div className="flex w-full h-full items-center justify-end gap-3 md:gap-3">
        <a
          href="mailto:laboratorymember008@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <BiLogoGmail size={26} className="min-w-fit" />
        </a>

        <a
          href="https://github.com/wenbo68"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <FaGithub size={24} className="min-w-fit" />
        </a>

        <a
          href="https://www.linkedin.com/in/wenboliu68/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <FaLinkedin size={24} className="min-w-fit" />
        </a>

        <a
          href="https://www.instagram.com/wenboliu68/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <FaInstagram size={24} className="min-w-fit" />
        </a>
      </div>
    </nav>
  );
}
