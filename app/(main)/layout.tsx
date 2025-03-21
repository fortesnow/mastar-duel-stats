import Navigation from '../../components/Navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative z-0">
      <Navigation />
      <main className="container mx-auto px-4 py-8 relative z-0">
        {children}
      </main>
    </div>
  );
} 