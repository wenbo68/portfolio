import { api } from '~/trpc/server';
import Services from '../_components/service/Services';
import ReviewSection from '../_components/review/ReviewSection';
import RatingAndCommentSection from '../_components/comment/RatingAndCommentSection';

export default async function Page() {
  await api.comment.getAverageRating.prefetch();
  await api.comment.getCommentTree.prefetch({ page: 1, pageSize: 10 });

  return (
    <div className="flex flex-col gap-7 sm:gap-9 md:gap-11 lg:gap-13 xl:gap-15">
      <Services />
      <RatingAndCommentSection />
    </div>
  );
}
