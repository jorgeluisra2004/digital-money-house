import Header from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
      </main>
      <footer className="bg-dmh-grayFooter text-gray-300 py-4">
        <div className="max-w-6xl mx-auto px-6 lg:px-20">
          <p className="text-sm">© 2022 Digital Money House</p>
        </div>
      </footer>
    </>
  );
}
