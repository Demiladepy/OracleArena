import { BountyRaceView } from '../../../components/pages/BountyRaceView';

type PageProps = {
  params: { id: string };
};

export default function BountyPage({ params }: PageProps) {
  const bountyId = BigInt(params.id);
  return <BountyRaceView bountyId={bountyId} />;
}
