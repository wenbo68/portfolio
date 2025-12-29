import Link from 'next/link';

function Project({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={url}
      className="flex flex-col bg-gray-900 rounded p-4 basis-0 flex-grow group"
    >
      {/* <Image src={imageUrl} alt={title} fill /> */}
      <span className="text-gray-300 group-hover:text-blue-400">{title}</span>
      <span className="text-gray-500 text-sm">{description}</span>
    </Link>
  );
}

export default function Projects() {
  return (
    <section className="flex flex-col gap-2 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5">
      <span className="text-gray-300 text-lg font-semibold">Projects</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4">
        <Project
          url="https://www.showplayer.net"
          title="Tonytonyshopper"
          description="(Ongoing) personal/small-scale E-commerce website"
        />
        <Project
          url="https://www.showplayer.net"
          title="Showplayer"
          description="Stream movies and tv shows without popups"
        />
        <Project
          url="https://dodo-mauve.vercel.app"
          title="Dodo"
          description="Manage your todo lists using smooth drag-and-drops"
        />
      </div>
    </section>
  );
}
