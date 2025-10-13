function Exp({
  title,
  time,
  place,
}: {
  title: string;
  time: string;
  place: string;
}) {
  return (
    <div className="flex flex-col bg-gray-900 rounded-lg p-4">
      <div className="flex justify-between">
        <span className="text-gray-300">{title}</span>
        <span>{time}</span>
      </div>
      <span className="text-gray-500">{place}</span>
    </div>
  );
}

export default function Experience() {
  return (
    <section className="flex flex-col gap-2 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5">
      <span className="text-gray-300 text-lg font-semibold">
        Work Experience
      </span>
      <div className="flex flex-col gap-2 lg:gap-4">
        <Exp title="AI Engineer" time="2024-2025" place="IoasiZ" />
        <Exp title="Web Developer" time="2022-2024" place="Bank of China" />
        <Exp
          title="Backend Java Developer"
          time="2022-2022"
          place="BeaconFire"
        />
      </div>
    </section>
  );
}
