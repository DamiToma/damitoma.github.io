export default function Paragraph({ children }: { children: React.ReactNode }) {
    return <p className="mb-4 text-justify">{children}</p>;
}