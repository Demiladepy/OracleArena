import Link from 'next/link';
import { GITHUB_REPO_URL } from '../../lib/site';
import { SomniaPartnerLockup } from './SomniaPartnerLockup';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black">
      <div className="somnia-partner-strip mx-auto max-w-7xl border-x-0 border-t-0">
        <div>
          <p className="somnia-label mb-2">Ecosystem</p>
          <SomniaPartnerLockup size="sm" />
        </div>
        <p className="max-w-sm text-right text-xs text-surface-muted">
          Oracle Arena is built natively on Somnia for the Agentathon — modeling their stack with
          respect.
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="max-w-md text-sm leading-relaxed text-surface-muted">
          Open infrastructure for verifiable fact resolution on Somnia. Built for the Agentathon.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href={GITHUB_REPO_URL} className="text-surface-muted hover:text-white transition-colors">
            GitHub
          </Link>
          <Link
            href={`${GITHUB_REPO_URL}#readme`}
            className="text-surface-muted hover:text-white transition-colors"
          >
            README
          </Link>
          <span className="text-surface-muted">Chain 50312 · STT</span>
        </div>
      </div>
    </footer>
  );
}
