export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[calc(100vh-4rem)]">{children}</div>;
}
