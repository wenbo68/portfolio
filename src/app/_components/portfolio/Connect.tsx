import Link from 'next/link';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa6';

export default function Connect() {
  return (
    <section className="flex flex-col gap-2 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5">
      <span className="text-gray-300 text-lg font-semibold">Connect</span>
      <div className="flex gap-2 md:gap-3">
        <Link href="https://github.com/wenbo68" className="block">
          <FaGithub size={24} className="min-w-fit" />
        </Link>
        <Link href="https://www.linkedin.com/in/wenboliu68/" className="block">
          <FaLinkedin size={24} className="min-w-fit" />
        </Link>
        <Link href="https://www.instagram.com/wenboliu68/" className="block">
          <FaInstagram size={24} className="min-w-fit" />
        </Link>
      </div>
    </section>
  );
}
