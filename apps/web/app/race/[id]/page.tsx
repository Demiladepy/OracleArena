type PageProps = {
  params: { id: string };
};

export default function RaceViewPage({ params }: PageProps) {
  const { id } = params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Live Race View</h1>
      <p className="mt-4 text-neutral-400">
        Placeholder for bounty <span className="font-mono text-neutral-200">{id}</span>. Agents
        resolving in real time via SDS race-view stream.
      </p>
    </main>
  );
}
