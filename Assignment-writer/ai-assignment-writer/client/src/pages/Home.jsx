import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PenTool, Zap, ShieldCheck, Clock, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { Badge } from '../components/Badge';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    { icon: ShieldCheck, title: "Zero Plagiarism", desc: "100% unique content backed by citations." },
    { icon: Clock, title: "Instant Drafts", desc: "Get a complete assignment in under 60 seconds." },
    { icon: BookOpen, title: "Academic Tone", desc: "Perfectly formatted for high school to PhD levels." },
    { icon: Sparkles, title: "Smart Visuals", desc: "AI automatically inserts relevant diagrams & charts." },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[var(--radius-control)] bg-[color:var(--color-primary)] text-white shadow-[var(--shadow-1)] grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">AI Assignment Writer</div>
              <div className="text-xs text-[color:var(--color-text-muted)]">Generate, preview, export</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => window.open('https://github.com', '_blank')}>
              View Examples
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => navigate('/form')}>
              Create
            </Button>
          </div>
        </header>

        <main id="main" className="mt-12">
          <section className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" className="bg-white/70 backdrop-blur">
                  <Zap className="mr-2 h-4 w-4 text-amber-500" />
                  No signup required
                </Badge>
                <Badge variant="neutral" className="bg-white/70 backdrop-blur">
                  Academic formatting + export
                </Badge>
              </div>

              <h1 className="mt-6 text-step-5 font-extrabold tracking-tight text-[color:var(--color-text)]">
                Write better assignments,
                <span className="text-gradient"> faster</span>.
              </h1>

              <p className="mt-4 text-base text-[color:var(--color-text-muted)] sm:text-lg">
                Turn a topic into a structured academic draft with citations and optional visuals. Copy the result or export to Word/PDF.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="rounded-full" onClick={() => navigate('/form')}>
                  <PenTool className="mr-2 h-5 w-5" />
                  Create an assignment
                </Button>
                <Button variant="secondary" size="lg" className="rounded-full" onClick={() => navigate('/result')}>
                  Preview last result
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-card)] bg-white/70 p-4 shadow-[var(--shadow-1)] backdrop-blur">
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">Structured outputs</div>
                  <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">Clear headings, sections, and consistent spacing.</div>
                </div>
                <div className="rounded-[var(--radius-card)] bg-white/70 p-4 shadow-[var(--shadow-1)] backdrop-blur">
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">Smart visuals</div>
                  <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">Generate diagrams and charts aligned to your sections.</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card className="glass-panel overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] bg-blue-50 text-blue-700">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--color-text)]">What you get</div>
                      <div className="text-xs text-[color:var(--color-text-muted)]">In under a minute, typically</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {[
                      { icon: ShieldCheck, title: 'Original draft', desc: 'A fresh write-up tailored to your topic.' },
                      { icon: Clock, title: 'Fast iteration', desc: 'Regenerate quickly with new settings.' },
                      { icon: Sparkles, title: 'Polished formatting', desc: 'Readable hierarchy and export-ready output.' }
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-white/60 p-4 shadow-[var(--shadow-1)]">
                        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-[var(--radius-control)] bg-black/5 text-[color:var(--color-text)]">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.title}</div>
                          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-step-2 font-bold text-[color:var(--color-text)]">Key features</h2>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">Designed for clarity, speed, and export-quality formatting.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} hover className="bg-white/80 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-control)] bg-blue-50 text-blue-700">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[color:var(--color-text)]">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </section>

          <footer className="mt-12 flex flex-col items-center gap-2 border-t border-[color:var(--color-border)] py-8 text-center">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">AI Assignment Writer</div>
            <div className="text-xs text-[color:var(--color-text-muted)]">© {new Date().getFullYear()} • Educational assistance tool</div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Home;
