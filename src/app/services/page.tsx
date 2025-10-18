import { api } from '~/trpc/server';
import Reviews from '../_components/review/Reviews';
import Services from '../_components/service/Services';

export default async function Page() {
  await api.comment.getAllAsTree.prefetch();

  return (
    <div className="flex flex-col gap-8">
      <Services />
      <Reviews />
    </div>
  );
}
