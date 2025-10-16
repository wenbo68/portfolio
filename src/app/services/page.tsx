import { api } from '~/trpc/server';
import Review from '../_components/review/Reviews';
import Services from '../_components/service/Services';

export default async function Page() {
  await api.comment.getAll.prefetch();

  return (
    <div className="flex flex-col gap-8">
      <Services />
      <Review />
    </div>
  );
}
