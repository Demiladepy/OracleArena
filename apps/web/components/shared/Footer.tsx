import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/8 bg-navy-deeper/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="max-w-md text-sm leading-relaxed text-surface-muted">
          Open infrastructure for verifiable fact resolution on Somnia. Built for the Agentathon.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="https://github.com/nibiru/oraclearena" className="text-ice hover:text-cyan transition-colors">
            GitHub
          </Link>
          <Link href="/" className="text-ice hover:text-cyan transition-colors">
            README
          </Link>
          <span className="text-surface-muted">Chain 50312 · STT</span>
        </div>
      </div>
    </footer>
  );
}
