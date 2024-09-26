import { sendAlphabetEvent, useAlphabet } from '@/store/krmx';
import { useClient } from '@/store/krmx';
import { capitalize, claimAlphabet, extendAlphabet, releaseAlphabet } from 'board';

export function ExampleAlphabet() {
  const { username } = useClient();
  const alphabet = useAlphabet();
  const anotherUserClaimed = alphabet.claim !== undefined && alphabet.claim !== username;
  return <div className="space-y-2">
    <div>
      <h2 className="border-b border-gray-100 pb-1 font-bold dark:border-gray-800">Alphabet</h2>
      <p className="py-1 text-2xl font-bold text-cyan-600 dark:text-cyan-300">
        {Array.from(alphabet.letters).join(' ')}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={alphabet.letters.length >= 26 || anotherUserClaimed}
        onClick={() => sendAlphabetEvent(extendAlphabet())}
        className="grow-0 rounded-lg bg-orange-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-orange-700 focus:outline-none
                         focus:ring-4 focus:ring-orange-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300
                         disabled:hover:text-gray-500 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
      >
        Extend
      </button>
      {anotherUserClaimed && <p className="text-sm">The alphabet is currently claimed by {capitalize(alphabet.claim!)}.</p>}
      {alphabet.claim === undefined && <button
        className="grow-0 rounded-lg bg-green-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none
                         focus:ring-4 focus:ring-green-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300
                         disabled:hover:text-gray-500 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
        onClick={() => sendAlphabetEvent(claimAlphabet())}
      >
        Claim
      </button>}
      {alphabet.claim === username && <button
        className="grow-0 rounded-lg bg-red-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none
                         focus:ring-4 focus:ring-red-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300
                         disabled:hover:text-gray-500 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        onClick={() => sendAlphabetEvent(releaseAlphabet())}
      >
        Release
      </button>}
    </div>
  </div>;
}
