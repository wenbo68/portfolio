import Education from './_components/portfolio/Education';
import Experience from './_components/portfolio/Experience';
import Intro from './_components/portfolio/Intro';
import Projects from './_components/portfolio/Projects';

export default async function Home() {
  return (
    <div className="flex flex-col gap-5 sm:gap-9 md:gap-11 lg:gap-13 xl:gap-15">
      <Intro />
      <Projects />
      <Experience />
      <Education />
      {/* <Connect /> */}
      {/* <BotNav /> */}
    </div>
  );
}
