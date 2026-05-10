import Map from './components/Map';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f1ea] text-[#1a1a1a] flex flex-col font-semibold">
      {/* Top bar with logo */}
      <header className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold tracking-wide uppercase text-[#3da95c]">
          Route Runner
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#1a1a1a]/60 mt-1">
          Run there. Arrive on time.
        </p>
      </header>

      {/* Main content area */}
      <div className="flex-1 px-6 pb-6 flex flex-col gap-5">
        {/* Destination search */}
        <section className="bg-white rounded-2xl p-5 shadow-[0_4px_0_0_#3da95c33,0_8px_24px_-8px_rgba(61,169,92,0.15)]">
          <label className="block text-xs font-bold text-[#3da95c] uppercase tracking-widest mb-2">
            Destination
          </label>
          <input
            type="text"
            placeholder="THE CROWN, BATTERSEA"
            className="w-full text-lg uppercase tracking-wide bg-transparent outline-none placeholder:text-[#1a1a1a]/30"
          />
        </section>

        {/* Pace input */}
        <section className="bg-white rounded-2xl p-5 shadow-[0_4px_0_0_#3da95c33,0_8px_24px_-8px_rgba(61,169,92,0.15)]">
          <label className="block text-xs font-bold text-[#3da95c] uppercase tracking-widest mb-2">
            Pace
          </label>
          <div className="flex items-baseline gap-3">
            <input
              type="text"
              defaultValue="5:30"
              className="text-3xl font-bold bg-transparent outline-none w-24"
            />
            <span className="text-xs uppercase tracking-widest text-[#1a1a1a]/60">Per Km</span>
          </div>
        </section>

        {/* Map / route results */}
        <section className="relative flex-1 bg-white rounded-2xl shadow-[0_4px_0_0_#3da95c33,0_8px_24px_-8px_rgba(61,169,92,0.15)] min-h-[300px] overflow-hidden">
          <Map />
        </section>

        {/* Plan button */}
        <div className="flex justify-center pt-2">
          <button className="bg-[#3da95c] text-white rounded-full py-3.5 px-10 text-sm uppercase tracking-widest font-bold shadow-[0_4px_0_0_#2d8045] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#2d8045] active:translate-y-[2px] active:shadow-[0_2px_0_0_#2d8045] transition-all">
            Plan My Route
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/40">
          Powered by <span className="font-bold not-italic">KIWI</span><span className="font-bold italic">RUNNERS</span>
        </p>
      </footer>
    </main>
  );
}