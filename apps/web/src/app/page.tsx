import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-[#f2e6db] to-background py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-3xl fade-in">
          <Badge className="mb-6 font-medium tracking-widest text-primary bg-primary/10">THE NEW WAY TO BARBER</Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight text-[#2a221d]">
            Book Your Spot.<br />
            <span className="text-primary italic">Skip the Queue.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            No more waiting for hours in unpredictable salon queues. Lock your spot for just ₹10 and track your turn in real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/search">
              <Button size="lg" className="w-full sm:w-auto min-w-[200px]">Find a Salon</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">For Salon Owners</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 w-full max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-16">How SnipQ Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-soft text-center group hover:-translate-y-1 transition-transform">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary text-2xl font-bold">1</div>
            <h3 className="text-xl font-heading font-bold mb-3">Find & Select</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Browse salons near you, see live wait times, and choose your preferred barber and service.</p>
          </div>
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-soft text-center group hover:-translate-y-1 transition-transform">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary text-2xl font-bold">2</div>
            <h3 className="text-xl font-heading font-bold mb-3">Lock with ₹10</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Pay a small commitment fee to instantly lock your slot. Ensure you get served exactly when promised.</p>
          </div>
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-soft text-center group hover:-translate-y-1 transition-transform">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary text-2xl font-bold">3</div>
            <h3 className="text-xl font-heading font-bold mb-3">Track Live</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Watch the queue move in real-time on your phone. Arrive just in time, get your cut, and pay the rest at the shop.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Badge } from "@/components/ui/Badge";
