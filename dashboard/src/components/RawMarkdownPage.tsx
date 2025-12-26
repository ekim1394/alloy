import { useEffect } from 'react';

interface RawMarkdownPageProps {
  content: string;
  title?: string;
}

export default function RawMarkdownPage({ content, title }: RawMarkdownPageProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Alloy CI`;
    }
  }, [title]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-base-100 rounded-lg p-6 md:p-10 border border-base-200 shadow-sm">
        <pre
          style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
          className="font-mono text-sm leading-relaxed"
        >
          {content}
        </pre>
      </div>
    </div>
  );
}
