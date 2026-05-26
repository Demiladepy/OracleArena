type PageProps = {
  params: { id: string };
};

export default function BountyReceiptPage({ params }: PageProps) {
  const { id } = params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Bounty Receipt</h1>
      <p className="mt-4 text-neutral-400">
        Placeholder for bounty <span className="font-mono text-neutral-200">{id}</span>. Receipt
        page will render on-chain state + SDS data at oracle-arena.xyz/bounty/{'{id}'}.
      </p>
    </main>
  );
}
