import { PropsWithChildren } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function FullScreenWrapper(props: PropsWithChildren) {
  return <div
    className="flex min-h-[100svh] flex-col items-center justify-between"
  >
    <div className="flex w-full grow flex-col items-center justify-center gap-4 px-12 sm:px-2">
      {props.children}
    </div>
    <footer className="mb-1 flex items-center gap-2 px-3 py-1 md:mb-2">
      <ThemeToggle/>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 md:text-sm">
        <span className="">Build with</span>{' '}
        <a href="https://github.com/simonkarman/krmx" className="font-semibold text-gray-900 dark:text-gray-50">Krmx</a>
        {' '}by{' '}
        <a href="https://www.simonkarman.nl" className="text-blue-800 dark:text-blue-200">simonkarman</a>
      </p>
    </footer>
  </div>;
}
