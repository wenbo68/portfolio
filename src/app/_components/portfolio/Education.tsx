function Edu({
  school,
  time,
  degree,
  thesis,
  supervisor,
}: {
  school: string;
  time: string;
  degree: string;
  thesis?: string;
  supervisor?: string;
}) {
  return (
    <div className="flex flex-col gap-5 bg-gray-900 rounded-lg p-4">
      <div className="flex flex-col">
        <div className="flex justify-between">
          <span className="text-gray-300">{school}</span>
          <span>{time}</span>
        </div>
        <span className="text-gray-500">{degree}</span>
      </div>

      {thesis && supervisor ? (
        <div className="flex flex-col">
          <div>
            <span className="text-gray-300">Thesis: </span>
            <span>"{thesis}"</span>
          </div>
          <div>
            <span className="text-gray-300">Supervisors: </span>
            <span>{supervisor}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Education() {
  return (
    <section className="flex flex-col gap-2 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5">
      <span className="text-gray-300 text-lg font-semibold">Education</span>
      <div className="flex flex-col gap-2 lg:gap-4">
        <Edu
          school="University of California, San Diego"
          time="2025-Present"
          degree="M.S. in Computer Science (Artificial Intelligence)"
          // thesis="Thesis: Scalable Graph Neural Networks on Heterogeneous Graphs"
        />
        <Edu
          school="University of North Carolina, Chapel Hill"
          time="2018-2022"
          degree="B.S. in Computer Science & Neuroscience"
          thesis="Automated navigation of nanoparticles through mazes using computer-generated holography"
          supervisor="Dr. Zijie Yan, Dr. Jack Snoeyink"
        />
      </div>
    </section>
  );
}
