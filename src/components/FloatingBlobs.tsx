export default function FloatingBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-float-slow absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="animate-float-slower absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-gradient-via/30 blur-3xl" />
      <div className="animate-float-slow absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-gradient-via/20 blur-3xl" />
    </div>
  );
}
