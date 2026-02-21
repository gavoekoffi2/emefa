export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
