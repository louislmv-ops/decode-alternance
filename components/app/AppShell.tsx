import { TabBar, TopBar } from '@/components/TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <TopBar />
      <main className="canvas">{children}</main>
      <TabBar />
    </div>
  );
}
