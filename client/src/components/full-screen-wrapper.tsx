import { PropsWithChildren } from 'react';

export function FullScreenWrapper(props: PropsWithChildren) {
  return <div
    className="flex min-h-[100svh] flex-col items-center justify-between"
  >
    <div className="flex w-full grow flex-col items-center justify-center gap-4 p-2">
      {props.children}
    </div>
    <footer className="px-3 py-1 text-center text-xs text-gray-500 md:left-2 md:mb-2 md:text-sm dark:text-gray-400">
      <span className="">Build with</span>{' '}
      <a href="https://github.com/simonkarman/krmx" className="font-semibold text-gray-900 dark:text-gray-50">Krmx</a>
      {' '}by{' '}
      <a href="https://www.simonkarman.nl" className="text-blue-800 dark:text-blue-200">simonkarman</a>
    </footer>
  </div>;
}
